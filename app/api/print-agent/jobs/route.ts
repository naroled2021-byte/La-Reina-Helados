import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPrintAgentToken } from "@/lib/print-agent-auth";
import { getTicketSettings } from "@/lib/queries/settings";
import { PAYMENT_METHOD_LABEL, ORDER_TYPE } from "@/lib/constants";

function buildTestTicket() {
  return {
    number: 0,
    createdAt: new Date().toISOString(),
    items: [{ productName: "Prueba de impresión", quantity: 1, unitPrice: 0, flavorNames: [] as string[] }],
    subtotal: 0,
    discount: 0,
    total: 0,
    paymentMethodLabel: "-",
    orderType: ORDER_TYPE.TAKEAWAY,
    customerName: null as string | null,
    deliveryAddress: null as string | null,
  };
}

export async function GET(req: NextRequest) {
  if (!verifyPrintAgentToken(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const settings = await getTicketSettings();

  const pending = await db.printJob.findMany({
    where: { status: "PENDING" },
    include: {
      order: {
        include: {
          items: { include: { product: true, flavors: { include: { flavor: true } } } },
          payments: true,
          customer: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  if (pending.length === 0) {
    return NextResponse.json({ settings, jobs: [] });
  }

  // Reclamo uno por uno (no un updateMany en bloque): un UPDATE con status: "PENDING" en
  // el WHERE es atómico por fila en Postgres, así que si dos Print Agents (o dos consultas
  // superpuestas) leen el mismo PENDING al mismo tiempo, solo una de las dos gana la carrera
  // por cada fila — la otra ve count 0 y no se lleva ese trabajo. Sin esto, un
  // updateMany posterior a un findMany deja una ventana donde ambas consultas pueden
  // entregar el mismo pedido dos veces (pasó de verdad: 3 copias del mismo ticket).
  const claimed = [];
  for (const job of pending) {
    const result = await db.printJob.updateMany({
      where: { id: job.id, status: "PENDING" },
      data: { status: "SENDING" },
    });
    if (result.count === 1) claimed.push(job);
  }

  const jobs = claimed.map((job) => {
    if (job.isTest || !job.order) {
      return { id: job.id, isTest: true, ticket: buildTestTicket() };
    }
    const order = job.order;
    const paymentMethod = order.payments[0]?.method ?? null;
    return {
      id: job.id,
      isTest: false,
      ticket: {
        number: order.number,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((it) => ({
          productName: it.product.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          flavorNames: it.flavors.map((f) => f.flavor.name),
        })),
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
        paymentMethodLabel: PAYMENT_METHOD_LABEL[paymentMethod ?? ""] ?? paymentMethod ?? "",
        orderType: order.type,
        customerName: order.customer?.name ?? null,
        deliveryAddress: order.deliveryAddress,
      },
    };
  });

  return NextResponse.json({ settings, jobs });
}
