import { requirePermission } from "@/lib/auth-helpers";
import { getKanbanOrders } from "@/lib/queries/orders";
import { getTicketSettings } from "@/lib/queries/settings";
import { KanbanBoard } from "@/components/orders/kanban-board";
import { ORDER_CHANNEL } from "@/lib/constants";

// Las PCs que tienen una impresora física dedicada abren esta pantalla con ?canal=mostrador
// o ?canal=autoservicio — así cada una solo imprime (silenciosamente, sin diálogo) los
// pedidos de su propio canal, en su propia impresora predeterminada de Windows. Sin el
// parámetro, la pantalla se usa igual pero no imprime sola (vista general / uso manual).
const CANAL_PARAM_TO_CHANNEL: Record<string, string> = {
  mostrador: ORDER_CHANNEL.COUNTER,
  autoservicio: ORDER_CHANNEL.SELF_SERVICE,
};

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ canal?: string }>;
}) {
  await requirePermission("orders.manage");
  const { canal } = await searchParams;
  const printChannel = canal ? CANAL_PARAM_TO_CHANNEL[canal] : undefined;

  const [orders, ticketSettings] = await Promise.all([getKanbanOrders(), getTicketSettings()]);

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">Seguimiento en vivo de los pedidos</p>
      </div>

      <KanbanBoard
        ticketSettings={ticketSettings}
        printChannel={printChannel}
        orders={orders.map((o) => ({
          id: o.id,
          number: o.number,
          channelNumber: o.channelNumber,
          type: o.type,
          status: o.status,
          channel: o.channel,
          createdAt: o.createdAt.toISOString(),
          subtotal: o.subtotal,
          discount: o.discount,
          total: o.total,
          tableNumber: o.tableNumber,
          deliveryAddress: o.deliveryAddress,
          customerName: o.customer?.name ?? null,
          customerPhone: o.customer?.phone ?? null,
          notes: o.notes,
          paymentMethod: o.payments[0]?.method ?? null,
          orderItems: o.items.map((it) => ({
            productName: it.product.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            flavorNames: it.flavors.map((f) => f.flavor.name),
          })),
          itemsSummary: o.items
            .map((it) => {
              const flavorNames = it.flavors.map((f) => f.flavor.name);
              return `${it.quantity}x ${it.product.name}${flavorNames.length ? ` (${flavorNames.join(", ")})` : ""}`;
            })
            .join(" · "),
        }))}
      />
    </div>
  );
}
