import { requirePermission } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getCashPageData } from "@/lib/queries/cash";
import { CashClient } from "@/components/cash/cash-client";

export default async function CajaPage() {
  await requirePermission("cash.manage");

  const [{ openRegister, closedRegisters }, paymentMethodConfigs] = await Promise.all([
    getCashPageData(),
    db.paymentMethodConfig.findMany({ where: { enabled: true }, orderBy: { order: "asc" } }),
  ]);
  const paymentMethods = paymentMethodConfigs.map((m) => ({ key: m.key, label: m.label }));

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold">Caja</h1>
        <p className="text-sm text-muted-foreground">Apertura, movimientos y cierre de caja</p>
      </div>

      <CashClient
        paymentMethods={paymentMethods}
        openRegister={
          openRegister
            ? {
                id: openRegister.id,
                openingAmount: openRegister.openingAmount,
                openingAmounts: (openRegister.openingAmounts as Record<string, number>) ?? {},
                openedAt: openRegister.openedAt.toISOString(),
                openedByName: openRegister.openedBy.name,
                movements: openRegister.movements.map((m) => ({
                  id: m.id,
                  type: m.type,
                  amount: m.amount,
                  paymentMethod: m.paymentMethod,
                  description: m.description,
                  userName: m.user?.name ?? null,
                  createdAt: m.createdAt.toISOString(),
                })),
              }
            : null
        }
        closedRegisters={closedRegisters.map((r) => ({
          id: r.id,
          openedAt: r.openedAt.toISOString(),
          closedAt: r.closedAt?.toISOString() ?? null,
          openingAmount: r.openingAmount,
          closingAmountExpected: r.closingAmountExpected,
          closingAmountDeclared: r.closingAmountDeclared,
          difference: r.difference,
          openedByName: r.openedBy.name,
          closedByName: r.closedBy?.name ?? null,
        }))}
      />
    </div>
  );
}
