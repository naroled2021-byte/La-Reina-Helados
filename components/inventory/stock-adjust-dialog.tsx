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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adjustStock } from "@/lib/actions/inventory-actions";
import { stockMovementTypes } from "@/lib/validations/inventory";
import { MOVEMENT_TYPE_LABEL } from "@/lib/constants";
import type { InventoryItemRow } from "@/components/inventory/types";

export function StockAdjustDialog({
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
      <DialogContent className="sm:max-w-sm">
        {open && item && (
          <AdjustForm key={item.id} item={item} onSaved={onSaved} onOpenChange={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AdjustForm({
  item,
  onSaved,
  onOpenChange,
}: {
  item: InventoryItemRow;
  onSaved: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [type, setType] = useState<string>("IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await adjustStock(item.id, { type, quantity, reason } as never);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(`Stock de ${item.name} actualizado a ${res.data.currentStock}${item.unit}`);
      onOpenChange(false);
      onSaved();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Ajustar stock — {item.name}</DialogTitle>
        <DialogDescription>
          Stock actual: {item.currentStock}{item.unit} · Mínimo: {item.minStock}{item.unit}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Tipo de movimiento</Label>
          <Select value={type} onValueChange={(v) => setType(v ?? "IN")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo">{(value: string) => MOVEMENT_TYPE_LABEL[value] ?? value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {stockMovementTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {MOVEMENT_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantity">
            Cantidad {type === "ADJUSTMENT" && "(puede ser negativa)"}
          </Label>
          <Input
            id="quantity"
            type="number"
            step="0.5"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reason">Motivo (opcional)</Label>
          <Textarea id="reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirmar ajuste
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
