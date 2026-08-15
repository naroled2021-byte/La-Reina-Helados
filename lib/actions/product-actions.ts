"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-helpers";
import {
  productSchema,
  categorySchema,
  categoryUpdateSchema,
  counterProductSchema,
  type ProductInput,
  type CategoryUpdateInput,
  type CounterProductInput,
} from "@/lib/validations/product";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function createProduct(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  const session = await requirePermission("products.manage");
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const product = await db.product.create({
    data: {
      name: data.name,
      description: data.description || null,
      categoryId: data.categoryId,
      price: data.price,
      cost: data.cost ?? 0,
      imageUrl: data.imageUrl || null,
      allowsFlavors: data.allowsFlavors,
      maxFlavors: data.allowsFlavors ? data.maxFlavors : 0,
      active: true,
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "product.create",
      entity: "Product",
      entityId: product.id,
      metadata: JSON.stringify({ name: product.name }),
    },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/admin");
  return { ok: true, data: { id: product.id } };
}

export async function updateProduct(id: string, input: ProductInput): Promise<ActionResult> {
  const session = await requirePermission("products.manage");
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  await db.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      categoryId: data.categoryId,
      price: data.price,
      cost: data.cost ?? 0,
      imageUrl: data.imageUrl || null,
      allowsFlavors: data.allowsFlavors,
      maxFlavors: data.allowsFlavors ? data.maxFlavors : 0,
      active: data.active,
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "product.update",
      entity: "Product",
      entityId: id,
      metadata: JSON.stringify({ name: data.name }),
    },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/admin");
  return { ok: true, data: undefined };
}

export async function toggleProductActive(id: string): Promise<ActionResult<{ active: boolean }>> {
  const session = await requirePermission("products.manage");

  const product = await db.product.findUnique({ where: { id } });
  if (!product) return { ok: false, error: "Producto no encontrado" };

  const updated = await db.product.update({
    where: { id },
    data: { active: !product.active },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: updated.active ? "product.activate" : "product.deactivate",
      entity: "Product",
      entityId: id,
      metadata: JSON.stringify({ name: product.name }),
    },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/admin");
  return { ok: true, data: { active: updated.active } };
}

export async function createCategory(name: string): Promise<ActionResult<{ id: string; name: string }>> {
  await requirePermission("products.manage");
  const parsed = categorySchema.safeParse({ name });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const existing = await db.category.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { ok: true, data: { id: existing.id, name: existing.name } };

  const count = await db.category.count();
  const category = await db.category.create({
    data: { name: parsed.data.name, order: count },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/admin/configuracion");
  return { ok: true, data: { id: category.id, name: category.name } };
}

export async function updateCategory(id: string, input: CategoryUpdateInput): Promise<ActionResult> {
  const session = await requirePermission("products.manage");
  const parsed = categoryUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const existing = await db.category.findFirst({ where: { name: data.name, id: { not: id } } });
  if (existing) return { ok: false, error: "Ya existe una categoría con ese nombre" };

  await db.category.update({
    where: { id },
    data: { name: data.name, order: data.order, active: data.active },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "category.update",
      entity: "Category",
      entityId: id,
      metadata: JSON.stringify({ name: data.name }),
    },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/admin/configuracion");
  return { ok: true, data: undefined };
}

export async function createCounterProduct(
  input: CounterProductInput
): Promise<ActionResult<{ id: string; name: string; price: number }>> {
  const session = await requirePermission("sales.create");
  const parsed = counterProductSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  let category = await db.category.findUnique({ where: { name: "Extras" } });
  if (!category) {
    const count = await db.category.count();
    category = await db.category.create({ data: { name: "Extras", order: count } });
  }

  const product = await db.product.create({
    data: {
      name: data.name,
      categoryId: category.id,
      price: data.price,
      active: true,
      allowsFlavors: false,
      maxFlavors: 0,
      showInCounter: true,
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "product.create",
      entity: "Product",
      entityId: product.id,
      metadata: JSON.stringify({ name: product.name, source: "mostrador" }),
    },
  });

  revalidatePath("/mostrador");
  revalidatePath("/admin/productos");
  revalidatePath("/admin");
  return { ok: true, data: { id: product.id, name: product.name, price: product.price } };
}

export async function toggleCategoryActive(id: string): Promise<ActionResult<{ active: boolean }>> {
  const session = await requirePermission("products.manage");

  const category = await db.category.findUnique({ where: { id } });
  if (!category) return { ok: false, error: "Categoría no encontrada" };

  const updated = await db.category.update({
    where: { id },
    data: { active: !category.active },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: updated.active ? "category.activate" : "category.deactivate",
      entity: "Category",
      entityId: id,
      metadata: JSON.stringify({ name: category.name }),
    },
  });

  revalidatePath("/admin/productos");
  revalidatePath("/admin/configuracion");
  return { ok: true, data: { active: updated.active } };
}
