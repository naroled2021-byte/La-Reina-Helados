"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-helpers";
import {
  generalSettingsSchema,
  themeSettingsSchema,
  printSettingsSchema,
  type GeneralSettingsInput,
  type ThemeSettingsInput,
  type PrintSettingsInput,
} from "@/lib/validations/settings";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

async function upsertSettings(entries: [string, string, string][]) {
  await db.$transaction(
    entries.map(([key, value, group]) =>
      db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value, group },
      })
    )
  );
}

export async function updateGeneralSettings(input: GeneralSettingsInput): Promise<ActionResult> {
  const session = await requirePermission("settings.manage");
  const parsed = generalSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  await upsertSettings([
    ["business.name", d.name, "general"],
    ["business.logoUrl", d.logoUrl || "", "general"],
    ["business.currency", d.currency, "general"],
    ["business.taxRate", String(d.taxRate), "general"],
    ["business.address", d.address || "", "general"],
    ["business.phone", d.phone || "", "general"],
    ["business.email", d.email || "", "general"],
  ]);

  await db.auditLog.create({
    data: { userId: session.user.id, action: "settings.update_general", entity: "Setting" },
  });

  revalidatePath("/admin/configuracion");
  return { ok: true, data: undefined };
}

export async function updateThemeSettings(input: ThemeSettingsInput): Promise<ActionResult> {
  const session = await requirePermission("settings.manage");
  const parsed = themeSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  await upsertSettings([
    ["theme.primaryColor", d.primaryColor, "appearance"],
    ["theme.secondaryColor", d.secondaryColor, "appearance"],
    ["theme.accentColor", d.accentColor, "appearance"],
  ]);

  await db.auditLog.create({
    data: { userId: session.user.id, action: "settings.update_theme", entity: "Setting" },
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

export async function updatePrintSettings(input: PrintSettingsInput): Promise<ActionResult> {
  const session = await requirePermission("settings.manage");
  const parsed = printSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  await upsertSettings([
    ["print.ticketHeader", d.ticketHeader || "", "print"],
    ["print.ticketFooter", d.ticketFooter || "", "print"],
    ["print.paperWidth", d.paperWidth, "print"],
  ]);

  await db.auditLog.create({
    data: { userId: session.user.id, action: "settings.update_print", entity: "Setting" },
  });

  revalidatePath("/admin/configuracion");
  return { ok: true, data: undefined };
}

export async function togglePaymentMethod(id: string): Promise<ActionResult<{ enabled: boolean }>> {
  const session = await requirePermission("settings.manage");

  const method = await db.paymentMethodConfig.findUnique({ where: { id } });
  if (!method) return { ok: false, error: "Método no encontrado" };

  const updated = await db.paymentMethodConfig.update({
    where: { id },
    data: { enabled: !method.enabled },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: updated.enabled ? "settings.enable_payment_method" : "settings.disable_payment_method",
      entity: "PaymentMethodConfig",
      entityId: id,
      metadata: JSON.stringify({ label: method.label }),
    },
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/ventas");
  return { ok: true, data: { enabled: updated.enabled } };
}
