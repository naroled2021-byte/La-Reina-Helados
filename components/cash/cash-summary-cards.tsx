import { Banknote, CreditCard, TrendingDown, TrendingUp, Wallet, Landmark } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { formatCompactCurrency } from "@/lib/format";
import { computeExpectedCash, summarizeMovements } from "@/lib/cash-utils";
import type { OpenRegister } from "@/components/cash/types";

export function CashSummaryCards({ register }: { register: OpenRegister }) {
  const totals = summarizeMovements(register.movements);
  const expected = computeExpectedCash(register.openingAmount, register.movements);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <KpiCard label="Efectivo inicial" value={formatCompactCurrency(register.openingAmount)} icon={Wallet} />
      <KpiCard label="Ventas efectivo" value={formatCompactCurrency(totals.salesCash)} icon={Banknote} />
      <KpiCard label="Ventas digitales" value={formatCompactCurrency(totals.salesDigital)} icon={CreditCard} />
      <KpiCard label="Ingresos" value={formatCompactCurrency(totals.income)} icon={TrendingUp} />
      <KpiCard label="Egresos" value={formatCompactCurrency(totals.expense)} icon={TrendingDown} />
      <KpiCard label="Efectivo esperado" value={formatCompactCurrency(expected)} icon={Landmark} />
    </div>
  );
}
