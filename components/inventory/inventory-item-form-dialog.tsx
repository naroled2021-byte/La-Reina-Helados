"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
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
import { createInventoryItem, createSupplier, updateInventoryItem } from "@/lib/actions/inventory-actions";
import { creatableInventoryTypes } from "@/lib/validations/inventory";
import { INVENTORY_ITEM_TYPE_LABEL } from "@/lib/constants";
import type { InventoryItemRow, SupplierOption } from "@/components/inventory/types";

type FormState = {
  name: string;
  type: string;
  unit: string;
  minStock: string;
  maxStock: string;
  cost: string;
  price: string;
  supplierId: string;
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
      cost: String(item.cost),
      price: item.price ? String(item.price) : "",
      supplierId: item.supplierId ?? "",
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
    cost: "",
    price: "",
    supplierId: "",
    active: true,
    initialStock: "0",
  };
}

export function InventoryItemFormDialog({
  open,
  onOpenChange,
  item,
  suppliers,
  onSupplierCreated,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItemRow | null;
  suppliers: SupplierOption[];
  onSupplierCreated: (supplier: SupplierOption) => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        {open && (
          <InventoryItemForm
            key={item?.id ?? "create"}
            item={item}
            suppliers={suppliers}
            onSupplierCreated={onSupplierCreated}
            onSaved={onSaved}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function InventoryItemForm({
  item,
  suppliers,
  onSupplierCreated,
  onSaved,
  onOpenChange,
}: {
  item: InventoryItemRow | null;
  suppliers: SupplierOption[];
  onSupplierCreated: (supplier: SupplierOption) => void;
  onSaved: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<FormState>(() => initialFormState(item));
  const [newSupplierName, setNewSupplierName] = useState("");
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAddSupplier() {
    if (!newSupplierName.trim()) return;
    startTransition(async () => {
      const res = await createSupplier(newSupplierName.trim());
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onSupplierCreated(res.data);
      setForm((f) => ({ ...f, supplierId: res.data.id }));
      setNewSupplierName("");
      setAddingSupplier(false);
      toast.success(`Proveedor "${res.data.name}" creado`);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name: form.name,
      type: form.type,
      unit: form.unit,
      minStock: form.minStock,
      maxStock: form.maxStock,
      cost: form.cost || 0,
      price: form.price || undefined,
      supplierId: form.supplierId,
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
            <Label htmlFor="unit">Unidad</Label>
            <Input
              id="unit"
              placeholder="kg, l, unidad..."
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              required
            />
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

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cost">Costo</Label>
            <Input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
            />
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
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Proveedor</Label>
          {addingSupplier ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="Nombre del proveedor"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSupplier();
                  }
                }}
              />
              <Button type="button" size="sm" onClick={handleAddSupplier} disabled={isPending}>
                Agregar
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAddingSupplier(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select
                value={form.supplierId || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, supplierId: v === "none" ? "" : (v ?? "") }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin proveedor">
                    {(value: string) =>
                      value === "none" ? "Sin proveedor" : suppliers.find((s) => s.id === value)?.name ?? "Sin proveedor"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proveedor</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAddingSupplier(true)}
                aria-label="Nuevo proveedor"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          )}
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
