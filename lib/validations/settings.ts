import { z } from "zod";

export const generalSettingsSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80),
  logoUrl: z.string().trim().url("URL inválida").optional().or(z.literal("")),
  currency: z.string().trim().min(1).max(10),
  taxRate: z.coerce.number().min(0).max(100),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
});

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Usá un color hex válido (ej. #EE7FAC)");

export const themeSettingsSchema = z.object({
  primaryColor: hexColor,
  secondaryColor: hexColor,
  accentColor: hexColor,
});

export const printSettingsSchema = z.object({
  ticketHeader: z.string().trim().max(200).optional().or(z.literal("")),
  ticketFooter: z.string().trim().max(200).optional().or(z.literal("")),
  paperWidth: z.enum(["58mm", "80mm"]),
  copies: z.coerce.number().int().min(1).max(4),
});

export const autoservicioSettingsSchema = z.object({
  waitMinutes: z.coerce.number().int().min(0).max(180),
});

export const promotionSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(100),
  type: z.string().min(1, "Elegí un tipo"),
  value: z.coerce.number().min(0).optional(),
  minQuantity: z.coerce.number().int().min(0).optional(),
  daysOfWeek: z.string().trim().max(40).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  active: z.boolean().default(true),
});

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;
export type ThemeSettingsInput = z.infer<typeof themeSettingsSchema>;
export type PrintSettingsInput = z.infer<typeof printSettingsSchema>;
export type AutoservicioSettingsInput = z.infer<typeof autoservicioSettingsSchema>;
export type PromotionInput = z.infer<typeof promotionSchema>;
