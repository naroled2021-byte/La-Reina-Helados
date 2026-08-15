"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCustomerOrders } from "@/lib/actions/customer-actions";
import { currency } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/constants";
import type { CustomerRow } from "@/components/customers/types";

export function CustomerHistoryDialog({
  customer,
  onOpenChange,
}: {
  customer: CustomerRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!customer} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {customer && <HistoryBody key={customer.id} customer={customer} />}
      </DialogContent>
    </Dialog>
  );
}

function HistoryBody({ customer }: { customer: CustomerRow }) {
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof getCustomerOrders>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCustomerOrders(customer.id).then((data) => {
      if (!cancelled) setOrders(data);
    });
    return () => {
      cancelled = true;
    };
  }, [customer.id]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{customer.name}</DialogTitle>
        <DialogDescription>
          {customer.orderCount} pedido{customer.orderCount === 1 ? "" : "s"} · Total comprado:{" "}
          {currency.format(customer.totalSpent)} · {customer.points} puntos
        </DialogDescription>
      </DialogHeader>

      {orders === null ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hizo ningún pedido.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">#{order.number}</span>
                  <Badge
                    variant="outline"
                    className="border-none text-[10px]"
                    style={{
                      backgroundColor: `${ORDER_STATUS_COLOR[order.status]}22`,
                      color: ORDER_STATUS_COLOR[order.status],
                    }}
                  >
                    {ORDER_STATUS_LABEL[order.status] ?? order.status}
                  </Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  {" · "}
                  {order.items.map((it) => `${it.quantity}x ${it.product.name}`).join(", ")}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{currency.format(order.total)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
