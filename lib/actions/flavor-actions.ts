"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-helpers";
import {
  flavorCreateSchema,
  flavorUpdateSchema,
  type FlavorCreateInput,
  type FlavorUpdateInput,
} from "@/lib/validations/flavor";
import { INVENTORY_ITEM_TYPE } from "@/lib/constants";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function createFlavor(input: FlavorCreateInput): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("products.manage");
  const parsed = flavorCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const flavor = await db.$transaction(async (tx) => {
    const inventoryItem = await tx.inventoryItem.create({
      data: {
        name: `Sabor: ${data.name}`,
        type: INVENTORY_ITEM_TYPE.FLAVOR,
        unit: "kg",
        currentStock: data.initialStock,
        minStock: data.minStock,
        maxStock: Math.max(data.minStock * 2, data.initialStock),
      },
    });

    return tx.flavor.create({
      data: {
        name: data.name,
        description: data.description || null,
        category: data.category,
        imageUrl: data.imageUrl || null,
        popular: data.popular,
        active: true,
        inventoryItemId: inventoryItem.id,
      },
    });
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "flavor.create",
      entity: "Flavor",
      entityId: flavor.id,
      metadata: JSON.stringify({ name: flavor.name }),
    },
  });

  revalidatePath("/admin/sabores");
  revalidatePath("/admin");
  return { ok: true, data: { id: flavor.id } };
}

export async function updateFlavor(id: string, input: FlavorUpdateInput): Promise<ActionResult> {
  const session = await requirePermission("products.manage");
  const parsed = flavorUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const existing = await db.flavor.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Sabor no encontrado" };

  await db.flavor.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      category: data.category,
      imageUrl: data.imageUrl || null,
      popular: data.popular,
      active: data.active,
    },
  });

  if (existing.inventoryItemId) {
    await db.inventoryItem.update({
      where: { id: existing.inventoryItemId },
      data: { minStock: data.minStock },
    });
  }

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "flavor.update",
      entity: "Flavor",
      entityId: id,
      metadata: JSON.stringify({ name: data.name }),
    },
  });

  revalidatePath("/admin/sabores");
  revalidatePath("/admin");
  return { ok: true, data: undefined };
}

export async function toggleFlavorActive(id: string): Promise<ActionResult<{ active: boolean }>> {
  const session = await requirePermission("products.manage");

  const flavor = await db.flavor.findUnique({ where: { id } });
  if (!flavor) return { ok: false, error: "Sabor no encontrado" };

  const updated = await db.flavor.update({
    where: { id },
    data: { active: !flavor.active },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: updated.active ? "flavor.activate" : "flavor.deactivate",
      entity: "Flavor",
      entityId: id,
      metadata: JSON.stringify({ name: flavor.name }),
    },
  });

  revalidatePath("/admin/sabores");
  revalidatePath("/admin");
  return { ok: true, data: { active: updated.active } };
}
