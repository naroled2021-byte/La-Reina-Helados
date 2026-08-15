import { db } from "@/lib/db";
import { ORDER_STATUS, getStockStatus } from "@/lib/constants";
import type { DateRange } from "@/lib/date-range";

const notCancelled = { not: ORDER_STATUS.CANCELLED };

export async function getSalesReport({ from, to }: DateRange) {
  const orders = await db.order.findMany({
    where: { createdAt: { gte: from, lte: to }, status: notCancelled },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  const total = orders.reduce((sum, o) => sum + o.total, 0);
  const count = orders.length;
  const avgTicket = count ? total / count : 0;

  const dailyMap = new Map<string, number>();
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + o.total);
  }
  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));

  return {
    total,
    count,
    avgTicket,
    daily,
    rows: orders.map((o) => ({
      number: o.number,
      date: o.createdAt.toISOString(),
      type: o.type,
      status: o.status,
      customer: o.customer?.name ?? "Consumidor final",
      total: o.total,
    })),
  };
}

export async function getProductsReport({ from, to }: DateRange) {
  const items = await db.orderItem.findMany({
    where: { order: { createdAt: { gte: from, lte: to }, status: notCancelled } },
    include: { product: true },
  });

  const map = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const it of items) {
    const prev = map.get(it.productId) ?? { name: it.product.name, quantity: 0, revenue: 0 };
    prev.quantity += it.quantity;
    prev.revenue += it.subtotal;
    map.set(it.productId, prev);
  }

  return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
}

export async function getFlavorsReport({ from, to }: DateRange) {
  const items = await db.orderItemFlavor.findMany({
    where: {
      orderItem: { order: { createdAt: { gte: from, lte: to }, status: notCancelled } },
    },
    include: { flavor: true },
  });

  const map = new Map<string, { name: string; count: number }>();
  for (const it of items) {
    const prev = map.get(it.flavorId) ?? { name: it.flavor.name, count: 0 };
    prev.count += 1;
    map.set(it.flavorId, prev);
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export async function getCustomersReport({ from, to }: DateRange) {
  const orders = await db.order.findMany({
    where: { createdAt: { gte: from, lte: to }, status: notCancelled, customerId: { not: null } },
    include: { customer: true },
  });

  const map = new Map<string, { name: string; orders: number; total: number }>();
  for (const o of orders) {
    if (!o.customer) continue;
    const prev = map.get(o.customerId!) ?? { name: o.customer.name, orders: 0, total: 0 };
    prev.orders += 1;
    prev.total += o.total;
    map.set(o.customerId!, prev);
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export async function getStockReport({ from, to }: DateRange) {
  const [items, movements] = await Promise.all([
    db.inventoryItem.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.inventoryMovement.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { inventoryItem: true },
    }),
  ]);

  const movementTotals = { IN: 0, OUT: 0, PRODUCTION: 0, WASTE: 0, ADJUSTMENT: 0, SALE: 0 } as Record<string, number>;
  for (const m of movements) movementTotals[m.type] = (movementTotals[m.type] ?? 0) + m.quantity;

  return {
    movementTotals,
    rows: items.map((i) => ({
      name: i.name,
      type: i.type,
      unit: i.unit,
      currentStock: i.currentStock,
      minStock: i.minStock,
      status: getStockStatus(i.currentStock, i.minStock),
    })),
  };
}

export async function getProductionReport({ from, to }: DateRange) {
  const items = await db.productionItem.findMany({
    where: { production: { date: { gte: from, lte: to } } },
    include: { flavor: true, production: true },
    orderBy: { production: { date: "desc" } },
  });

  return items.map((it) => ({
    date: it.production.date.toISOString(),
    flavor: it.flavor.name,
    quantityPlanned: it.quantityPlanned,
    quantityProduced: it.quantityProduced,
    waste: it.waste,
  }));
}

export async function getCashReport({ from, to }: DateRange) {
  const registers = await db.cashRegister.findMany({
    where: { closedAt: { gte: from, lte: to } },
    include: { openedBy: true, closedBy: true },
    orderBy: { closedAt: "desc" },
  });

  return registers.map((r) => ({
    openedAt: r.openedAt.toISOString(),
    closedAt: r.closedAt?.toISOString() ?? null,
    openingAmount: r.openingAmount,
    closingAmountExpected: r.closingAmountExpected ?? 0,
    closingAmountDeclared: r.closingAmountDeclared ?? 0,
    difference: r.difference ?? 0,
    closedBy: r.closedBy?.name ?? "—",
  }));
}

export async function getPaymentMethodsReport({ from, to }: DateRange) {
  const payments = await db.payment.findMany({
    where: { createdAt: { gte: from, lte: to }, order: { status: notCancelled } },
  });

  const map = new Map<string, { amount: number; count: number }>();
  for (const p of payments) {
    const prev = map.get(p.method) ?? { amount: 0, count: 0 };
    prev.amount += p.amount;
    prev.count += 1;
    map.set(p.method, prev);
  }

  return Array.from(map.entries()).map(([method, data]) => ({ method, ...data }));
}

export async function getProfitReport({ from, to }: DateRange) {
  const items = await db.orderItem.findMany({
    where: { order: { createdAt: { gte: from, lte: to }, status: notCancelled } },
    include: { product: true },
  });

  const revenue = items.reduce((sum, it) => sum + it.subtotal, 0);
  const cost = items.reduce((sum, it) => sum + it.product.cost * it.quantity, 0);
  const profit = revenue - cost;
  const margin = revenue ? (profit / revenue) * 100 : 0;

  return { revenue, cost, profit, margin };
}

export async function getPromotionsReport() {
  const [promotions, coupons] = await Promise.all([
    db.promotion.findMany({ orderBy: { name: "asc" } }),
    db.coupon.findMany({ orderBy: { code: "asc" } }),
  ]);

  return {
    promotions: promotions.map((p) => ({
      name: p.name,
      type: p.type,
      active: p.active,
      startDate: p.startDate?.toISOString() ?? null,
      endDate: p.endDate?.toISOString() ?? null,
    })),
    coupons: coupons.map((c) => ({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      active: c.active,
      usageLimit: c.usageLimit,
    })),
  };
}
