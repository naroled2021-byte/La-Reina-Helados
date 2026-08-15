"use client";

import { useTransition } from "react";
import { KeyRound, Pencil, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updateEmployee } from "@/lib/actions/employee-actions";
import type { EmployeeRow } from "@/components/employees/types";

export function EmployeeCard({
  employee,
  isSelf,
  onEdit,
  onResetPassword,
}: {
  employee: EmployeeRow;
  isSelf: boolean;
  onEdit: (employee: EmployeeRow) => void;
  onResetPassword: (employee: EmployeeRow) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const res = await updateEmployee(employee.id, {
        name: employee.name,
        email: employee.email,
        roleId: employee.roleId,
        active: checked,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(checked ? `${employee.name} activado` : `${employee.name} desactivado`);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserCircle className="size-6" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium leading-tight">
            {employee.name}
            {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(vos)</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">{employee.email}</p>
          <Badge variant="secondary" className="mt-1 text-[10px]">
            {employee.roleName}
          </Badge>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Último ingreso:{" "}
        {employee.lastLoginAt
          ? new Date(employee.lastLoginAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })
          : "Nunca"}
      </p>

      <div className="mt-auto flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Switch
            checked={employee.active}
            onCheckedChange={handleToggle}
            disabled={isPending || isSelf}
          />
          <Badge variant={employee.active ? "secondary" : "outline"} className="text-[10px]">
            {employee.active ? "Activo" : "Inactivo"}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => onResetPassword(employee)} aria-label="Cambiar contraseña">
            <KeyRound className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(employee)} aria-label="Editar empleado">
            <Pencil className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
