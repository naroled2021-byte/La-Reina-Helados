"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchOrderDetail } from "@/lib/actions/report-actions";
import { currency, formatOrderNumber } from "@/lib/format";
import { ORDER_TYPE_LABEL, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, PAYMENT_METHOD_LABEL } from "@/lib/constants";

/** Detalle completo de un pedido de reportes (qué tenía, a quién, por qué total) — se abre
 *  al hacer click en una fila de la tabla de Ventas o Pedidos cancelados. */
export function OrderDetailDialog({
  orderId,
  onOpenChange,
}: {
  orderId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!orderId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        {orderId && <DetailBody key={orderId} orderId={orderId} />}
      </DialogContent>
    </Dialog>
  );
}

function DetailBody({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Awaited<ReturnType<typeof fetchOrderDetail>> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchOrderDetail(orderId).then((data) => {
      if (!cancelled) setOrder(data);
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (order === undefined) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!order) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No se encontró el pedido.</p>;
  }

  const displayNumber = formatOrderNumber(order.channel, order.channelNumber);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Pedido #{displayNumber}</DialogTitle>
        <DialogDescription>
          {new Date(order.createdAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="text-[10px]">
          {ORDER_TYPE_LABEL[order.type] ?? order.type}
        </Badge>
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

      {order.customer && (
        <p className="text-sm font-medium">
          {order.customer.name}
          {order.customer.phone && (
            <span className="font-normal text-muted-foreground"> · {order.customer.phone}</span>
          )}
        </p>
      )}
      {order.deliveryAddress && <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>}

      <div className="flex flex-col gap-1.5 border-t pt-2">
        {order.items.map((it) => (
          <div key={it.id} className="flex items-start justify-between gap-2 text-sm">
            <div className="min-w-0">
              <p>
                {it.quantity}x {it.product.name}
              </p>
              {it.flavors.length > 0 && (
                <p className="truncate text-xs text-muted-foreground">
                  {it.flavors.map((f) => f.flavor.name).join(" + ")}
                </p>
              )}
            </div>
            <span className="shrink-0 tabular-nums">{currency.format(it.unitPrice * it.quantity)}</span>
          </div>
        ))}
      </div>

      {order.notes && (
        <p className="whitespace-pre-line rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          {order.notes}
        </p>
      )}

      <div className="flex flex-col gap-1 border-t pt-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{currency.format(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Descuento</span>
            <span>-{currency.format(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{currency.format(order.total)}</span>
        </div>
        {order.payments[0] && (
          <div className="flex justify-between text-muted-foreground">
            <span>Pago</span>
            <span>{PAYMENT_METHOD_LABEL[order.payments[0].method] ?? order.payments[0].method}</span>
          </div>
        )}
      </div>
    </>
  );
}
