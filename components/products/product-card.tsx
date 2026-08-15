"use client";

import { useTransition } from "react";
import { IceCreamCone, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toggleProductActive } from "@/lib/actions/product-actions";
import { currency } from "@/lib/format";
import type { ProductRow } from "@/components/products/types";

export function ProductCard({
  product,
  onEdit,
}: {
  product: ProductRow;
  onEdit: (product: ProductRow) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleProductActive(product.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.data.active ? `${product.name} activado` : `${product.name} desactivado`);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="size-full object-cover" />
          ) : (
            <IceCreamCone className="size-6" strokeWidth={1.75} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium leading-tight">{product.name}</p>
          <p className="text-xs text-muted-foreground">{product.categoryName}</p>
          <p className="mt-1 text-sm font-semibold tabular-nums">{currency.format(product.price)}</p>
        </div>
      </div>

      {product.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Switch checked={product.active} onCheckedChange={handleToggle} disabled={isPending} />
          <Badge variant={product.active ? "secondary" : "outline"} className="text-[10px]">
            {product.active ? "Activo" : "Inactivo"}
          </Badge>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => onEdit(product)} aria-label="Editar producto">
          <Pencil className="size-4" />
        </Button>
      </div>
    </div>
  );
}
