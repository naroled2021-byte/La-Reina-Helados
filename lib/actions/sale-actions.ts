"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-helpers";
import { saleSchema, type SaleInput } from "@/lib/validations/sale";
import { ORDER_STATUS, ORDER_CHANNEL, PAYMENT_METHOD, CASH_MOVEMENT_TYPE, NOTIFICATION_TYPE } from "@/lib/constants";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function createSale(
  input: SaleInput
): Promise<ActionResult<{ orderId: string; number: number; total: number }>> {
  const session = await requirePermission("sales.create");
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const productIds = data.items.map((i) => i.productId);
  const products = await db.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of data.items) {
    if (!productMap.has(item.productId)) return { ok: false, error: "Hay un producto inválido en el carrito" };
  }

  const subtotal = data.items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);
  const discount = Math.min(data.discount, subtotal);
  const total = Math.max(subtotal - discount, 0);

  const result = await db.$transaction(async (tx) => {
    const max = await tx.order.aggregate({ _max: { number: true } });
    const number = (max._max.number ?? 1040) + 1;

    const order = await tx.order.create({
      data: {
        number,
        type: data.type,
        status: ORDER_STATUS.RECEIVED,
        channel: ORDER_CHANNEL.COUNTER,
        customerId: data.customerId || null,
        servedById: session.user.id,
        tableNumber: data.type === "DINE_IN" ? data.tableNumber || null : null,
        deliveryAddress: data.type === "DELIVERY" ? data.deliveryAddress || null : null,
        subtotal,
        discount,
        total,
        items: {
          create: data.items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: product.price,
              subtotal: product.price * item.quantity,
              format: product.allowsFlavors ? product.name : null,
              flavors: item.flavorIds.length
                ? { create: item.flavorIds.map((flavorId) => ({ flavorId })) }
                : undefined,
            };
          }),
        },
      },
    });

    await tx.payment.create({
      data: { orderId: order.id, method: data.paymentMethod, amount: total },
    });

    const openRegister = await tx.cashRegister.findFirst({ where: { status: "OPEN" } });
    if (openRegister) {
      await tx.cashMovement.create({
        data: {
          cashRegisterId: openRegister.id,
          type: data.paymentMethod === PAYMENT_METHOD.CASH ? CASH_MOVEMENT_TYPE.SALE_CASH : CASH_MOVEMENT_TYPE.SALE_DIGITAL,
          amount: total,
          description: `Venta pedido #${order.number}`,
          userId: session.user.id,
          orderId: order.id,
        },
      });
    }

    if (data.customerId) {
      await tx.customer.update({
        where: { id: data.customerId },
        data: {
          totalSpent: { increment: total },
          lastPurchaseAt: new Date(),
          points: { increment: Math.floor(total / 100) },
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "order.create",
        entity: "Order",
        entityId: order.id,
        metadata: JSON.stringify({ number: order.number, total }),
      },
    });

    await tx.notification.create({
      data: {
        type: NOTIFICATION_TYPE.NEW_ORDER,
        title: "Nueva venta",
        message: `Pedido #${order.number} por $${total.toLocaleString("es-AR")}`,
        link: "/admin/ventas",
      },
    });

    return order;
  });

  revalidatePath("/admin/ventas");
  revalidatePath("/admin");
  return { ok: true, data: { orderId: result.id, number: result.number, total } };
}

export async function cancelSale(orderId: string): Promise<ActionResult> {
  const session = await requirePermission("sales.create");

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Venta no encontrada" };
  if (order.status === ORDER_STATUS.CANCELLED) return { ok: true, data: undefined };

  await db.$transaction([
    db.order.update({ where: { id: orderId }, data: { status: ORDER_STATUS.CANCELLED } }),
    db.cashMovement.deleteMany({ where: { orderId } }),
  ]);

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "order.cancel",
      entity: "Order",
      entityId: orderId,
      metadata: JSON.stringify({ number: order.number }),
    },
  });

  revalidatePath("/admin/ventas");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  return { ok: true, data: undefined };
}
