import { db } from "@/lib/db";
import { ORDER_CHANNEL } from "@/lib/constants";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getSalesPageData() {
  const today = startOfDay(new Date());

  const [products, flavors, paymentMethods, customers, todaySales] = await Promise.all([
    db.product.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: [{ category: { order: "asc" } }, { name: "asc" }],
    }),
    db.flavor.findMany({ where: { active: true }, orderBy: [{ popular: "desc" }, { name: "asc" }] }),
    db.paymentMethodConfig.findMany({ where: { enabled: true }, orderBy: { order: "asc" } }),
    db.customer.findMany({ orderBy: { name: "asc" } }),
    db.order.findMany({
      where: { channel: ORDER_CHANNEL.COUNTER, createdAt: { gte: today } },
      include: {
        items: { include: { product: true, flavors: { include: { flavor: true } } } },
        payments: true,
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { products, flavors, paymentMethods, customers, todaySales };
}

export async function getNextOrderNumber(): Promise<number> {
  const max = await db.order.aggregate({ _max: { number: true } });
  return (max._max.number ?? 1040) + 1;
}

export async function getMostradorPageData() {
  const [products, paymentMethods] = await Promise.all([
    db.product.findMany({
      where: { active: true, showInCounter: true },
      include: { category: true },
      orderBy: [{ category: { order: "asc" } }, { name: "asc" }],
    }),
    db.paymentMethodConfig.findMany({ where: { enabled: true }, orderBy: { order: "asc" } }),
  ]);

  return { products, paymentMethods };
}
