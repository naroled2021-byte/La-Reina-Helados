"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-helpers";
import {
  employeeCreateSchema,
  employeeUpdateSchema,
  passwordResetSchema,
  type EmployeeCreateInput,
  type EmployeeUpdateInput,
  type PasswordResetInput,
} from "@/lib/validations/employee";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function createEmployee(input: EmployeeCreateInput): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("employees.manage");
  const parsed = employeeCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) return { ok: false, error: "Ya existe un usuario con ese email" };

  const passwordHash = await bcrypt.hash(data.password, 10);
  const employee = await db.user.create({
    data: { name: data.name, email: data.email, passwordHash, roleId: data.roleId },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "employee.create",
      entity: "User",
      entityId: employee.id,
      metadata: JSON.stringify({ name: employee.name, email: employee.email }),
    },
  });

  revalidatePath("/admin/empleados");
  return { ok: true, data: { id: employee.id } };
}

export async function updateEmployee(id: string, input: EmployeeUpdateInput): Promise<ActionResult> {
  const session = await requirePermission("employees.manage");
  const parsed = employeeUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  if (!data.active && id === session.user.id) {
    return { ok: false, error: "No podés desactivarte a vos mismo" };
  }

  const existing = await db.user.findFirst({ where: { email: data.email, id: { not: id } } });
  if (existing) return { ok: false, error: "Ya existe un usuario con ese email" };

  await db.user.update({
    where: { id },
    data: { name: data.name, email: data.email, roleId: data.roleId, active: data.active },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "employee.update",
      entity: "User",
      entityId: id,
      metadata: JSON.stringify({ name: data.name, active: data.active }),
    },
  });

  revalidatePath("/admin/empleados");
  return { ok: true, data: undefined };
}

export async function resetEmployeePassword(id: string, input: PasswordResetInput): Promise<ActionResult> {
  const session = await requirePermission("employees.manage");
  const parsed = passwordResetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.user.update({ where: { id }, data: { passwordHash } });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "employee.reset_password",
      entity: "User",
      entityId: id,
    },
  });

  revalidatePath("/admin/empleados");
  return { ok: true, data: undefined };
}

export async function updateRolePermissions(
  roleId: string,
  permissionIds: string[]
): Promise<ActionResult> {
  const session = await requirePermission("employees.manage");

  const currentUser = await db.user.findUnique({ where: { id: session.user.id } });
  if (currentUser?.roleId === roleId && !permissionIds.length) {
    return { ok: false, error: "No podés dejar tu propio rol sin permisos" };
  }

  if (currentUser?.roleId === roleId) {
    const employeesPermission = await db.permission.findUnique({ where: { key: "employees.manage" } });
    if (employeesPermission && !permissionIds.includes(employeesPermission.id)) {
      const rolesWithPermission = await db.role.count({
        where: { permissions: { some: { key: "employees.manage" } } },
      });
      if (rolesWithPermission <= 1) {
        return {
          ok: false,
          error: "No podés quitarle 'employees.manage' al único rol que lo tiene",
        };
      }
    }
  }

  await db.role.update({
    where: { id: roleId },
    data: { permissions: { set: permissionIds.map((id) => ({ id })) } },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "role.update_permissions",
      entity: "Role",
      entityId: roleId,
      metadata: JSON.stringify({ count: permissionIds.length }),
    },
  });

  revalidatePath("/admin/empleados");
  return { ok: true, data: undefined };
}
