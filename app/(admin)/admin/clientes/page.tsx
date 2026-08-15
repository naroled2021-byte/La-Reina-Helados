import { requirePermission } from "@/lib/auth-helpers";
import { getCustomersPageData } from "@/lib/queries/customers";
import { CustomersClient } from "@/components/customers/customers-client";

export default async function ClientesPage() {
  await requirePermission("customers.manage");

  const customers = await getCustomersPageData();

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Base de clientes de La Reina Helados — {customers.length} clientes
        </p>
      </div>

      <CustomersClient
        initialCustomers={customers.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          notes: c.notes,
          points: c.points,
          totalSpent: c.totalSpent,
          lastPurchaseAt: c.lastPurchaseAt?.toISOString() ?? null,
          orderCount: c._count.orders,
        }))}
      />
    </div>
  );
}
