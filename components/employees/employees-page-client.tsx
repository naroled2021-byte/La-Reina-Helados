"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeCard } from "@/components/employees/employee-card";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
import { PasswordResetDialog } from "@/components/employees/password-reset-dialog";
import { RolePermissionsCard } from "@/components/employees/role-permissions-card";
import { ActivityLog } from "@/components/employees/activity-log";
import type {
  AuditLogRow,
  EmployeeRow,
  PermissionOption,
  RoleWithPermissions,
} from "@/components/employees/types";

export function EmployeesPageClient({
  currentUserId,
  employees,
  roles,
  permissions,
  auditLogs,
}: {
  currentUserId: string;
  employees: EmployeeRow[];
  roles: RoleWithPermissions[];
  permissions: PermissionOption[];
  auditLogs: AuditLogRow[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null);
  const [resettingEmployee, setResettingEmployee] = useState<EmployeeRow | null>(null);

  function openCreate() {
    setEditingEmployee(null);
    setFormOpen(true);
  }

  function openEdit(employee: EmployeeRow) {
    setEditingEmployee(employee);
    setFormOpen(true);
  }

  return (
    <Tabs defaultValue="employees">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="employees">Empleados</TabsTrigger>
          <TabsTrigger value="roles">Roles y permisos</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="employees" className="flex flex-col gap-5 pt-4">
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Nuevo empleado
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              isSelf={employee.id === currentUserId}
              onEdit={openEdit}
              onResetPassword={setResettingEmployee}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="roles" className="flex flex-col gap-4 pt-4">
        {roles.map((role) => (
          <RolePermissionsCard key={role.id} role={role} permissions={permissions} />
        ))}
      </TabsContent>

      <TabsContent value="activity" className="pt-4">
        <ActivityLog logs={auditLogs} />
      </TabsContent>

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editingEmployee}
        roles={roles}
        onSaved={() => {}}
      />
      <PasswordResetDialog
        employee={resettingEmployee}
        onOpenChange={(open) => !open && setResettingEmployee(null)}
      />
    </Tabs>
  );
}
