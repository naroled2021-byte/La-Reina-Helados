"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-helpers";
import {
  openRegisterSchema,
  movementSchema,
  closeRegisterSchema,
  type OpenRegisterInput,
  type MovementInput,
  type CloseRegisterInput,
} from "@/lib/validations/cash";
import { computeExpectedByMethod, sumAmounts } from "@/lib/cash-utils";
import { NOTIFICATION_TYPE } from "@/lib/constants";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function openCashRegister(input: OpenRegisterInput): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("cash.manage");
  const parsed = openRegisterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const existing = await db.cashRegister.findFirst({ where: { status: "OPEN" } });
  if (existing) return { ok: false, error: "Ya hay una caja abierta" };

  const openingAmount = sumAmounts(parsed.data.openingAmounts);
  const register = await db.cashRegister.create({
    data: {
      openedById: session.user.id,
      openingAmount,
      openingAmounts: parsed.data.openingAmounts,
      notes: parsed.data.notes || null,
      status: "OPEN",
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "cash.open",
      entity: "CashRegister",
      entityId: register.id,
      metadata: JSON.stringify({ openingAmounts: parsed.data.openingAmounts }),
    },
  });

  revalidatePath("/admin/caja");
  revalidatePath("/admin");
  return { ok: true, data: { id: register.id } };
}

export async function addCashMovement(input: MovementInput): Promise<ActionResult> {
  const session = await requirePermission("cash.manage");
  const parsed = movementSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const register = await db.cashRegister.findFirst({ where: { status: "OPEN" } });
  if (!register) return { ok: false, error: "No hay una caja abierta" };

  await db.cashMovement.create({
    data: {
      cashRegisterId: register.id,
      type: parsed.data.type,
      amount: parsed.data.amount,
      description: parsed.data.description || null,
      userId: session.user.id,
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "cash.movement",
      entity: "CashRegister",
      entityId: register.id,
      metadata: JSON.stringify({ type: parsed.data.type, amount: parsed.data.amount }),
    },
  });

  revalidatePath("/admin/caja");
  revalidatePath("/admin");
  return { ok: true, data: undefined };
}

export async function closeCashRegister(input: CloseRegisterInput): Promise<ActionResult<{ difference: number }>> {
  const session = await requirePermission("cash.manage");
  const parsed = closeRegisterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const register = await db.cashRegister.findFirst({
    where: { status: "OPEN" },
    include: { movements: true },
  });
  if (!register) return { ok: false, error: "No hay una caja abierta" };

  const expectedByMethod = computeExpectedByMethod(
    register.openingAmounts as Record<string, number>,
    register.movements
  );
  const expected = sumAmounts(expectedByMethod);
  const declared = sumAmounts(parsed.data.declaredAmounts);
  const difference = declared - expected;

  await db.cashRegister.update({
    where: { id: register.id },
    data: {
      status: "CLOSED",
      closedById: session.user.id,
      closedAt: new Date(),
      closingAmountExpected: expected,
      closingAmountDeclared: declared,
      closingExpectedAmounts: expectedByMethod,
      closingDeclaredAmounts: parsed.data.declaredAmounts,
      difference,
      notes: parsed.data.notes || register.notes,
    },
  });

  if (Math.abs(difference) > 0.01) {
    await db.notification.create({
      data: {
        type: NOTIFICATION_TYPE.CASH_DIFFERENCE,
        title: "Diferencia de caja",
        message: `Cierre con diferencia de $${difference.toLocaleString("es-AR")}`,
        link: "/admin/caja",
      },
    });
  }

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "cash.close",
      entity: "CashRegister",
      entityId: register.id,
      metadata: JSON.stringify({ expected, declared, difference }),
    },
  });

  revalidatePath("/admin/caja");
  revalidatePath("/admin");
  return { ok: true, data: { difference } };
}
