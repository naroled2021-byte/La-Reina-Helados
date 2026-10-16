"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-helpers";
import {
  openRegisterSchema,
  movementSchema,
  updateMovementSchema,
  closeRegisterSchema,
  updateClosedRegisterSchema,
  type OpenRegisterInput,
  type MovementInput,
  type UpdateMovementInput,
  type CloseRegisterInput,
  type UpdateClosedRegisterInput,
} from "@/lib/validations/cash";
import { computeExpectedByMethod, computeExpectedCash, sumAmounts } from "@/lib/cash-utils";
import { getCashRegisterDetail } from "@/lib/queries/cash";
import { NOTIFICATION_TYPE, ROLES, CASH_MOVEMENT_TYPE } from "@/lib/constants";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

async function checkCashLimit(registerId: string, session: { user: { id: string } }) {
  const setting = await db.setting.findUnique({ where: { key: "cash.limit" } });
  const limit = setting ? Number(setting.value) : null;
  if (!limit || limit <= 0) return;

  const register = await db.cashRegister.findUnique({
    where: { id: registerId },
    include: { movements: true },
  });
  if (!register) return;

  const currentCash = computeExpectedCash(register.openingAmount, register.movements);
  if (currentCash <= limit) return;

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "cash.alert_limit",
      entity: "CashRegister",
      entityId: registerId,
      metadata: JSON.stringify({ amount: currentCash, limit }),
    },
  });

  await db.notification.create({
    data: {
      type: NOTIFICATION_TYPE.CASH_LIMIT_EXCEEDED,
      title: "Caja excedió el límite",
      message: `El efectivo en caja ($${currentCash.toLocaleString("es-AR")}) superó el límite configurado ($${limit.toLocaleString("es-AR")})`,
      link: "/admin/caja",
    },
  });
}

export async function updateCashLimit(limit: number | null): Promise<ActionResult> {
  const session = await requirePermission("cash.manage");

  await db.setting.upsert({
    where: { key: "cash.limit" },
    create: { key: "cash.limit", value: limit ? String(limit) : "", group: "cash" },
    update: { value: limit ? String(limit) : "" },
  });

  await db.auditLog.create({
    data: { userId: session.user.id, action: "settings.update_cash_limit", entity: "Setting", metadata: JSON.stringify({ limit }) },
  });

  revalidatePath("/admin/caja");
  return { ok: true, data: undefined };
}

export async function openCashRegister(input: OpenRegisterInput): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("cash.manage");
  const parsed = openRegisterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  // Abrir la caja requiere ser Administrador. Si quien está logueado no lo es, tiene que
  // ingresar el email y la contraseña de un Administrador para autorizarlo — sin cerrar su
  // propia sesión, solo se verifica acá.
  if (session.user.role !== ROLES.ADMIN) {
    const email = parsed.data.adminEmail?.trim();
    const password = parsed.data.adminPassword;
    if (!email || !password) {
      return { ok: false, error: "Necesitás la autorización de un administrador para abrir la caja" };
    }
    const admin = await db.user.findUnique({ where: { email }, include: { role: true } });
    if (!admin || admin.role.name !== ROLES.ADMIN || !admin.active) {
      return { ok: false, error: "Ese usuario no es un administrador activo" };
    }
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return { ok: false, error: "Contraseña de administrador incorrecta" };
  }

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

  const amount = parsed.data.type === "MANUAL_OPEN" ? 0 : parsed.data.amount ?? 0;

  await db.cashMovement.create({
    data: {
      cashRegisterId: register.id,
      type: parsed.data.type,
      amount,
      description: parsed.data.description || null,
      userId: session.user.id,
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: parsed.data.type === "MANUAL_OPEN" ? "cash.manual_open" : "cash.movement",
      entity: "CashRegister",
      entityId: register.id,
      metadata: JSON.stringify({ type: parsed.data.type, amount, description: parsed.data.description }),
    },
  });

  if (parsed.data.type === "MANUAL_OPEN") {
    await db.notification.create({
      data: {
        type: NOTIFICATION_TYPE.CASH_MANUAL_OPEN,
        title: "Apertura manual de caja",
        message: `${session.user.name ?? "Alguien"} abrió la caja sin venta: ${parsed.data.description}`,
        link: "/admin/caja",
      },
    });
  }

  if (parsed.data.type === "INCOME") await checkCashLimit(register.id, session);

  revalidatePath("/admin/caja");
  revalidatePath("/admin");
  return { ok: true, data: undefined };
}

// Un ingreso/egreso de la caja abierta lo puede tocar cualquiera con permiso de caja. Una vez
// cerrada esa caja, los movimientos quedan fijos para todos MENOS un Administrador — ya se
// usaron para calcular el esperado/declarado de ese cierre, así que si un Admin los corrige acá
// hay que volver a calcular ese cuadre (ver recomputeClosedRegisterTotals). Tampoco se puede
// editar/borrar una venta (SALE_CASH/SALE_DIGITAL) ni la apertura manual: solo INCOME/EXPENSE
// cargados a mano.
type EditableMovementCheck =
  | { ok: true; movement: Prisma.CashMovementGetPayload<{ include: { cashRegister: true } }> }
  | { ok: false; error: string };

