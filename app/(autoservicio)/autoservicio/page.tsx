import { getSalesPageData } from "@/lib/queries/sales";
import { db } from "@/lib/db";
import { AutoservicioClient } from "@/components/autoservicio/autoservicio-client";

export const dynamic = "force-dynamic";

export default async function AutoservicioPage() {
  const [{ products, flavors }, waitSetting] = await Promise.all([
    getSalesPageData(),
    db.setting.findUnique({ where: { key: "autoservicio.waitMinutes" } }),
  ]);
  const waitMinutes = Number(waitSetting?.value) || 0;

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
