import { requirePermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getProductionSuggestions, getTodayProductions } from "@/lib/queries/production";
import { ProductionClient } from "@/components/production/production-client";

export default async function ProduccionPage() {
  await requirePermission("production.manage");

  const [suggestions, sessions, flavors] = await Promise.all([
    getProductionSuggestions(),
    getTodayProductions(),
    db.flavor.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold">Producción</h1>
        <p className="text-sm text-muted-foreground">Sugerencias y seguimiento de producción de sabores</p>
      </div>

      <ProductionClient
        suggestions={suggestions}
        flavors={flavors.map((f) => ({ id: f.id, name: f.name }))}
        sessions={sessions.map((s) => ({
          id: s.id,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
          createdByName: s.createdBy?.name ?? null,
          items: s.items.map((it) => ({
            id: it.id,
            flavorId: it.flavorId,
            flavorName: it.flavor.name,
            quantityPlanned: it.quantityPlanned,
            quantityProduced: it.quantityProduced,
            waste: it.waste,
            currentStock: it.flavor.inventoryItem?.currentStock ?? 0,
            recorded: it.quantityProduced > 0 || it.waste > 0,
          })),
        }))}
      />
    </div>
  );
}
