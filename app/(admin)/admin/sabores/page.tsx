import { requirePermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { FlavorsClient } from "@/components/flavors/flavors-client";

export default async function SaboresPage() {
  await requirePermission("products.manage");

  const flavors = await db.flavor.findMany({
    include: { inventoryItem: true },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold">Sabores</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo de sabores de La Reina Helados — {flavors.length} sabores
        </p>
      </div>

      <FlavorsClient
        initialFlavors={flavors.map((f) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          imageUrl: f.imageUrl,
          category: f.category,
          popular: f.popular,
          active: f.active,
          currentStock: f.inventoryItem?.currentStock ?? 0,
          minStock: f.inventoryItem?.minStock ?? 0,
        }))}
      />
    </div>
  );
}
