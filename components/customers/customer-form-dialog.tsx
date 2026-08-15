"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createCustomer, updateCustomer } from "@/lib/actions/customer-actions";
import type { CustomerRow } from "@/components/customers/types";

type FormState = { name: string; phone: string; email: string; address: string; notes: string };

function initialFormState(customer: CustomerRow | null): FormState {
  return {
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    address: customer?.address ?? "",
    notes: customer?.notes ?? "",
  };
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerRow | null;
  onSaved: (customer?: { id: string; name: string }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        {open && (
          <CustomerForm
            key={customer?.id ?? "create"}
            customer={customer}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CustomerForm({
  customer,
  onOpenChange,
  onSaved,
}: {
  customer: CustomerRow | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (customer?: { id: string; name: string }) => void;
}) {
  const [form, setForm] = useState<FormState>(() => initialFormState(customer));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = customer ? await updateCustomer(customer.id, form) : await createCustomer(form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(customer ? "Cliente actualizado" : "Cliente creado");
      onOpenChange(false);
      onSaved(customer ? undefined : res.data);
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{customer ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
        <DialogDescription>
          {customer ? "Actualizá los datos de contacto." : "Completá los datos del nuevo cliente."}
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

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notas / preferencias</Label>
          <Textarea
            id="notes"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Ej: prefiere sabores sin TACC"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {customer ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
