import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  flavorIds: z.array(z.string()).default([]),
});

export const saleSchema = z
  .object({
    customerId: z.string().optional().or(z.literal("")),
    type: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]),
    tableNumber: z.string().trim().max(20).optional().or(z.literal("")),
    deliveryAddress: z.string().trim().max(200).optional().or(z.literal("")),
    paymentMethod: z.string().min(1, "Elegí un método de pago"),
    discount: z.coerce.number().min(0, "No puede ser negativo").default(0),
    items: z.array(saleItemSchema).min(1, "Agregá al menos un producto"),
  })
  .refine((data) => data.type !== "DELIVERY" || !!data.deliveryAddress?.trim(), {
    message: "Indicá la dirección de entrega",
    path: ["deliveryAddress"],
  });

export type SaleInput = z.infer<typeof saleSchema>;
export type SaleItemInput = z.infer<typeof saleItemSchema>;
