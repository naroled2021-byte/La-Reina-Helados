import { ShoppingBag } from "lucide-react";
import { getSalesPageData } from "@/lib/queries/sales";
import { db } from "@/lib/db";
import { AutoservicioClient } from "@/components/autoservicio/autoservicio-client";

export const dynamic = "force-dynamic";

export default async function AutoservicioPage() {
  const [{ products, flavors }, autoservicioSettings] = await Promise.all([
    getSalesPageData(),
    db.setting.findMany({ where: { key: { in: ["autoservicio.waitMinutes", "autoservicio.enabled"] } } }),
  ]);
  const settingsMap = Object.fromEntries(autoservicioSettings.map((s) => [s.key, s.value]));
  const waitMinutes = Number(settingsMap["autoservicio.waitMinutes"]) || 0;
  const enabled = settingsMap["autoservicio.enabled"] !== "false";

  if (!enabled) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <ShoppingBag className="size-14 text-muted-foreground" strokeWidth={1.5} />
          <h1 className="text-xl font-semibold">Autoservicio cerrado</h1>
          <p className="text-sm text-muted-foreground">
            En este momento no estamos recibiendo pedidos por acá. Podés acercarte al local para hacer tu
            pedido en el mostrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AutoservicioClient
      waitMinutes={waitMinutes}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
        price: p.price,
        cost: p.cost,
        active: p.active,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        allowsFlavors: p.allowsFlavors,
        maxFlavors: p.maxFlavors,
      }))}
      flavors={flavors.map((f) => ({ id: f.id, name: f.name, popular: f.popular, imageUrl: f.imageUrl }))}
    />
  );
}
