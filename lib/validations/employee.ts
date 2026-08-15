import { z } from "zod";

export const employeeCreateSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80),
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  roleId: z.string().min(1, "Elegí un rol"),
});

export const employeeUpdateSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80),
  email: z.string().trim().email("Email inválido"),
  roleId: z.string().min(1, "Elegí un rol"),
  active: z.boolean(),
});

export const passwordResetSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
