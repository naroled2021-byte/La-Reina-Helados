import { z } from "zod";

export const productionItemInputSchema = z.object({
  flavorId: z.string().min(1),
  quantityPlanned: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
});

export const createProductionSchema = z.object({
  items: z.array(productionItemInputSchema).min(1, "Agregá al menos un sabor"),
});

export const recordProductionSchema = z.object({
  quantityProduced: z.coerce.number().min(0, "No puede ser negativo"),
  waste: z.coerce.number().min(0, "No puede ser negativo"),
});

export type CreateProductionInput = z.infer<typeof createProductionSchema>;
export type RecordProductionInput = z.infer<typeof recordProductionSchema>;
