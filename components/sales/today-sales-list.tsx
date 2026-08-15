"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cancelSale } from "@/lib/actions/sale-actions";
import { currency } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import type { TodaySale } from "@/components/sales/types";

export function TodaySalesList({ sales }: { sales: TodaySale[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCancel(sale: TodaySale) {
    if (!confirm(`¿Cancelar el pedido #${sale.number}?`)) return;
    startTransition(async () => {
      const res = await cancelSale(sale.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Pedido #${sale.number} cancelado`);
      router.refresh();
    });
  }

  if (sales.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
        Todavía no hay ventas hoy.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sales.map((sale) => {
        const cancelled = sale.status === "CANCELLED";
        return (
          <div
            key={sale.id}
            className="flex flex-col gap-2 rounded-2xl border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">#{sale.number}</span>
                <Badge
                  variant="outline"
                  className="border-none text-[10px]"
                  style={{
                    backgroundColor: `${ORDER_STATUS_COLOR[sale.status]}22`,
                    color: ORDER_STATUS_COLOR[sale.status],
                  }}
                >
                  {ORDER_STATUS_LABEL[sale.status] ?? sale.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(sale.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {sale.itemsSummary}
                {sale.customerName ? ` · ${sale.customerName}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">{currency.format(sale.total)}</p>
                {sale.paymentMethod && (
                  <p className="text-xs text-muted-foreground">
                    {PAYMENT_METHOD_LABEL[sale.paymentMethod] ?? sale.paymentMethod}
                  </p>
                )}
              </div>
              {!cancelled && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => handleCancel(sale)}
                  aria-label="Cancelar venta"
                >
                  <Ban className="size-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
