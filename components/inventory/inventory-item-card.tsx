"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Boxes, Pencil, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toggleInventoryItemActive } from "@/lib/actions/inventory-actions";
import {
  getStockStatus,
  STOCK_STATUS_LABEL,
  STOCK_STATUS_COLOR,
  INVENTORY_ITEM_TYPE_LABEL,
} from "@/lib/constants";
import { currency } from "@/lib/format";
import type { InventoryItemRow } from "@/components/inventory/types";

export function InventoryItemCard({
  item,
  onEdit,
  onAdjust,
}: {
  item: InventoryItemRow;
  onEdit: (item: InventoryItemRow) => void;
  onAdjust: (item: InventoryItemRow) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const stockStatus = getStockStatus(item.currentStock, item.minStock);

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleInventoryItemActive(item.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.data.active ? `${item.name} activado` : `${item.name} desactivado`);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Boxes className="size-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium leading-tight">{item.name}</p>
          <p className="text-xs text-muted-foreground">{INVENTORY_ITEM_TYPE_LABEL[item.type] ?? item.type}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Stock: {item.currentStock}{item.unit} (mín. {item.minStock}{item.unit})
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

      {item.price && <p className="text-xs text-muted-foreground">Precio: {currency.format(item.price)}</p>}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <Switch checked={item.active} onCheckedChange={handleToggle} disabled={isPending || item.isFlavor} />
          <Badge variant={item.active ? "secondary" : "outline"} className="text-[10px]">
            {item.active ? "Activo" : "Inactivo"}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => onAdjust(item)} className="gap-1">
            <SlidersHorizontal className="size-3.5" />
            Ajustar
          </Button>
          {item.isFlavor ? (
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/sabores" />}>
              Ver en Sabores
            </Button>
          ) : (
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(item)} aria-label="Editar ítem">
              <Pencil className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
