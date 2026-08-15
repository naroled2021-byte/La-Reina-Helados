import { requirePermission } from "@/lib/auth-helpers";
import { getSalesPageData } from "@/lib/queries/sales";
import { SalesClient } from "@/components/sales/sales-client";

export default async function VentasPage() {
  await requirePermission("sales.create");

  const { products, flavors, paymentMethods, customers, todaySales } = await getSalesPageData();

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold">Ventas</h1>
        <p className="text-sm text-muted-foreground">Armá una venta rápida de mostrador</p>
      </div>

      <SalesClient
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
        flavors={flavors.map((f) => ({ id: f.id, name: f.name, popular: f.popular, imageUrl: f.imageUrl }))}
        paymentMethods={paymentMethods.map((m) => ({ key: m.key, label: m.label }))}
        customers={customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))}
        todaySales={todaySales.map((o) => ({
          id: o.id,
          number: o.number,
          createdAt: o.createdAt.toISOString(),
          total: o.total,
          status: o.status,
          paymentMethod: o.payments[0]?.method ?? null,
          customerName: o.customer?.name ?? null,
          itemsSummary: o.items.map((it) => `${it.quantity}x ${it.product.name}`).join(", "),
        }))}
      />
    </div>
  );
}
