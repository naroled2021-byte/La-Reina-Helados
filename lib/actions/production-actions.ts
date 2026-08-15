"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-helpers";
import {
  createProductionSchema,
  recordProductionSchema,
  type CreateProductionInput,
  type RecordProductionInput,
} from "@/lib/validations/production";
import { PRODUCTION_STATUS, INVENTORY_MOVEMENT_TYPE } from "@/lib/constants";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function createProduction(input: CreateProductionInput): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("production.manage");
  const parsed = createProductionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const production = await db.production.create({
    data: {
      status: PRODUCTION_STATUS.IN_PROGRESS,
      createdById: session.user.id,
      items: {
        create: parsed.data.items.map((item) => ({
          flavorId: item.flavorId,
          quantityPlanned: item.quantityPlanned,
          quantityProduced: 0,
          waste: 0,
        })),
      },
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "production.create",
      entity: "Production",
      entityId: production.id,
      metadata: JSON.stringify({ items: parsed.data.items.length }),
    },
  });

  revalidatePath("/admin/produccion");
  revalidatePath("/admin");
  return { ok: true, data: { id: production.id } };
}

export async function recordProductionItem(
  itemId: string,
  input: RecordProductionInput
): Promise<ActionResult> {
  const session = await requirePermission("production.manage");
  const parsed = recordProductionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { quantityProduced, waste } = parsed.data;

  const item = await db.productionItem.findUnique({
    where: { id: itemId },
    include: { flavor: true },
  });
  if (!item) return { ok: false, error: "Ítem de producción no encontrado" };
  if (!item.flavor.inventoryItemId) return { ok: false, error: "El sabor no tiene stock asociado" };

  const net = quantityProduced - waste;

  await db.$transaction(async (tx) => {
    await tx.productionItem.update({
      where: { id: itemId },
      data: { quantityProduced, waste },
    });

    await tx.inventoryItem.update({
      where: { id: item.flavor.inventoryItemId! },
      data: { currentStock: { increment: net } },
    });

    if (quantityProduced > 0) {
      await tx.inventoryMovement.create({
        data: {
          inventoryItemId: item.flavor.inventoryItemId!,
          type: INVENTORY_MOVEMENT_TYPE.PRODUCTION,
          quantity: quantityProduced,
          reason: `Producción #${item.productionId.slice(-6)}`,
          userId: session.user.id,
        },
      });
    }
    if (waste > 0) {
      await tx.inventoryMovement.create({
        data: {
          inventoryItemId: item.flavor.inventoryItemId!,
          type: INVENTORY_MOVEMENT_TYPE.WASTE,
          quantity: waste,
          reason: `Merma de producción #${item.productionId.slice(-6)}`,
          userId: session.user.id,
        },
      });
    }

    const siblings = await tx.productionItem.findMany({ where: { productionId: item.productionId } });
    const allRecorded = siblings.every((s) =>
      s.id === itemId ? quantityProduced > 0 || waste > 0 : s.quantityProduced > 0 || s.waste > 0
    );
    if (allRecorded) {
      await tx.production.update({
        where: { id: item.productionId },
        data: { status: PRODUCTION_STATUS.COMPLETED },
      });
    }
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "production.record_item",
      entity: "ProductionItem",
      entityId: itemId,
      metadata: JSON.stringify({ flavor: item.flavor.name, quantityProduced, waste }),
    },
  });

  revalidatePath("/admin/produccion");
  revalidatePath("/admin/sabores");
  revalidatePath("/admin/stock");
  revalidatePath("/admin");
  return { ok: true, data: undefined };
}
