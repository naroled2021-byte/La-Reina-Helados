import { requirePermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { InventoryClient } from "@/components/inventory/inventory-client";

export default async function StockPage() {
  await requirePermission("inventory.manage");

  const [items, movements] = await Promise.all([
    db.inventoryItem.findMany({
      include: { supplier: true, flavor: true },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    db.inventoryMovement.findMany({
      include: { inventoryItem: true, user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold">Stock</h1>
        <p className="text-sm text-muted-foreground">
          Inventario de La Reina Helados — {items.length} ítems
        </p>
      </div>

      <InventoryClient
        initialItems={items.map((i) => ({
          id: i.id,
          name: i.name,
          type: i.type,
          unit: i.unit,
          currentStock: i.currentStock,
          minStock: i.minStock,
          maxStock: i.maxStock,
          cost: i.cost,
          price: i.price,
          supplierId: i.supplierId,
          supplierName: i.supplier?.name ?? null,
          active: i.active,
          isFlavor: !!i.flavor,
        }))}
        movements={movements.map((m) => ({
          id: m.id,
          itemName: m.inventoryItem.name,
          type: m.type,
          quantity: m.quantity,
          unit: m.inventoryItem.unit,
          reason: m.reason,
          userName: m.user?.name ?? null,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
