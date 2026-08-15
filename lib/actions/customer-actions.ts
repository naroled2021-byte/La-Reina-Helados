"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-helpers";
import { customerSchema, type CustomerInput } from "@/lib/validations/customer";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function createCustomer(
  input: CustomerInput
): Promise<ActionResult<{ id: string; name: string }>> {
  const session = await requirePermission("customers.manage");
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const customer = await db.customer.create({
    data: {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null,
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "customer.create",
      entity: "Customer",
      entityId: customer.id,
      metadata: JSON.stringify({ name: customer.name }),
    },
  });

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/ventas");
  return { ok: true, data: { id: customer.id, name: customer.name } };
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<ActionResult> {
  const session = await requirePermission("customers.manage");
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  await db.customer.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null,
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "customer.update",
      entity: "Customer",
      entityId: id,
      metadata: JSON.stringify({ name: data.name }),
    },
  });

  revalidatePath("/admin/clientes");
  return { ok: true, data: undefined };
}

export async function getCustomerOrders(customerId: string) {
  await requirePermission("customers.manage");
  return db.order.findMany({
    where: { customerId },
    include: { items: { include: { product: true } }, payments: true },
    orderBy: { createdAt: "desc" },
  });
}
