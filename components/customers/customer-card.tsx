"use client";

import { Mail, Phone, Pencil, History, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/format";
import type { CustomerRow } from "@/components/customers/types";

export function CustomerCard({
  customer,
  onEdit,
  onHistory,
}: {
  customer: CustomerRow;
  onEdit: (customer: CustomerRow) => void;
  onHistory: (customer: CustomerRow) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium leading-tight">{customer.name}</p>
          {customer.phone && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="size-3" /> {customer.phone}
            </p>
          )}
          {customer.email && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="size-3 shrink-0" /> <span className="truncate">{customer.email}</span>
            </p>
          )}
        </div>
        <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]">
          <Star className="size-2.5 fill-amber-400 text-amber-400" />
          {customer.points}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Total comprado</p>
          <p className="font-semibold tabular-nums">{currency.format(customer.totalSpent)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Última compra</p>
          <p className="font-medium">
            {customer.lastPurchaseAt
              ? new Date(customer.lastPurchaseAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })
              : "—"}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">
          {customer.orderCount} pedido{customer.orderCount === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => onHistory(customer)} aria-label="Ver historial">
            <History className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(customer)} aria-label="Editar cliente">
            <Pencil className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
