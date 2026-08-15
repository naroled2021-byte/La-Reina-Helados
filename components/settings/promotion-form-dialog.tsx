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
import { createPromotion, updatePromotion } from "@/lib/actions/promotion-actions";
import { PROMOTION_TYPE } from "@/lib/constants";
import type { PromotionRow } from "@/components/settings/types";

const PROMOTION_TYPE_LABEL: Record<string, string> = {
  [PROMOTION_TYPE.TWO_FOR_ONE]: "2x1",
  [PROMOTION_TYPE.THREE_FOR_TWO]: "3x2",
  [PROMOTION_TYPE.PERCENTAGE_DISCOUNT]: "Descuento %",
  [PROMOTION_TYPE.QUANTITY_DISCOUNT]: "Descuento por cantidad",
  [PROMOTION_TYPE.COMBO]: "Combo",
  [PROMOTION_TYPE.TIME_OF_DAY]: "Por horario",
  [PROMOTION_TYPE.DAY_OF_WEEK]: "Por día",
  [PROMOTION_TYPE.LOYALTY]: "Fidelización",
};

type FormState = {
  name: string;
  type: string;
  value: string;
  minQuantity: string;
  daysOfWeek: string;
  startDate: string;
  endDate: string;
  active: boolean;
};

function initialFormState(promotion: PromotionRow | null): FormState {
  if (promotion) {
    return {
      name: promotion.name,
      type: promotion.type,
      value: promotion.value != null ? String(promotion.value) : "",
      minQuantity: promotion.minQuantity != null ? String(promotion.minQuantity) : "",
      daysOfWeek: promotion.daysOfWeek ?? "",
      startDate: promotion.startDate ? promotion.startDate.slice(0, 10) : "",
      endDate: promotion.endDate ? promotion.endDate.slice(0, 10) : "",
      active: promotion.active,
    };
  }
  return {
    name: "",
    type: PROMOTION_TYPE.PERCENTAGE_DISCOUNT,
    value: "",
    minQuantity: "",
    daysOfWeek: "",
    startDate: "",
    endDate: "",
    active: true,
  };
}

export function PromotionFormDialog({
  open,
  onOpenChange,
  promotion,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: PromotionRow | null;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        {open && (
          <PromotionForm
            key={promotion?.id ?? "create"}
            promotion={promotion}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PromotionForm({
  promotion,
  onOpenChange,
  onSaved,
}: {
  promotion: PromotionRow | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialFormState(promotion));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name: form.name,
      type: form.type,
      value: (form.value || undefined) as never,
      minQuantity: (form.minQuantity || undefined) as never,
      daysOfWeek: form.daysOfWeek,
      startDate: form.startDate,
      endDate: form.endDate,
      active: form.active,
    };

    startTransition(async () => {
      const res = promotion ? await updatePromotion(promotion.id, payload) : await createPromotion(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(promotion ? "Promoción actualizada" : "Promoción creada");
      onOpenChange(false);
      onSaved();
      router.refresh();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{promotion ? "Editar promoción" : "Nueva promoción"}</DialogTitle>
        <DialogDescription>Configurá la promoción. El descuento se sigue aplicando manualmente en Ventas.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required autoFocus />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Tipo</Label>
          <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v ?? f.type }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo">{(value: string) => PROMOTION_TYPE_LABEL[value] ?? value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.values(PROMOTION_TYPE).map((t) => (
                <SelectItem key={t} value={t}>
                  {PROMOTION_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="value">Valor (%, $, etc.)</Label>
            <Input
              id="value"
              type="number"
              min="0"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minQuantity">Cantidad mínima</Label>
            <Input
              id="minQuantity"
              type="number"
              min="0"
              step="1"
              value={form.minQuantity}
              onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="daysOfWeek">Días de la semana</Label>
          <Input
            id="daysOfWeek"
            placeholder="Ej: MON,WED"
            value={form.daysOfWeek}
            onChange={(e) => setForm((f) => ({ ...f, daysOfWeek: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startDate">Desde</Label>
            <Input
              id="startDate"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="endDate">Hasta</Label>
            <Input
              id="endDate"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <Label htmlFor="active">Activa</Label>
          <Switch id="active" checked={form.active} onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))} />
        </div>

        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {promotion ? "Guardar cambios" : "Crear promoción"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
