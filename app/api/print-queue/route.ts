import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ORDER_STATUS, ORDER_CHANNEL } from "@/lib/constants";
import { buildComandaText } from "@/lib/comanda-text";

const CHANNEL_PARAM: Record<string, string> = {
  mostrador: ORDER_CHANNEL.COUNTER,
  autoservicio: ORDER_CHANNEL.SELF_SERVICE,
};

// Lo consulta el agente local de impresión (un script en la PC del local, no un navegador):
// "reclama" los pedidos del canal pedido que todavía no se imprimieron, los marca como
// impresos en el mismo paso (para que dos consultas seguidas no impriman el mismo pedido
// dos veces) y devuelve el texto ya armado, listo para mandar directo a la impresora.
export async function GET(req: NextRequest) {
  const token = req.headers.get("x-print-agent-token") ?? req.nextUrl.searchParams.get("token");
  if (!token || token !== process.env.PRINT_AGENT_TOKEN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const canalParam = req.nextUrl.searchParams.get("canal") ?? "";
  const channel = CHANNEL_PARAM[canalParam];
  if (!channel) {
    return NextResponse.json({ error: "Parámetro 'canal' inválido (mostrador | autoservicio)" }, { status: 400 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const jobs = await db.$transaction(async (tx) => {
    const pending = await tx.order.findMany({
      where: {
        channel,
        printedAt: null,
        status: { not: ORDER_STATUS.CANCELLED },
        createdAt: { gte: since },
      },
      include: { items: { include: { product: true, flavors: { include: { flavor: true } } } }, customer: true },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    if (pending.length > 0) {
      await tx.order.updateMany({
        where: { id: { in: pending.map((o) => o.id) } },
        data: { printedAt: new Date() },
      });
    }

    return pending;
  });

  const texts = jobs.map((o) =>
    buildComandaText({
      number: o.number,
      channel: o.channel,
      channelNumber: o.channelNumber,
      createdAt: o.createdAt,
      type: o.type,
      customerName: o.customer?.name ?? null,
      customerPhone: o.customer?.phone ?? null,
      deliveryAddress: o.deliveryAddress,
      notes: o.notes,
      items: o.items.map((it) => ({
        productName: it.product.name,
        quantity: it.quantity,
        flavorNames: it.flavors.map((f) => f.flavor.name),
      })),
    })
  );

  return NextResponse.json({ jobs: texts });
}