async function getEditableMovement(id: string, session: { user: { role: string } }): Promise<EditableMovementCheck> {
  const movement = await db.cashMovement.findUnique({ where: { id }, include: { cashRegister: true } });
  if (!movement) return { ok: false, error: "Movimiento no encontrado" };
  if (movement.type !== CASH_MOVEMENT_TYPE.INCOME && movement.type !== CASH_MOVEMENT_TYPE.EXPENSE) {
    return { ok: false, error: "Solo se pueden editar ingresos o egresos cargados a mano" };
  }
  if (movement.cashRegister.status !== "OPEN" && session.user.role !== ROLES.ADMIN) {
    return { ok: false, error: "Esta caja ya está cerrada — solo un Administrador puede modificarla" };
  }
  return { ok: true, movement };
}

// Si el movimiento tocado pertenece a una caja ya cerrada, el esperado/diferencia de ese cierre
// quedaron calculados con los movimientos de ANTES del cambio — hay que recalcularlos con los
// movimientos actuales para que el cuadre siga siendo correcto.
async function recomputeClosedRegisterTotals(registerId: string) {
  const register = await db.cashRegister.findUnique({ where: { id: registerId }, include: { movements: true } });
  if (!register || register.status !== "CLOSED") return;

  const expectedByMethod = computeExpectedByMethod(register.openingAmounts as Record<string, number>, register.movements);
  const expected = sumAmounts(expectedByMethod);
  const declared = (register.closingDeclaredAmounts as Record<string, number> | null) ?? {};
  const declaredTotal = sumAmounts(declared);

  await db.cashRegister.update({
    where: { id: registerId },
    data: { closingAmountExpected: expected, closingExpectedAmounts: expectedByMethod, difference: declaredTotal - expected },
  });
}

export async function updateCashMovement(input: UpdateMovementInput): Promise<ActionResult> {
  const session = await requirePermission("cash.manage");
  const parsed = updateMovementSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const check = await getEditableMovement(parsed.data.id, session);
  if (!check.ok) return check;
  const { movement } = check;

  await db.cashMovement.update({
    where: { id: movement.id },
    data: { amount: parsed.data.amount, description: parsed.data.description || null },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "cash.movement_update",
      entity: "CashMovement",
      entityId: movement.id,
      metadata: JSON.stringify({
        before: { amount: movement.amount, description: movement.description },
        after: { amount: parsed.data.amount, description: parsed.data.description },
      }),
    },
  });

  if (movement.cashRegister.status === "CLOSED") await recomputeClosedRegisterTotals(movement.cashRegisterId);
  if (movement.type === CASH_MOVEMENT_TYPE.INCOME) await checkCashLimit(movement.cashRegisterId, session);

  revalidatePath("/admin/caja");
  revalidatePath("/admin");
  revalidatePath("/admin/reportes");
  return { ok: true, data: undefined };
}

export async function deleteCashMovement(id: string): Promise<ActionResult> {
  const session = await requirePermission("cash.manage");

  const check = await getEditableMovement(id, session);
  if (!check.ok) return check;
  const { movement } = check;

  await db.cashMovement.delete({ where: { id: movement.id } });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "cash.movement_delete",
      entity: "CashMovement",
      entityId: movement.id,
      metadata: JSON.stringify({ type: movement.type, amount: movement.amount, description: movement.description }),
    },
  });

  if (movement.cashRegister.status === "CLOSED") await recomputeClosedRegisterTotals(movement.cashRegisterId);

  revalidatePath("/admin/caja");
  revalidatePath("/admin");
  revalidatePath("/admin/reportes");
  return { ok: true, data: undefined };
}

// Caja ya cerrada: la detalla (para el modal de edición) y permite corregir lo declarado por
// método de pago + las notas — restringido a Administrador, ver AskUserQuestion del pedido.
export async function fetchCashRegisterForCaja(id: string) {
  await requirePermission("cash.manage");
  return getCashRegisterDetail(id);
}

export async function updateClosedRegister(input: UpdateClosedRegisterInput): Promise<ActionResult> {
  const session = await requirePermission("cash.manage");
  if (session.user.role !== ROLES.ADMIN) {
    return { ok: false, error: "Solo un Administrador puede editar un cierre ya hecho" };
  }

  const parsed = updateClosedRegisterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const register = await db.cashRegister.findUnique({ where: { id: parsed.data.id }, include: { movements: true } });
  if (!register) return { ok: false, error: "Caja no encontrada" };
  if (register.status !== "CLOSED") return { ok: false, error: "Esta caja no está cerrada" };

  const expectedByMethod = computeExpectedByMethod(register.openingAmounts as Record<string, number>, register.movements);
  const expected = sumAmounts(expectedByMethod);
  const declaredTotal = sumAmounts(parsed.data.declaredAmounts);
  const difference = declaredTotal - expected;

  await db.cashRegister.update({
    where: { id: register.id },
    data: {
      closingDeclaredAmounts: parsed.data.declaredAmounts,
      closingAmountDeclared: declaredTotal,
      closingExpectedAmounts: expectedByMethod,
      closingAmountExpected: expected,
      difference,
      notes: parsed.data.notes || register.notes,
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "cash.closure_update",
      entity: "CashRegister",
      entityId: register.id,
      metadata: JSON.stringify({
        before: { declared: register.closingDeclaredAmounts, expected: register.closingAmountExpected, difference: register.difference },
        after: { declared: parsed.data.declaredAmounts, expected, difference },
      }),
    },
  });

  revalidatePath("/admin/caja");
  revalidatePath("/admin");
  revalidatePath("/admin/reportes");
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
