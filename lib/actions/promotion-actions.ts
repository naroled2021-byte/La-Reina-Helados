"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-helpers";
import { promotionSchema, type PromotionInput } from "@/lib/validations/settings";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

function toPromotionData(data: PromotionInput) {
  return {
    name: data.name,
    type: data.type,
    value: data.value ?? null,
    minQuantity: data.minQuantity ?? null,
    daysOfWeek: data.daysOfWeek || null,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    active: data.active,
  };
}

export async function createPromotion(input: PromotionInput): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("settings.manage");
  const parsed = promotionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const promotion = await db.promotion.create({ data: toPromotionData(parsed.data) });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "promotion.create",
      entity: "Promotion",
      entityId: promotion.id,
      metadata: JSON.stringify({ name: promotion.name }),
    },
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/reportes");
  return { ok: true, data: { id: promotion.id } };
}

export async function updatePromotion(id: string, input: PromotionInput): Promise<ActionResult> {
  const session = await requirePermission("settings.manage");
  const parsed = promotionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await db.promotion.update({ where: { id }, data: toPromotionData(parsed.data) });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "promotion.update",
      entity: "Promotion",
      entityId: id,
      metadata: JSON.stringify({ name: parsed.data.name }),
    },
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/reportes");
  return { ok: true, data: undefined };
}

export async function togglePromotionActive(id: string): Promise<ActionResult<{ active: boolean }>> {
  const session = await requirePermission("settings.manage");

  const promotion = await db.promotion.findUnique({ where: { id } });
  if (!promotion) return { ok: false, error: "Promoción no encontrada" };

  const updated = await db.promotion.update({
    where: { id },
    data: { active: !promotion.active },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: updated.active ? "promotion.activate" : "promotion.deactivate",
      entity: "Promotion",
      entityId: id,
      metadata: JSON.stringify({ name: promotion.name }),
    },
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/reportes");
  return { ok: true, data: { active: updated.active } };
}
