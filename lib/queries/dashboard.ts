import { db } from "@/lib/db";
import { ORDER_STATUS, PAYMENT_METHOD_LABEL, getStockStatus } from "@/lib/constants";
import { computeExpectedCash } from "@/lib/cash-utils";
import { startOfDayAR, startOfMonthAR, dateKeyAR, hourAR } from "@/lib/date-ar";

export async function getDashboardData() {
  const now = new Date();
  const today = startOfDayAR(now);
  const monthStart = startOfMonthAR(now);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [
    ordersToday,
    ordersMonth,
    inventoryItems,
    pendingProductionItems,
    customersThisMonth,
    ordersLast7Days,
    paymentsLast7Days,
    itemsSoldLast30Days,
    flavorsSoldLast30Days,
    openCashRegister,
  ] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: today }, status: { not: ORDER_STATUS.CANCELLED } },
      select: { total: true, status: true },
    }),
    db.order.findMany({
      where: { createdAt: { gte: monthStart }, status: { not: ORDER_STATUS.CANCELLED } },
      select: { total: true },
    }),
    db.inventoryItem.findMany({
      select: { id: true, name: true, currentStock: true, minStock: true, unit: true, type: true },
    }),
    db.productionItem.findMany({
      where: { production: { status: { in: ["PENDING", "IN_PROGRESS"] } } },
      select: { quantityPlanned: true, quantityProduced: true },
    }),
    db.customer.count({ where: { createdAt: { gte: monthStart } } }),
    db.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, status: { not: ORDER_STATUS.CANCELLED } },
      select: { createdAt: true, total: true },
    }),
    db.payment.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { method: true, amount: true },
    }),
    db.orderItem.findMany({
      where: { order: { createdAt: { gte: sevenDaysAgo }, status: { not: ORDER_STATUS.CANCELLED } } },
      select: { quantity: true, subtotal: true, product: { select: { name: true } } },
    }),
    db.orderItemFlavor.findMany({
      where: {
        orderItem: {
          order: { createdAt: { gte: sevenDaysAgo }, status: { not: ORDER_STATUS.CANCELLED } },
        },
      },
      select: { flavor: { select: { name: true } } },
    }),
    db.cashRegister.findFirst({
      where: { status: "OPEN" },
      include: { movements: true },
      orderBy: { openedAt: "desc" },
    }),
  ]);

  const salesToday = ordersToday.reduce((sum, o) => sum + o.total, 0);
  const salesMonth = ordersMonth.reduce((sum, o) => sum + o.total, 0);
  const ordersTodayCount = ordersToday.length;
  const avgTicket = ordersTodayCount ? salesToday / ordersTodayCount : 0;

  const statusCounts = {
    RECEIVED: ordersToday.filter((o) => o.status === ORDER_STATUS.RECEIVED).length,
    PREPARING: ordersToday.filter((o) => o.status === ORDER_STATUS.PREPARING).length,
    READY: ordersToday.filter((o) => o.status === ORDER_STATUS.READY).length,
    DELIVERED: ordersToday.filter((o) => o.status === ORDER_STATUS.DELIVERED).length,
  };

  const criticalStock = inventoryItems
    .map((i) => ({ ...i, stockStatus: getStockStatus(i.currentStock, i.minStock) }))
    .filter((i) => i.stockStatus === "CRITICAL" || i.stockStatus === "OUT");

  // Ventas por día (últimos 7 días)
  const salesByDayMap = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    salesByDayMap.set(dateKeyAR(d), 0);
  }
  for (const o of ordersLast7Days) {
    const key = dateKeyAR(o.createdAt);
    salesByDayMap.set(key, (salesByDayMap.get(key) ?? 0) + o.total);
  }
  const salesByDay = Array.from(salesByDayMap.entries()).map(([date, total]) => ({
    date,
    label: new Date(date + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short" }),
    total,
  }));

  // Productos más vendidos
  const productTotals = new Map<string, number>();
  for (const it of itemsSoldLast30Days) {
    productTotals.set(it.product.name, (productTotals.get(it.product.name) ?? 0) + it.quantity);
  }
  const topProducts = Array.from(productTotals.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Sabores más vendidos
  const flavorTotals = new Map<string, number>();
  for (const it of flavorsSoldLast30Days) {
    flavorTotals.set(it.flavor.name, (flavorTotals.get(it.flavor.name) ?? 0) + 1);
  }
  const topFlavors = Array.from(flavorTotals.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Métodos de pago
  const paymentTotals = new Map<string, number>();
  for (const p of paymentsLast7Days) {
    paymentTotals.set(p.method, (paymentTotals.get(p.method) ?? 0) + p.amount);
  }
  const paymentMethods = Array.from(paymentTotals.entries()).map(([method, amount]) => ({
    method,
    label: PAYMENT_METHOD_LABEL[method] ?? method,
    amount,
  }));

  // Horarios de mayor venta
  const hourMap = new Map<number, number>();
  for (const o of ordersLast7Days) {
    const h = hourAR(o.createdAt);
    hourMap.set(h, (hourMap.get(h) ?? 0) + o.total);
  }
  const peakHours = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}h`,
    total: hourMap.get(h) ?? 0,
  })).filter((h, idx) => idx >= 8 && idx <= 22);

  const gananciaEstimada = itemsSoldLast30Days.reduce((sum, it) => sum + it.subtotal * 0.4, 0);

  const cashCurrent = openCashRegister
    ? computeExpectedCash(openCashRegister.openingAmount, openCashRegister.movements)
    : 0;

  return {
    salesToday,
    salesMonth,
    ordersTodayCount,
    avgTicket,
    statusCounts,
    criticalStock,
    productionPendingCount: pendingProductionItems.filter(
      (p) => p.quantityProduced < p.quantityPlanned
    ).length,
    customersThisMonth,
    salesByDay,
    topProducts,
    topFlavors,
    paymentMethods,
    peakHours,
    gananciaEstimada,
    cashCurrent,
    cashRegisterOpen: !!openCashRegister,
  };
}
