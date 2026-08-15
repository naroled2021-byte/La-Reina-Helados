"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEmployee, updateEmployee } from "@/lib/actions/employee-actions";
import type { EmployeeRow, RoleOption } from "@/components/employees/types";

type FormState = { name: string; email: string; password: string; roleId: string; active: boolean };

function initialFormState(employee: EmployeeRow | null, roles: RoleOption[]): FormState {
  if (employee) {
    return { name: employee.name, email: employee.email, password: "", roleId: employee.roleId, active: employee.active };
  }
  // Nunca preseleccionar "Administrador" para no crear admins por accidente.
  const defaultRole = roles.find((r) => !r.name.toLowerCase().includes("admin")) ?? roles[0];
  return { name: "", email: "", password: "", roleId: defaultRole?.id ?? "", active: true };
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  roles,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeRow | null;
  roles: RoleOption[];
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        {open && (
          <EmployeeForm
            key={employee?.id ?? "create"}
            employee={employee}
            roles={roles}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EmployeeForm({
  employee,
  roles,
  onOpenChange,
  onSaved,
}: {
  employee: EmployeeRow | null;
  roles: RoleOption[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialFormState(employee, roles));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = employee
        ? await updateEmployee(employee.id, {
            name: form.name,
            email: form.email,
            roleId: form.roleId,
            active: form.active,
          })
        : await createEmployee({ name: form.name, email: form.email, password: form.password, roleId: form.roleId });

      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(employee ? "Empleado actualizado" : "Empleado creado");
      onOpenChange(false);
      onSaved();
      router.refresh();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{employee ? "Editar empleado" : "Nuevo empleado"}</DialogTitle>
        <DialogDescription>
          {employee ? "Actualizá los datos del empleado." : "Completá los datos del nuevo empleado."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </div>

        {!employee && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label>Rol</Label>
          <Select value={form.roleId} onValueChange={(v) => setForm((f) => ({ ...f, roleId: v ?? f.roleId }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elegí un rol">
                {(value: string) => roles.find((r) => r.id === value)?.name ?? "Elegí un rol"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {employee && (
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <Label htmlFor="active">Activo</Label>
            <Switch
              id="active"
              checked={form.active}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
            />
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {employee ? "Guardar cambios" : "Crear empleado"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
