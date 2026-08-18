"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderCard } from "@/components/orders/order-card";
import { TicketView, type TicketData, type TicketSettings } from "@/components/mostrador/ticket-view";
import { playNotificationSound } from "@/lib/notification-sound";
import { ORDER_STATUS, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import type { KanbanOrder } from "@/components/orders/types";

function toTicketData(order: KanbanOrder): TicketData {
  return {
    number: order.number,
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
  };
}

const columns: { status: string; title: string; next: string | null; nextLabel: string | null; prev: string | null }[] = [
  { status: ORDER_STATUS.RECEIVED, title: "Nuevos", next: ORDER_STATUS.PREPARING, nextLabel: "Preparar", prev: null },
  {
    status: ORDER_STATUS.PREPARING,
    title: "En preparación",
    next: ORDER_STATUS.READY,
    nextLabel: "Listo",
    prev: ORDER_STATUS.RECEIVED,
  },
  {
    status: ORDER_STATUS.READY,
    title: "Listos",
    next: ORDER_STATUS.DELIVERED,
    nextLabel: "Entregar",
    prev: ORDER_STATUS.PREPARING,
  },
  { status: ORDER_STATUS.DELIVERED, title: "Entregados", next: null, nextLabel: null, prev: ORDER_STATUS.READY },
];

export function KanbanBoard({ orders, ticketSettings }: { orders: KanbanOrder[]; ticketSettings: TicketSettings }) {
  const router = useRouter();
  const knownIds = useRef<Set<string> | null>(null);
  const [printQueue, setPrintQueue] = useState<TicketData[]>([]);
  const printingRef = useRef(false);

  useEffect(() => {
    const currentIds = new Set(orders.map((o) => o.id));
    console.log("[pedidos-debug] poll tick, orders:", orders.map((o) => `#${o.number}(${o.status}/${o.channel})`));

    if (knownIds.current) {
      const newReceived = orders.filter(
        (o) => o.status === ORDER_STATUS.RECEIVED && !knownIds.current!.has(o.id)
      );
      console.log("[pedidos-debug] newReceived:", newReceived.map((o) => `#${o.number}`));
      for (const order of newReceived) {
        toast.info(`Nuevo pedido #${order.number}`);
      }
      if (newReceived.length > 0) playNotificationSound();

      // Toda la impresión pasa por acá, sin importar desde qué pantalla o dispositivo se
      // haya cargado el pedido (Mostrador, Ventas, Autoservicio) — es la única forma de que
      // dispositivos sin impresora propia (como una tablet) terminen imprimiendo: el pedido
      // viaja hasta la PC que sí tiene la impresora y esta ventana lo imprime por ellos.
      if (newReceived.length > 0) {
        setPrintQueue((prev) => [...prev, ...newReceived.map(toTicketData)]);
        console.log("[pedidos-debug] queued for print:", newReceived.map((o) => o.number));
      }
    } else {
      console.log("[pedidos-debug] first mount, marking all as known, none will print");
    }

    knownIds.current = currentIds;
  }, [orders]);

  function handleManualPrint(order: KanbanOrder) {
    setPrintQueue((prev) => [...prev, toTicketData(order)]);
    toast.info(`Imprimiendo pedido #${order.number}...`);
  }

  useEffect(() => {
    console.log("[pedidos-debug] printQueue changed, length:", printQueue.length, "printingRef:", printingRef.current);
    if (printingRef.current || printQueue.length === 0) return;
    printingRef.current = true;
    console.log("[pedidos-debug] starting print for order:", printQueue[0]?.number);
    // Tiene que sobrevivir a todas las copias configuradas (cada una con ~1.8s de por medio,
    // ver ticket-view.tsx) antes de pasar al siguiente pedido de la cola.
    const advanceDelay = 1500 + Math.max(1, ticketSettings.copies || 2) * 2000;
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                    onPrint={handleManualPrint}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}

      <TicketView ticket={printQueue[0] ?? null} settings={ticketSettings} onClose={() => {}} silent />
    </div>
  );
}
