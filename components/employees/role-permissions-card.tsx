"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateRolePermissions } from "@/lib/actions/employee-actions";
import { PERMISSION_MODULE_LABEL, PERMISSION_LABEL } from "@/lib/constants";
import type { PermissionOption, RoleWithPermissions } from "@/components/employees/types";

export function RolePermissionsCard({
  role,
  permissions,
}: {
  role: RoleWithPermissions;
  permissions: PermissionOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(role.permissionIds));
  const [isPending, startTransition] = useTransition();

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionOption[]>();
    for (const p of permissions) {
      const moduleKey = p.key.split(".")[0];
      if (!map.has(moduleKey)) map.set(moduleKey, []);
      map.get(moduleKey)!.push(p);
    }
    return Array.from(map.entries());
  }, [permissions]);

  const dirty = useMemo(() => {
    const original = new Set(role.permissionIds);
    if (original.size !== selected.size) return true;
    for (const id of selected) if (!original.has(id)) return true;
    return false;
  }, [selected, role.permissionIds]);

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updateRolePermissions(role.id, Array.from(selected));
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Permisos de ${role.name} actualizados`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <h3 className="font-medium">{role.name}</h3>
          <Badge variant="secondary" className="text-[10px]">
            {role.userCount} usuario{role.userCount === 1 ? "" : "s"}
          </Badge>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!dirty || isPending}>
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          Guardar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {grouped.map(([moduleKey, perms]) => (
          <div key={moduleKey} className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {PERMISSION_MODULE_LABEL[moduleKey] ?? moduleKey}
            </p>
            {perms.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <Checkbox
                  id={`${role.id}-${p.id}`}
                  checked={selected.has(p.id)}
                  onCheckedChange={(checked) => toggle(p.id, checked === true)}
                />
                <Label htmlFor={`${role.id}-${p.id}`} className="text-xs font-normal">
                  {p.description || PERMISSION_LABEL[p.key] || p.key}
                </Label>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
