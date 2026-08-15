"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateGeneralSettings } from "@/lib/actions/settings-actions";

export function GeneralTab({ settingsMap }: { settingsMap: Record<string, string> }) {
  const [form, setForm] = useState({
    name: settingsMap["business.name"] ?? "",
    logoUrl: settingsMap["business.logoUrl"] ?? "",
    currency: settingsMap["business.currency"] ?? "ARS",
    taxRate: settingsMap["business.taxRate"] ?? "21",
    address: settingsMap["business.address"] ?? "",
    phone: settingsMap["business.phone"] ?? "",
    email: settingsMap["business.email"] ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateGeneralSettings({ ...form, taxRate: form.taxRate as never });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Datos del negocio actualizados");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre de la heladería</Label>
        <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="logoUrl">Logo (URL)</Label>
        <Input
          id="logoUrl"
          placeholder="https://..."
          value={form.logoUrl}
          onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currency">Moneda</Label>
          <Input id="currency" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="taxRate">Impuesto (%)</Label>
          <Input
            id="taxRate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.taxRate}
            onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
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

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Guardar
      </Button>
    </form>
  );
}
