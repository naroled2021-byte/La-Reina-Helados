import { db } from "@/lib/db";
import { ORDER_STATUS } from "@/lib/constants";
import { startOfDayAR } from "@/lib/date-ar";

export async function getKanbanOrders() {
  const today = startOfDayAR();

  return db.order.findMany({
    where: {
      status: { not: ORDER_STATUS.CANCELLED },
      createdAt: { gte: today },
    },
    include: {
      items: { include: { product: true, flavors: { include: { flavor: true } } } },
      customer: true,
      payments: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
