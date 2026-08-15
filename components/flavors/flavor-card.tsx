"use client";

import { useTransition } from "react";
import { Snowflake, Pencil, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toggleFlavorActive } from "@/lib/actions/flavor-actions";
import { getStockStatus, STOCK_STATUS_LABEL, STOCK_STATUS_COLOR, FLAVOR_CATEGORY_LABEL } from "@/lib/constants";
import type { FlavorRow } from "@/components/flavors/types";

export function FlavorCard({
  flavor,
  onEdit,
}: {
  flavor: FlavorRow;
  onEdit: (flavor: FlavorRow) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const stockStatus = getStockStatus(flavor.currentStock, flavor.minStock);

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleFlavorActive(flavor.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.data.active ? `${flavor.name} activado` : `${flavor.name} desactivado`);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
          {flavor.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={flavor.imageUrl} alt={flavor.name} className="size-full object-cover" />
          ) : (
            <Snowflake className="size-6" strokeWidth={1.75} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium leading-tight">{flavor.name}</p>
            {flavor.popular && <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />}
          </div>
          <p className="text-xs text-muted-foreground">{FLAVOR_CATEGORY_LABEL[flavor.category] ?? flavor.category}</p>
        </div>
      </div>

      {flavor.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{flavor.description}</p>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Stock: {flavor.currentStock}kg (mín. {flavor.minStock}kg)
        </span>
        <Badge
          variant="outline"
          className="gap-1 border-none text-[10px]"
          style={{ backgroundColor: `${STOCK_STATUS_COLOR[stockStatus]}22`, color: STOCK_STATUS_COLOR[stockStatus] }}
        >
          <span className="size-1.5 rounded-full" style={{ backgroundColor: STOCK_STATUS_COLOR[stockStatus] }} />
          {STOCK_STATUS_LABEL[stockStatus]}
        </Badge>
      </div>

      <div className="mt-auto flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Switch checked={flavor.active} onCheckedChange={handleToggle} disabled={isPending} />
          <Badge variant={flavor.active ? "secondary" : "outline"} className="text-[10px]">
            {flavor.active ? "Activo" : "Inactivo"}
          </Badge>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => onEdit(flavor)} aria-label="Editar sabor">
          <Pencil className="size-4" />
        </Button>
      </div>
    </div>
  );
}
