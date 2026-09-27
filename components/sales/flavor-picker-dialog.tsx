"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { SaleFlavor, SaleProduct } from "@/components/sales/types";

export function FlavorPickerDialog({
  product,
  flavors,
  onCancel,
  onConfirm,
}: {
  product: SaleProduct | null;
  flavors: SaleFlavor[];
  onCancel: () => void;
  onConfirm: (flavorIds: string[]) => void;
}) {
  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        {product && <FlavorPickerBody product={product} flavors={flavors} onCancel={onCancel} onConfirm={onConfirm} />}
      </DialogContent>
    </Dialog>
  );
}

function FlavorPickerBody({
  product,
  flavors,
  onCancel,
  onConfirm,
}: {
  product: SaleProduct;
  flavors: SaleFlavor[];
  onCancel: () => void;
  onConfirm: (flavorIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const max = Math.max(product.maxFlavors, 1);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((f) => f !== id);
      if (prev.length >= max) return prev;
      return [...prev, id];
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{product.name}</DialogTitle>
        <DialogDescription>
          Elegí hasta {max} sabor{max > 1 ? "es" : ""} ({selected.length}/{max})
        </DialogDescription>
      </DialogHeader>

      <div className="grid max-h-96 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
        {flavors.map((flavor) => {
          const isSelected = selected.includes(flavor.id);
          return (
            <button
              key={flavor.id}
              type="button"
              onClick={() => toggle(flavor.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-base font-medium transition-colors",
                isSelected ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
              )}
            >
              {isSelected ? (
                <Check className="size-4 shrink-0" />
              ) : flavor.popular ? (
                <Star className="size-4 shrink-0 fill-amber-400 text-amber-400" />
              ) : (
                <span className="size-4 shrink-0" />
              )}
              <span>{flavor.name}</span>
            </button>
          );
        })}
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" disabled={selected.length === 0} onClick={() => onConfirm(selected)}>
          Agregar al carrito
        </Button>
      </DialogFooter>
    </>
  );
}
