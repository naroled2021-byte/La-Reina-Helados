import { getMostradorPageData } from "@/lib/queries/sales";
import { ArticulosClient } from "@/components/mostrador/articulos-client";

export default async function MostradorArticulosPage() {
  const { products, paymentMethods } = await getMostradorPageData();

  return (
    <ArticulosClient
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        price: p.price,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        allowsFlavors: p.allowsFlavors,
        maxFlavors: p.maxFlavors,
      }))}
      paymentMethods={paymentMethods.map((m) => ({ key: m.key, label: m.label }))}
    />
  );
}
