import { z } from "zod";

export const openRegisterSchema = z.object({
  openingAmounts: z.record(z.string(), z.coerce.number().min(0, "No puede ser negativo")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

export const movementSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE", "MANUAL_OPEN"]),
    amount: z.coerce.number().min(0).optional(),
    description: z.string().trim().max(200).optional().or(z.literal("")),
  })
  .refine((data) => data.type === "MANUAL_OPEN" || (data.amount ?? 0) > 0, {
    message: "El monto debe ser mayor a 0",
    path: ["amount"],
  })
  .refine((data) => data.type !== "MANUAL_OPEN" || !!data.description?.trim(), {
    message: "Indicá el motivo de la apertura",
    path: ["description"],
  });

export const closeRegisterSchema = z.object({
  declaredAmounts: z.record(z.string(), z.coerce.number().min(0, "No puede ser negativo")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

export type OpenRegisterInput = z.infer<typeof openRegisterSchema>;
export type MovementInput = z.infer<typeof movementSchema>;
export type CloseRegisterInput = z.infer<typeof closeRegisterSchema>;
