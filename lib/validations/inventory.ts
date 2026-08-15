import { z } from "zod";

export const creatableInventoryTypes = [
  "INGREDIENT",
  "PACKAGING",
  "TOPPING",
  "BEVERAGE",
  "SUPPLY",
  "FINISHED_PRODUCT",
] as const;

export const inventoryItemSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80),
  type: z.enum(creatableInventoryTypes),
  unit: z.string().trim().min(1, "Indicá una unidad").max(20),
  minStock: z.coerce.number().min(0, "No puede ser negativo"),
  maxStock: z.coerce.number().min(0, "No puede ser negativo"),
  cost: z.coerce.number().min(0, "No puede ser negativo").optional(),
  price: z.coerce.number().min(0, "No puede ser negativo").optional(),
  supplierId: z.string().optional().or(z.literal("")),
  active: z.boolean().default(true),
});

export const inventoryItemCreateSchema = inventoryItemSchema.extend({
  initialStock: z.coerce.number().min(0, "No puede ser negativo"),
});

export const stockMovementTypes = ["IN", "OUT", "WASTE", "ADJUSTMENT"] as const;

export const stockAdjustSchema = z
  .object({
    type: z.enum(stockMovementTypes),
    quantity: z.coerce.number(),
    reason: z.string().trim().max(200).optional().or(z.literal("")),
  })
  .refine((data) => (data.type === "ADJUSTMENT" ? data.quantity !== 0 : data.quantity > 0), {
    message: "La cantidad debe ser mayor a 0",
    path: ["quantity"],
  });

export const supplierNameSchema = z.string().trim().min(2, "El nombre es muy corto").max(80);

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type InventoryItemCreateInput = z.infer<typeof inventoryItemCreateSchema>;
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>;
