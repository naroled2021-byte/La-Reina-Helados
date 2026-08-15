"use client";

import { DollarSign, TrendingDown, TrendingUp, Percent } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ExportButtons } from "@/components/reports/export-buttons";
import { useReportData } from "@/components/reports/use-report-data";
import { fetchProfitReport } from "@/lib/actions/report-actions";
import { currency } from "@/lib/format";
import type { DateRange } from "@/lib/date-range";

export function ProfitReportTab({ range }: { range: DateRange }) {
  const { data, loading } = useReportData(fetchProfitReport, [range]);

  if (loading || !data) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Ingresos" value={currency.format(data.revenue)} icon={DollarSign} />
        <KpiCard label="Costos" value={currency.format(data.cost)} icon={TrendingDown} />
        <KpiCard label="Ganancia" value={currency.format(data.profit)} icon={TrendingUp} />
        <KpiCard label="Margen" value={`${data.margin.toFixed(1)}%`} icon={Percent} />
      </div>

      <ExportButtons
        filename="ganancias"
        columns={[
          { key: "revenue", label: "Ingresos" },
          { key: "cost", label: "Costos" },
          { key: "profit", label: "Ganancia" },
          { key: "margin", label: "Margen %" },
        ]}
        rows={[data]}
      />
    </div>
  );
}
