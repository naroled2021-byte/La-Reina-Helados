import { db } from "./lib/db";

async function main() {
  const order = await db.order.findUnique({
    where: { number: 1048 },
    include: { items: { include: { product: true } }, payments: true },
  });
  if (!order) {
    console.log("Order #1048 not found");
    return;
  }
  console.log({
    number: order.number,
    channel: order.channel,
    status: order.status,
    createdAt: order.createdAt,
    now: new Date(),
    secondsAgo: (Date.now() - order.createdAt.getTime()) / 1000,
    total: order.total,
    payments: order.payments.map((p) => p.method),
  });
}

main().finally(() => db.$disconnect());
