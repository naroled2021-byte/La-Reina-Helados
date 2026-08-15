"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resetEmployeePassword } from "@/lib/actions/employee-actions";
import type { EmployeeRow } from "@/components/employees/types";

export function PasswordResetDialog({
  employee,
  onOpenChange,
}: {
  employee: EmployeeRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!employee} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {employee && <ResetForm key={employee.id} employee={employee} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function ResetForm({
  employee,
  onOpenChange,
}: {
  employee: EmployeeRow;
  onOpenChange: (open: boolean) => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await resetEmployeePassword(employee.id, { password });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(`Contraseña de ${employee.name} actualizada`);
      onOpenChange(false);
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cambiar contraseña — {employee.name}</DialogTitle>
        <DialogDescription>Se va a reemplazar la contraseña actual.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            autoFocus
          />
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
