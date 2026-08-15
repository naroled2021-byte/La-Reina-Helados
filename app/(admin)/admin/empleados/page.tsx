import { requirePermission } from "@/lib/auth-helpers";
import { getEmployeesPageData } from "@/lib/queries/employees";
import { EmployeesPageClient } from "@/components/employees/employees-page-client";

export default async function EmpleadosPage() {
  const session = await requirePermission("employees.manage");

  const { users, roles, permissions, auditLogs } = await getEmployeesPageData();

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold">Empleados</h1>
        <p className="text-sm text-muted-foreground">Usuarios, roles y actividad del sistema</p>
      </div>

      <EmployeesPageClient
        currentUserId={session.user.id}
        employees={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          roleId: u.roleId,
          roleName: u.role.name,
          active: u.active,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        }))}
        roles={roles.map((r) => ({
          id: r.id,
          name: r.name,
          permissionIds: r.permissions.map((p) => p.id),
          userCount: r._count.users,
        }))}
        permissions={permissions.map((p) => ({ id: p.id, key: p.key, description: p.description }))}
        auditLogs={auditLogs.map((a) => ({
          id: a.id,
          userName: a.user?.name ?? null,
          action: a.action,
          entity: a.entity,
          entityId: a.entityId,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
