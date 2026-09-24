import { requirePermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { ProductsClient } from "@/components/products/products-client";

export default async function ProductosPage() {
  await requirePermission("products.manage");

  const [products, categories] = await Promise.all([
    db.product.findMany({
      include: { category: true },
      orderBy: [{ active: "desc" }, { order: "asc" }, { name: "asc" }],
    }),
    db.category.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold">Productos</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo de productos de La Reina Helados — {products.length} productos
        </p>
      </div>

      <ProductsClient
        initialProducts={products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          imageUrl: p.imageUrl,
          categoryId: p.categoryId,
          categoryName: p.category.name,
          price: p.price,
          cost: p.cost,
          active: p.active,
          allowsFlavors: p.allowsFlavors,
          maxFlavors: p.maxFlavors,
        }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
