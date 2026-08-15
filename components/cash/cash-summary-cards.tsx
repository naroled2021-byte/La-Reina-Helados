import { TrendingDown, TrendingUp, Landmark } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { currency, formatCompactCurrency } from "@/lib/format";
import { computeExpectedByMethod, sumAmounts, summarizeMovements } from "@/lib/cash-utils";
import { CASH_MOVEMENT_TYPE, PAYMENT_METHOD } from "@/lib/constants";
import type { OpenRegister, CashPaymentMethod } from "@/components/cash/types";

export function CashSummaryCards({
  register,
  paymentMethods,
}: {
  register: OpenRegister;
  paymentMethods: CashPaymentMethod[];
}) {
  const totals = summarizeMovements(register.movements);
  const expectedByMethod = computeExpectedByMethod(register.openingAmounts, register.movements);
  const expectedTotal = sumAmounts(expectedByMethod);

  const salesByMethod: Record<string, number> = {};
  for (const m of register.movements) {
    if (m.type === CASH_MOVEMENT_TYPE.SALE_CASH || m.type === CASH_MOVEMENT_TYPE.SALE_DIGITAL) {
      const key = m.paymentMethod ?? PAYMENT_METHOD.CASH;
      salesByMethod[key] = (salesByMethod[key] ?? 0) + m.amount;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard label="Total inicial" value={formatCompactCurrency(sumAmounts(register.openingAmounts))} icon={Landmark} />
        <KpiCard label="Ingresos" value={formatCompactCurrency(totals.income)} icon={TrendingUp} />
        <KpiCard label="Egresos" value={formatCompactCurrency(totals.expense)} icon={TrendingDown} />
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Método</th>
              <th className="px-4 py-2 font-medium">Inicial</th>
              <th className="px-4 py-2 font-medium">Ventas del día</th>
              <th className="px-4 py-2 font-medium">Esperado</th>
            </tr>
          </thead>
          <tbody>
            {paymentMethods.map((m) => (
              <tr key={m.key} className="border-b last:border-0">
                <td className="px-4 py-2 font-medium">{m.label}</td>
                <td className="px-4 py-2 tabular-nums">{currency.format(register.openingAmounts[m.key] ?? 0)}</td>
                <td className="px-4 py-2 tabular-nums">{currency.format(salesByMethod[m.key] ?? 0)}</td>
                <td className="px-4 py-2 font-semibold tabular-nums">{currency.format(expectedByMethod[m.key] ?? 0)}</td>
              </tr>
            ))}
            <tr className="bg-muted/20 font-semibold">
              <td className="px-4 py-2">Total</td>
              <td className="px-4 py-2 tabular-nums">{currency.format(sumAmounts(register.openingAmounts))}</td>
              <td className="px-4 py-2 tabular-nums">
                {currency.format(Object.values(salesByMethod).reduce((s, v) => s + v, 0))}
              </td>
              <td className="px-4 py-2 tabular-nums">{currency.format(expectedTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
