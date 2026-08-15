import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  categoryId: z.string().min(1, "Elegí una categoría"),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo").optional(),
  imageUrl: z.string().trim().url("URL inválida").optional().or(z.literal("")),
  allowsFlavors: z.boolean().default(false),
  maxFlavors: z.coerce.number().int().min(0).max(10).default(0),
  active: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(40),
});

export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(40),
  order: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

export const counterProductSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
});

export type CounterProductInput = z.infer<typeof counterProductSchema>;
