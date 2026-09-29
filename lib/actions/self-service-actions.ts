"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { selfServiceOrderSchema, type SelfServiceOrderInput } from "@/lib/validations/self-service";
import {
  ORDER_STATUS,
  ORDER_CHANNEL,
  PAYMENT_METHOD,
  CASH_MOVEMENT_TYPE,
  NOTIFICATION_TYPE,
  SELF_SERVICE_DELIVERY_FEE,
} from "@/lib/constants";
import { deductStockForSale } from "@/lib/stock-deduction";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Pedido público, sin login: lo arma el cliente desde /autoservicio. A diferencia de
 * createSale, no hay sesión de staff — no hay servedById, el pago queda fijo en efectivo
 * (nunca se confía en un método de pago mandado por el cliente). El cliente se busca/crea
 * por teléfono (más confiable que el nombre para identificar al mismo cliente).
 */
export async function createSelfServiceOrder(
  input: SelfServiceOrderInput
): Promise<ActionResult<{ number: number; total: number }>> {
  const parsed = selfServiceOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  // Defensa en profundidad: la página ya oculta el formulario cuando está apagado, pero
  // esto evita que alguien mande el pedido llamando la action directamente.
  const enabledSetting = await db.setting.findUnique({ where: { key: "autoservicio.enabled" } });
  if (enabledSetting?.value === "false") {
    return { ok: false, error: "El Autoservicio está cerrado en este momento" };
  }

  const productIds = data.items.map((i) => i.productId);
  const products = await db.product.findMany({ where: { id: { in: productIds }, active: true } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of data.items) {
    if (!productMap.has(item.productId)) return { ok: false, error: "Hay un producto inválido en el pedido" };
  }

  const subtotal = data.items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);
  const deliveryFee = data.type === "DELIVERY" ? SELF_SERVICE_DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const change = data.cashTendered - total;
  const paymentNote = `Paga con $${data.cashTendered.toLocaleString("es-AR")}${change >= 0 ? ` (vuelto $${change.toLocaleString("es-AR")})` : ""}`;
  const notes = data.observations?.trim() ? `${paymentNote}\nObs: ${data.observations.trim()}` : paymentNote;

  const result = await db.$transaction(async (tx) => {
    let customer = await tx.customer.findFirst({ where: { phone: data.customerPhone } });
    if (customer) {
      customer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          name: data.customerName,
          phone: data.customerPhone,
          totalSpent: { increment: total },
          lastPurchaseAt: new Date(),
          points: { increment: Math.floor(total / 100) },
        },
      });
    } else {
      customer = await tx.customer.create({
        data: {
          name: data.customerName,
          phone: data.customerPhone,
          totalSpent: total,
          lastPurchaseAt: new Date(),
          points: Math.floor(total / 100),
        },
      });
    }

    const max = await tx.order.aggregate({ _max: { number: true } });
    const number = (max._max.number ?? 1040) + 1;

    const order = await tx.order.create({
      data: {
        number,
        type: data.type,
        status: ORDER_STATUS.RECEIVED,
        channel: ORDER_CHANNEL.SELF_SERVICE,
        customerId: customer.id,
        servedById: null,
        deliveryAddress: data.type === "DELIVERY" ? data.deliveryAddress || null : null,
        subtotal,
        discount: 0,
        total,
        notes,
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
      data: { orderId: order.id, method: PAYMENT_METHOD.CASH, amount: total },
    });

    await deductStockForSale(
      tx,
      data.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      order.number
    );

    const openRegister = await tx.cashRegister.findFirst({ where: { status: "OPEN" } });
    if (openRegister) {
      // El envío no entra a la caja del local (queda con el repartidor) — el efectivo
      // esperado de Caja solo debe reflejar el valor de los productos, no el total del
      // pedido (que sí incluye el envío, para el ticket y lo que paga el cliente).
      await tx.cashMovement.create({
        data: {
          cashRegisterId: openRegister.id,
          type: CASH_MOVEMENT_TYPE.SALE_CASH,
          amount: subtotal,
          paymentMethod: PAYMENT_METHOD.CASH,
          description: `Venta pedido #${order.number} (autoservicio)`,
          userId: null,
          orderId: order.id,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: null,
        action: "order.self_service_create",
        entity: "Order",
        entityId: order.id,
        metadata: JSON.stringify({ number: order.number, total }),
      },
    });

    await tx.notification.create({
      data: {
        type: NOTIFICATION_TYPE.NEW_ORDER,
        title: "Pedido de autoservicio",
        message: `Pedido #${order.number} por $${total.toLocaleString("es-AR")}`,
        link: "/admin/pedidos",
      },
    });

    return order;
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  return { ok: true, data: { number: result.number, total } };
}
