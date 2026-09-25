"use client";

import { useState, useTransition } from "react";
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
import { createInventoryItem, updateInventoryItem } from "@/lib/actions/inventory-actions";
import { creatableInventoryTypes } from "@/lib/validations/inventory";
import { INVENTORY_ITEM_TYPE_LABEL, INVENTORY_UNIT_OPTIONS } from "@/lib/constants";
import type { InventoryItemRow } from "@/components/inventory/types";

type FormState = {
  name: string;
  type: string;
  unit: string;
  minStock: string;
  maxStock: string;
  price: string;
  active: boolean;
  initialStock: string;
};

function initialFormState(item: InventoryItemRow | null): FormState {
  if (item) {
    return {
      name: item.name,
      type: item.type,
      unit: item.unit,
      minStock: String(item.minStock),
      maxStock: String(item.maxStock),
      price: item.price ? String(item.price) : "",
      active: item.active,
      initialStock: String(item.currentStock),
    };
  }
  return {
    name: "",
    type: "SUPPLY",
    unit: "unidad",
    minStock: "10",
    maxStock: "20",
    price: "",
    active: true,
    initialStock: "0",
  };
}

export function InventoryItemFormDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItemRow | null;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        {open && (
          <InventoryItemForm key={item?.id ?? "create"} item={item} onSaved={onSaved} onOpenChange={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function InventoryItemForm({
  item,
  onSaved,
  onOpenChange,
}: {
  item: InventoryItemRow | null;
  onSaved: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<FormState>(() => initialFormState(item));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name: form.name,
      type: form.type,
      unit: form.unit,
      minStock: form.minStock,
      maxStock: form.maxStock,
      price: form.price || undefined,
      active: form.active,
    };

    startTransition(async () => {
      const res = item
        ? await updateInventoryItem(item.id, payload as never)
        : await createInventoryItem({ ...payload, initialStock: form.initialStock } as never);

      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(item ? "Ítem actualizado" : "Ítem creado");
      onOpenChange(false);
      onSaved();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{item ? "Editar ítem" : "Nuevo ítem de stock"}</DialogTitle>
        <DialogDescription>
          {item ? "Actualizá los datos del ítem." : "Completá los datos del nuevo ítem de inventario."}
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
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v ?? f.type }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tipo">
                  {(value: string) => INVENTORY_ITEM_TYPE_LABEL[value] ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {creatableInventoryTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {INVENTORY_ITEM_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Unidad</Label>
            <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v ?? f.unit }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Unidad">{(value: string) => value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {INVENTORY_UNIT_OPTIONS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {!item && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="initialStock">Stock inicial</Label>
              <Input
                id="initialStock"
                type="number"
                min="0"
                step="0.5"
                value={form.initialStock}
                onChange={(e) => setForm((f) => ({ ...f, initialStock: e.target.value }))}
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minStock">Stock mínimo</Label>
            <Input
              id="minStock"
              type="number"
              min="0"
              step="0.5"
              value={form.minStock}
              onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maxStock">Stock máximo</Label>
            <Input
              id="maxStock"
              type="number"
              min="0"
              step="0.5"
              value={form.maxStock}
              onChange={(e) => setForm((f) => ({ ...f, maxStock: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">Precio (opcional)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />
        </div>

        {item && (
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
            {item ? "Guardar cambios" : "Crear ítem"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
