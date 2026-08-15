import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerSchema>;
