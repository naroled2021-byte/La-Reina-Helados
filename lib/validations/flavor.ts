import { z } from "zod";

export const flavorCategoryValues = ["crema", "agua", "especial"] as const;

export const flavorSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(60),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  category: z.enum(flavorCategoryValues),
  imageUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "URL inválida")
    .optional()
    .or(z.literal("")),
  popular: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const flavorCreateSchema = flavorSchema.extend({
  initialStock: z.coerce.number().min(0, "No puede ser negativo"),
  minStock: z.coerce.number().min(0, "No puede ser negativo"),
});

export const flavorUpdateSchema = flavorSchema.extend({
  minStock: z.coerce.number().min(0, "No puede ser negativo"),
});

export type FlavorInput = z.infer<typeof flavorSchema>;
export type FlavorCreateInput = z.infer<typeof flavorCreateSchema>;
export type FlavorUpdateInput = z.infer<typeof flavorUpdateSchema>;
