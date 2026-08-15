"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduction } from "@/lib/actions/production-actions";
import type { FlavorOption } from "@/components/production/types";

type Line = { key: string; flavorId: string; quantity: string };

export function NewProductionDialog({
  open,
  onOpenChange,
  flavors,
  initialLines,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flavors: FlavorOption[];
  initialLines: { flavorId: string; quantity: number }[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {open && (
          <ProductionForm
            key={initialLines.map((l) => l.flavorId).join(",") || "empty"}
            flavors={flavors}
            initialLines={initialLines}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProductionForm({
  flavors,
  initialLines,
  onOpenChange,
}: {
  flavors: FlavorOption[];
  initialLines: { flavorId: string; quantity: number }[];
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(() =>
    initialLines.length > 0
      ? initialLines.map((l) => ({ key: crypto.randomUUID(), flavorId: l.flavorId, quantity: String(l.quantity) }))
      : [{ key: crypto.randomUUID(), flavorId: flavors[0]?.id ?? "", quantity: "5" }]
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addLine() {
    setLines((prev) => [...prev, { key: crypto.randomUUID(), flavorId: flavors[0]?.id ?? "", quantity: "5" }]);
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await createProduction({
        items: lines.map((l) => ({ flavorId: l.flavorId, quantityPlanned: l.quantity as never })),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Producción creada");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nueva producción</DialogTitle>
        <DialogDescription>Elegí los sabores y la cantidad a producir (en kg).</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {lines.map((line) => (
          <div key={line.key} className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Sabor</Label>
              <Select
                value={line.flavorId}
                onValueChange={(v) => updateLine(line.key, { flavorId: v ?? line.flavorId })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sabor">
                    {(value: string) => flavors.find((f) => f.id === value)?.name ?? "Sabor"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {flavors.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-24 flex-col gap-1.5">
              <Label>Kg</Label>
              <Input
                type="number"
                min="0.5"
                step="0.5"
                value={line.quantity}
                onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeLine(line.key)}
              disabled={lines.length === 1}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" onClick={addLine} className="self-start gap-1">
          <Plus className="size-3.5" />
          Agregar sabor
        </Button>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Crear producción
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
