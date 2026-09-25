import { db } from "@/lib/db";
import { ORDER_STATUS } from "@/lib/constants";
import { startOfDayAR } from "@/lib/date-ar";

export async function getKanbanOrders() {
  // Si hay una caja abierta, Pedidos solo muestra lo que entró desde que se abrió — al
  // cerrar caja y abrir una nueva, los pedidos de la caja anterior dejan de aparecer,
  // aunque sea el mismo día. Sin caja abierta, se muestra el día completo como antes.
  const openRegister = await db.cashRegister.findFirst({
    where: { status: "OPEN" },
    orderBy: { openedAt: "desc" },
  });
  const since = openRegister?.openedAt ?? startOfDayAR();

  return db.order.findMany({
    where: {
      status: { not: ORDER_STATUS.CANCELLED },
      createdAt: { gte: since },
    },
    include: {
      items: { include: { product: true, flavors: { include: { flavor: true } } } },
      customer: true,
      payments: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
