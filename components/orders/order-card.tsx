"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Ban, MapPin, MonitorSmartphone, Printer, Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatus, updateOrderPaymentMethod } from "@/lib/actions/order-actions";
import { cancelSale } from "@/lib/actions/sale-actions";
import { currency, formatOrderNumber } from "@/lib/format";
import { ORDER_TYPE_LABEL, ORDER_CHANNEL, PAYMENT_METHOD, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import type { KanbanOrder } from "@/components/orders/types";

const typeIcon = { DINE_IN: Store, TAKEAWAY: MapPin, DELIVERY: Truck } as const;

export function OrderCard({
  order,
  prevStatus,
  nextStatus,
  nextLabel,
  onPrint,
}: {
  order: KanbanOrder;
  prevStatus: string | null;
  nextStatus: string | null;
  nextLabel: string | null;
  onPrint: (order: KanbanOrder) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const TypeIcon = typeIcon[order.type as keyof typeof typeIcon] ?? Store;
  const displayNumber = formatOrderNumber(order.channel, order.channelNumber);

  function move(status: string) {
    startTransition(async () => {
      const res = await updateOrderStatus(order.id, status);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function changePaymentMethod(method: string) {
    startTransition(async () => {
      const res = await updateOrderPaymentMethod(order.id, method);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleCancel() {
    if (!confirm(`¿Cancelar el pedido #${displayNumber}?`)) return;
    startTransition(async () => {
      const res = await cancelSale(order.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Pedido #${displayNumber} cancelado`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">#{displayNumber}</span>
        <span className="text-xs text-muted-foreground">
          {new Date(order.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="gap-1 text-[10px]">
          <TypeIcon className="size-3" />
          {ORDER_TYPE_LABEL[order.type] ?? order.type}
        </Badge>
        {order.channel === ORDER_CHANNEL.SELF_SERVICE && (
          <Badge variant="outline" className="gap-1 text-[10px]">
            <MonitorSmartphone className="size-3" />
            Autoservicio
          </Badge>
        )}
        {order.tableNumber && <span className="text-xs text-muted-foreground">Mesa {order.tableNumber}</span>}
      </div>

      <p className="line-clamp-2 text-xs text-muted-foreground">{order.itemsSummary}</p>
      {order.customerName && (
        <p className="text-xs font-medium">
          {order.customerName}
          {order.customerPhone && <span className="font-normal text-muted-foreground"> · {order.customerPhone}</span>}
        </p>
      )}
      {order.deliveryAddress && (
        <p className="truncate text-xs text-muted-foreground">{order.deliveryAddress}</p>
      )}
      {order.notes && <p className="whitespace-pre-line text-xs font-medium text-amber-700">{order.notes}</p>}

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold tabular-nums">{currency.format(order.total)}</p>
        <Select value={order.paymentMethod ?? undefined} onValueChange={(v) => v && changePaymentMethod(v)}>
          <SelectTrigger size="sm" className="h-6 w-auto gap-1 border-none bg-muted px-2 text-[11px] shadow-none">
            <SelectValue placeholder="Pago">
              {(value: string) => PAYMENT_METHOD_LABEL[value] ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.values(PAYMENT_METHOD).map((m) => (
              <SelectItem key={m} value={m}>
                {PAYMENT_METHOD_LABEL[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-1 flex items-center gap-1.5">
        {prevStatus && (
          <Button
            variant="outline"
            size="icon-sm"
            disabled={isPending}
            onClick={() => move(prevStatus)}
            aria-label="Volver"
          >
            <ArrowLeft className="size-3.5" />
          </Button>
        )}
        {nextStatus && (
          <Button size="sm" className="flex-1 gap-1" disabled={isPending} onClick={() => move(nextStatus)}>
            {nextLabel}
            <ArrowRight className="size-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPrint(order)}
          aria-label="Imprimir pedido"
        >
          <Printer className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          onClick={handleCancel}
          aria-label="Cancelar pedido"
        >
          <Ban className="size-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
