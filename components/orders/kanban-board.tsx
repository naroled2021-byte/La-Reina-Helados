"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderCard } from "@/components/orders/order-card";
import { TicketView, type TicketData, type TicketSettings } from "@/components/mostrador/ticket-view";
import { logOrderReprint } from "@/lib/actions/order-actions";
import { playNotificationSound } from "@/lib/notification-sound";
import { ORDER_STATUS, ORDER_CHANNEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
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

const columns: { status: string; title: string; next: string | null; nextLabel: string | null; prev: string | null }[] = [
  // Los pedidos de Autoservicio llegan solos, sin que nadie del local los haya visto — por
  // eso en esta columna, para ellos, el botón dice "Confirmar" (pasa a la columna
  // Confirmados) en vez de "Preparar" directo. Los de Mostrador/Ventas los carga el propio
  // local, así que siguen yendo directo a preparación como siempre (ver el render de abajo).
  { status: ORDER_STATUS.RECEIVED, title: "Nuevos", next: ORDER_STATUS.PREPARING, nextLabel: "Preparar", prev: null },
  {
    status: ORDER_STATUS.CONFIRMED,
    title: "Confirmados",
    next: ORDER_STATUS.PREPARING,
    nextLabel: "Preparar",
    prev: ORDER_STATUS.RECEIVED,
  },
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
  // Antes solo guardaba qué IDs ya se habían visto; ahora guarda el último estado de cada
  // uno, porque necesito detectar la TRANSICIÓN a Confirmado, no solo la llegada.
  const knownStatuses = useRef<Map<string, string> | null>(null);
  const [printQueue, setPrintQueue] = useState<TicketData[]>([]);
  const printingRef = useRef(false);

  useEffect(() => {
    const currentStatuses = new Map(orders.map((o) => [o.id, o.status]));
    console.log("[pedidos-debug] poll tick, orders:", orders.map((o) => `#${o.number}(${o.status}/${o.channel})`));

    if (knownStatuses.current) {
      const prevStatuses = knownStatuses.current;
      const newArrivals = orders.filter((o) => o.status === ORDER_STATUS.RECEIVED && !prevStatuses.has(o.id));
      console.log("[pedidos-debug] newArrivals:", newArrivals.map((o) => `#${o.number}`));
      for (const order of newArrivals) {
        toast.info(`Nuevo pedido #${order.number}`);
      }
      if (newArrivals.length > 0) playNotificationSound();

      // Mostrador/Ventas (COUNTER) imprimen apenas llegan, como siempre. Autoservicio
      // (SELF_SERVICE) ya no imprime solo al llegar — recién cuando alguien lo confirma
      // desde la columna Nuevos, para poder revisarlo antes de gastar el ticket.
      const newCounterArrivals = newArrivals.filter((o) => o.channel !== ORDER_CHANNEL.SELF_SERVICE);
      const justConfirmed = orders.filter(
        (o) => o.status === ORDER_STATUS.CONFIRMED && prevStatuses.get(o.id) === ORDER_STATUS.RECEIVED
      );
      const toPrint = [...newCounterArrivals, ...justConfirmed];

      // Toda la impresión pasa por acá, sin importar desde qué pantalla o dispositivo se
      // haya cargado el pedido (Mostrador, Ventas, Autoservicio) — es la única forma de que
      // dispositivos sin impresora propia (como una tablet) terminen imprimiendo: el pedido
      // viaja hasta la PC que sí tiene la impresora y esta ventana lo imprime por ellos.
      if (toPrint.length > 0) {
        setPrintQueue((prev) => [...prev, ...toPrint.map(toTicketData)]);
        console.log("[pedidos-debug] queued for print:", toPrint.map((o) => o.number));
      }
    } else {
      console.log("[pedidos-debug] first mount, marking all as known, none will print");
    }

    knownStatuses.current = currentStatuses;
  }, [orders]);

  function handleManualPrint(order: KanbanOrder) {
    setPrintQueue((prev) => [...prev, toTicketData(order)]);
    toast.info(`Imprimiendo pedido #${order.number}...`);
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
                columnOrders.map((order) => {
                  const isSelfServiceNew =
                    col.status === ORDER_STATUS.RECEIVED && order.channel === ORDER_CHANNEL.SELF_SERVICE;
                  return (
                    <OrderCard
                      key={order.id}
                      order={order}
                      prevStatus={col.prev}
                      nextStatus={isSelfServiceNew ? ORDER_STATUS.CONFIRMED : col.next}
                      nextLabel={isSelfServiceNew ? "Confirmar" : col.nextLabel}
                      onPrint={handleManualPrint}
                    />
                  );
                })
              )}
            </div>
          </div>
        );
      })}

      <TicketView ticket={printQueue[0] ?? null} settings={ticketSettings} onClose={() => {}} silent />
    </div>
  );
}
