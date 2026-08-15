"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-helpers";
import {
  inventoryItemSchema,
  inventoryItemCreateSchema,
  stockAdjustSchema,
  supplierNameSchema,
  type InventoryItemInput,
  type InventoryItemCreateInput,
  type StockAdjustInput,
} from "@/lib/validations/inventory";
import { INVENTORY_ITEM_TYPE } from "@/lib/constants";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function createInventoryItem(
  input: InventoryItemCreateInput
): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("inventory.manage");
  const parsed = inventoryItemCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const item = await db.inventoryItem.create({
    data: {
      name: data.name,
      type: data.type,
      unit: data.unit,
      currentStock: data.initialStock,
      minStock: data.minStock,
      maxStock: data.maxStock,
      cost: data.cost ?? 0,
      price: data.price,
      supplierId: data.supplierId || null,
      active: true,
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "inventory.create",
      entity: "InventoryItem",
      entityId: item.id,
      metadata: JSON.stringify({ name: item.name }),
    },
  });

  revalidatePath("/admin/stock");
  revalidatePath("/admin");
  return { ok: true, data: { id: item.id } };
}

export async function updateInventoryItem(id: string, input: InventoryItemInput): Promise<ActionResult> {
  const session = await requirePermission("inventory.manage");
  const parsed = inventoryItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const existing = await db.inventoryItem.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Ítem no encontrado" };
  if (existing.type === INVENTORY_ITEM_TYPE.FLAVOR) {
    return { ok: false, error: "Este ítem se edita desde el módulo de Sabores" };
  }

  await db.inventoryItem.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      unit: data.unit,
      minStock: data.minStock,
      maxStock: data.maxStock,
      cost: data.cost ?? 0,
      price: data.price,
      supplierId: data.supplierId || null,
      active: data.active,
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "inventory.update",
      entity: "InventoryItem",
      entityId: id,
      metadata: JSON.stringify({ name: data.name }),
    },
  });

  revalidatePath("/admin/stock");
  revalidatePath("/admin");
  return { ok: true, data: undefined };
}

export async function toggleInventoryItemActive(id: string): Promise<ActionResult<{ active: boolean }>> {
  const session = await requirePermission("inventory.manage");

  const item = await db.inventoryItem.findUnique({ where: { id } });
  if (!item) return { ok: false, error: "Ítem no encontrado" };
  if (item.type === INVENTORY_ITEM_TYPE.FLAVOR) {
    return { ok: false, error: "Este ítem se activa/desactiva desde el módulo de Sabores" };
  }

  const updated = await db.inventoryItem.update({
    where: { id },
    data: { active: !item.active },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: updated.active ? "inventory.activate" : "inventory.deactivate",
      entity: "InventoryItem",
      entityId: id,
      metadata: JSON.stringify({ name: item.name }),
    },
  });

  revalidatePath("/admin/stock");
  revalidatePath("/admin");
  return { ok: true, data: { active: updated.active } };
}

export async function adjustStock(
  id: string,
  input: StockAdjustInput
): Promise<ActionResult<{ currentStock: number }>> {
  const session = await requirePermission("inventory.manage");
  const parsed = stockAdjustSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const item = await db.inventoryItem.findUnique({ where: { id } });
  if (!item) return { ok: false, error: "Ítem no encontrado" };

  const delta = data.type === "IN" ? data.quantity : data.type === "ADJUSTMENT" ? data.quantity : -data.quantity;
  const newStock = item.currentStock + delta;
  if (newStock < 0) return { ok: false, error: "Stock insuficiente para esta salida" };

  await db.$transaction([
    db.inventoryItem.update({ where: { id }, data: { currentStock: newStock } }),
    db.inventoryMovement.create({
      data: {
        inventoryItemId: id,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason || null,
        userId: session.user.id,
      },
    }),
  ]);

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "inventory.adjust_stock",
      entity: "InventoryItem",
      entityId: id,
      metadata: JSON.stringify({ name: item.name, type: data.type, quantity: data.quantity }),
    },
  });

  revalidatePath("/admin/stock");
  revalidatePath("/admin/sabores");
  revalidatePath("/admin");
  return { ok: true, data: { currentStock: newStock } };
}

export async function createSupplier(name: string): Promise<ActionResult<{ id: string; name: string }>> {
  await requirePermission("inventory.manage");
  const parsed = supplierNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const existing = await db.supplier.findFirst({ where: { name: parsed.data } });
  if (existing) return { ok: true, data: { id: existing.id, name: existing.name } };

  const supplier = await db.supplier.create({ data: { name: parsed.data } });
  revalidatePath("/admin/stock");
  return { ok: true, data: { id: supplier.id, name: supplier.name } };
}
