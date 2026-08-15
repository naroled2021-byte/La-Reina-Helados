import { getSalesPageData } from "@/lib/queries/sales";
import { getTicketSettings } from "@/lib/queries/settings";
import { DeliveryClient } from "@/components/delivery/delivery-client";

export default async function DeliveryPage() {
  const [{ products, flavors, paymentMethods, customers }, ticketSettings] = await Promise.all([
    getSalesPageData(),
    getTicketSettings(),
  ]);

  return (
    <DeliveryClient
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
      paymentMethods={paymentMethods.map((m) => ({ key: m.key, label: m.label }))}
      customers={customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))}
      ticketSettings={ticketSettings}
    />
  );
}
