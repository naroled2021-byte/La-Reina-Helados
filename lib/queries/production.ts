import { db } from "@/lib/db";
import { getStockStatus } from "@/lib/constants";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getProductionSuggestions() {
  const flavors = await db.flavor.findMany({
    where: { active: true },
    include: { inventoryItem: true },
    orderBy: { name: "asc" },
  });

  return flavors
    .filter((f) => f.inventoryItem)
    .map((f) => {
      const inv = f.inventoryItem!;
      const status = getStockStatus(inv.currentStock, inv.minStock);
      const target = inv.maxStock > 0 ? inv.maxStock : inv.minStock * 1.5;
      const suggested = Math.max(Math.round((target - inv.currentStock) * 10) / 10, 0);
      return {
        flavorId: f.id,
        flavorName: f.name,
        currentStock: inv.currentStock,
        minStock: inv.minStock,
        suggested,
        status,
      };
    })
    .filter((s) => (s.status === "LOW" || s.status === "CRITICAL" || s.status === "OUT") && s.suggested > 0)
    .sort((a, b) => a.currentStock / (a.minStock || 1) - b.currentStock / (b.minStock || 1));
}

export async function getTodayProductions() {
  const today = startOfDay(new Date());

  return db.production.findMany({
    where: { date: { gte: today } },
    include: {
      items: { include: { flavor: { include: { inventoryItem: true } } } },
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
