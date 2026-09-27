import { db } from "@/lib/db";
import { ORDER_STATUS } from "@/lib/constants";
import { startOfDayAR } from "@/lib/date-ar";

export async function getKanbanOrders() {
  // Si hay una caja abierta, Pedidos solo muestra lo que entró desde que se abrió. Si la
  // última caja ya se cerró, el corte pasa a ser ese cierre (no el día completo) — así los
  // pedidos de la caja anterior dejan de aparecer apenas se cierra, sin esperar a que se
  // abra una nueva. Si nunca hubo caja hoy, se muestra el día completo como antes.
  const lastRegister = await db.cashRegister.findFirst({
    where: { status: { in: ["OPEN", "CLOSED"] } },
    orderBy: { openedAt: "desc" },
  });
  const since = lastRegister
    ? (lastRegister.status === "OPEN" ? lastRegister.openedAt : lastRegister.closedAt) ?? startOfDayAR()
    : startOfDayAR();

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
