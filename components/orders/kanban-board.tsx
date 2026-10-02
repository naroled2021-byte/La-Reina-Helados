"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderCard } from "@/components/orders/order-card";
import { TicketView, type TicketData, type TicketSettings } from "@/components/mostrador/ticket-view";
import { logOrderReprint } from "@/lib/actions/order-actions";
import { playNotificationSound } from "@/lib/notification-sound";
import { ORDER_STATUS, ORDER_CHANNEL, ORDER_CHANNEL_COLOR, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatOrderNumber } from "@/lib/format";
import type { KanbanOrder } from "@/components/orders/types";

// Mostrador/Ventas (COUNTER) imprimen 1 sola copia; Autoservicio (SELF_SERVICE) imprime 2 —
// fijo por canal, no por la configuración general de Impresión (esa queda solo para las
// pruebas manuales desde Configuración).
function copiesForChannel(channel: string): number {
  return channel === ORDER_CHANNEL.SELF_SERVICE ? 2 : 1;
}

function toTicketData(order: KanbanOrder): TicketData {
  return {
    number: order.number,
    displayNumber: formatOrderNumber(order.channel, order.channelNumber),
    createdAt: order.createdAt,
    items: order.orderItems.map((it, i) => ({
      key: String(i),
      productId: "",
      productName: it.productName,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      flavorIds: [],
      flavorNames: it.flavorNames,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    paymentMethodLabel: PAYMENT_METHOD_LABEL[order.paymentMethod ?? ""] ?? order.paymentMethod ?? "",
    orderType: order.type,
    customerName: order.customerName,
    deliveryAddress: order.deliveryAddress,
    notes: order.notes,
    copies: copiesForChannel(order.channel),
  };
}

// Los pedidos entran directo en "En preparación" apenas se crean (sin pasar por Nuevos ni
// Confirmados), para los dos canales por igual.
const columns: { status: string; title: string; next: string | null; nextLabel: string | null; prev: string | null }[] = [
  { status: ORDER_STATUS.PREPARING, title: "En preparación", next: ORDER_STATUS.DELIVERED, nextLabel: "Entregar", prev: null },
  { status: ORDER_STATUS.DELIVERED, title: "Entregados", next: null, nextLabel: null, prev: ORDER_STATUS.PREPARING },
];

export function KanbanBoard({
  orders,
  ticketSettings,
}: {
  orders: KanbanOrder[];
  ticketSettings: TicketSettings;
}) {
  const router = useRouter();
  const knownIds = useRef<Set<string> | null>(null);
  const [printQueue, setPrintQueue] = useState<TicketData[]>([]);
  const printingRef = useRef(false);

  useEffect(() => {
    const currentIds = new Set(orders.map((o) => o.id));
    console.log("[pedidos-debug] poll tick, orders:", orders.map((o) => `#${o.number}(${o.status}/${o.channel})`));

    if (knownIds.current) {
      const prevIds = knownIds.current;
      const newArrivals = orders.filter((o) => !prevIds.has(o.id));
      console.log("[pedidos-debug] newArrivals:", newArrivals.map((o) => `#${o.number}`));
      for (const order of newArrivals) {
        toast.info(`Nuevo pedido #${formatOrderNumber(order.channel, order.channelNumber)}`);
      }
      if (newArrivals.length > 0) playNotificationSound();

      // Autoservicio ya no imprime desde acá: lo maneja el agente local de impresión
      // (/api/print-queue), que manda esos tickets directo a su propia impresora por nombre.
      // Esta ventana solo sigue imprimiendo, como antes, los de Mostrador/Ventas.
      const toPrint = newArrivals.filter((o) => o.channel !== ORDER_CHANNEL.SELF_SERVICE);
      if (toPrint.length > 0) {
        setPrintQueue((prev) => [...prev, ...toPrint.map(toTicketData)]);
        console.log("[pedidos-debug] queued for print:", toPrint.map((o) => o.number));
      }
    } else {
      console.log("[pedidos-debug] first mount, marking all as known, none will print");
    }

    knownIds.current = currentIds;
  }, [orders]);

  function handleManualPrint(order: KanbanOrder) {
    setPrintQueue((prev) => [...prev, toTicketData(order)]);
    toast.info(`Imprimiendo pedido #${formatOrderNumber(order.channel, order.channelNumber)}...`);
    void logOrderReprint(order.id);
  }

  useEffect(() => {
    console.log("[pedidos-debug] printQueue changed, length:", printQueue.length, "printingRef:", printingRef.current);
    if (printingRef.current || printQueue.length === 0) return;
    printingRef.current = true;
    console.log("[pedidos-debug] starting print for order:", printQueue[0]?.number);
    // Tiene que sobrevivir a todas las copias configuradas (cada una con ~1.8s de por medio,
    // ver ticket-view.tsx) antes de pasar al siguiente pedido de la cola.
    const currentCopies = printQueue[0]?.copies ?? ticketSettings.copies ?? 2;
    const advanceDelay = 1500 + Math.max(1, currentCopies) * 3700;
    const timer = setTimeout(() => {
      console.log("[pedidos-debug] advancing print queue past order:", printQueue[0]?.number);
      setPrintQueue((prev) => prev.slice(1));
      printingRef.current = false;
    }, advanceDelay);
    return () => clearTimeout(timer);
  }, [printQueue, ticketSettings.copies]);

  useEffect(() => {
    console.log("[pedidos-debug] polling started, refreshing every 5s");
    const interval = setInterval(() => {
      console.log("[pedidos-debug] router.refresh() called");
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  const counterOrders = orders.filter((o) => o.channel !== ORDER_CHANNEL.SELF_SERVICE);
  const selfServiceOrders = orders.filter((o) => o.channel === ORDER_CHANNEL.SELF_SERVICE);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <OrderBoardRow
          title="Mostrador / Ventas"
          channel={ORDER_CHANNEL.COUNTER}
          orders={counterOrders}
          onManualPrint={handleManualPrint}
        />
        <OrderBoardRow
          title="Autoservicio"
          channel={ORDER_CHANNEL.SELF_SERVICE}
          orders={selfServiceOrders}
          onManualPrint={handleManualPrint}
        />
      </div>

      <TicketView ticket={printQueue[0] ?? null} settings={ticketSettings} onClose={() => {}} silent />
    </div>
  );
}

function OrderBoardRow({
  title,
  channel,
  orders,
  onManualPrint,
}: {
  title: string;
  channel: string;
  orders: KanbanOrder[];
  onManualPrint: (order: KanbanOrder) => void;
}) {
  const channelColor = ORDER_CHANNEL_COLOR[channel] ?? ORDER_CHANNEL_COLOR.COUNTER;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-t-4 p-3" style={{ borderTopColor: channelColor }}>
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: channelColor }} />
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {columns.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className="flex flex-col gap-3 rounded-2xl bg-muted/40 p-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">{col.title}</h3>
                <span className="text-xs text-muted-foreground">{columnOrders.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {columnOrders.length === 0 ? (
                  <p className="rounded-xl border border-dashed py-6 text-center text-xs text-muted-foreground">
                    Sin pedidos
                  </p>
                ) : (
                  columnOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      prevStatus={col.prev}
                      nextStatus={col.next}
                      nextLabel={col.nextLabel}
                      onPrint={onManualPrint}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
