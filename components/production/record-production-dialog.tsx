"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { recordProductionItem } from "@/lib/actions/production-actions";
import type { ProductionItemRow } from "@/components/production/types";

export function RecordProductionDialog({
  item,
  onOpenChange,
}: {
  item: ProductionItemRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {item && <RecordForm key={item.id} item={item} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function RecordForm({
  item,
  onOpenChange,
}: {
  item: ProductionItemRow;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [quantityProduced, setQuantityProduced] = useState(String(item.quantityPlanned));
  const [waste, setWaste] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await recordProductionItem(item.id, {
        quantityProduced: quantityProduced as never,
        waste: waste as never,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(`${item.flavorName}: producción registrada`);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Registrar producción — {item.flavorName}</DialogTitle>
        <DialogDescription>
          Planificado: {item.quantityPlanned}kg · Stock actual: {item.currentStock}kg
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantityProduced">Cantidad producida (kg)</Label>
          <Input
            id="quantityProduced"
            type="number"
            min="0"
            step="0.5"
            value={quantityProduced}
            onChange={(e) => setQuantityProduced(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="waste">Merma (kg)</Label>
          <Input
            id="waste"
            type="number"
            min="0"
            step="0.5"
            value={waste}
            onChange={(e) => setWaste(e.target.value)}
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
