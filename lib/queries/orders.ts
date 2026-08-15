import { db } from "@/lib/db";
import { ORDER_STATUS } from "@/lib/constants";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getKanbanOrders() {
  const today = startOfDay(new Date());

  return db.order.findMany({
    where: {
      status: { not: ORDER_STATUS.CANCELLED },
      OR: [{ status: { not: ORDER_STATUS.DELIVERED } }, { createdAt: { gte: today } }],
    },
    include: {
      items: { include: { product: true, flavors: { include: { flavor: true } } } },
      customer: true,
      payments: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
