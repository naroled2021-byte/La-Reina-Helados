import { z } from "zod";
import { saleItemSchema } from "@/lib/validations/sale";

export const selfServiceOrderSchema = z
  .object({
    customerName: z.string().trim().min(2, "Ingresá tu nombre").max(80),
    type: z.enum(["TAKEAWAY", "DELIVERY"]),
    deliveryAddress: z.string().trim().max(200).optional().or(z.literal("")),
    cashTendered: z.coerce.number().positive("Indicá con cuánto pagás"),
    items: z.array(saleItemSchema).min(1, "Agregá al menos un producto"),
  })
  .refine((data) => data.type !== "DELIVERY" || !!data.deliveryAddress?.trim(), {
    message: "Indicá la dirección de entrega",
    path: ["deliveryAddress"],
  });

export type SelfServiceOrderInput = z.infer<typeof selfServiceOrderSchema>;
