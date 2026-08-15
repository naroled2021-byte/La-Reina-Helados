import { db } from "@/lib/db";

export async function getCustomersPageData() {
  const customers = await db.customer.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: [{ lastPurchaseAt: { sort: "desc", nulls: "last" } }, { name: "asc" }],
  });
  return customers;
}

