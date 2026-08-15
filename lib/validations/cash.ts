import { z } from "zod";

export const openRegisterSchema = z.object({
  openingAmounts: z.record(z.string(), z.coerce.number().min(0, "No puede ser negativo")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

export const movementSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  description: z.string().trim().max(200).optional().or(z.literal("")),
});

export const closeRegisterSchema = z.object({
  declaredAmounts: z.record(z.string(), z.coerce.number().min(0, "No puede ser negativo")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

export type OpenRegisterInput = z.infer<typeof openRegisterSchema>;
export type MovementInput = z.infer<typeof movementSchema>;
export type CloseRegisterInput = z.infer<typeof closeRegisterSchema>;
