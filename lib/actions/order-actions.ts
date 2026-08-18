"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-helpers";
import { ORDER_STATUS, PAYMENT_METHOD } from "@/lib/constants";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const movableStatuses = [
  ORDER_STATUS.RECEIVED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.DELIVERED,
] as const;

export async function updateOrderStatus(orderId: string, status: string): Promise<ActionResult> {
  const session = await requirePermission("orders.manage");

  if (!movableStatuses.includes(status as (typeof movableStatuses)[number])) {
    return { ok: false, error: "Estado inválido" };
  }

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Pedido no encontrado" };
  if (order.status === ORDER_STATUS.CANCELLED) {
    return { ok: false, error: "Este pedido está cancelado" };
  }

  await db.order.update({ where: { id: orderId }, data: { status } });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "order.status_change",
      entity: "Order",
      entityId: orderId,
      metadata: JSON.stringify({ number: order.number, from: order.status, to: status }),
    },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  return { ok: true, data: undefined };
}

export async function updateOrderPaymentMethod(orderId: string, method: string): Promise<ActionResult> {
  const session = await requirePermission("orders.manage");

  if (!Object.values(PAYMENT_METHOD).includes(method as (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD])) {
    return { ok: false, error: "Método de pago inválido" };
  }

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Pedido no encontrado" };

  await db.payment.updateMany({ where: { orderId }, data: { method } });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "order.payment_method_change",
      entity: "Order",
      entityId: orderId,
      metadata: JSON.stringify({ number: order.number, method }),
    },
  });

  revalidatePath("/admin/pedidos");
  return { ok: true, data: undefined };
}

