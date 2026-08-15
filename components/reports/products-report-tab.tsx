"use client";

import { RankingBarChart } from "@/components/dashboard/ranking-bar-chart";
import { ReportTable } from "@/components/reports/report-table";
import { ExportButtons } from "@/components/reports/export-buttons";
import { useReportData } from "@/components/reports/use-report-data";
import { fetchProductsReport } from "@/lib/actions/report-actions";
import { currency } from "@/lib/format";
import type { DateRange } from "@/lib/date-range";

export function ProductsReportTab({ range }: { range: DateRange }) {
  const { data, loading } = useReportData(fetchProductsReport, [range]);

  if (loading || !data) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  return (
    <div className="flex flex-col gap-4">
      {data.length > 0 && (
        <div className="rounded-2xl border bg-card p-4">
          <RankingBarChart data={data.slice(0, 8).map((p) => ({ name: p.name, quantity: p.quantity }))} />
        </div>
      )}

      <ExportButtons
        filename="productos"
        columns={[
          { key: "name", label: "Producto" },
          { key: "quantity", label: "Cantidad" },
          { key: "revenue", label: "Ingresos" },
        ]}
        rows={data}
      />

      <ReportTable
        columns={[
          { key: "name", label: "Producto" },
          { key: "quantity", label: "Cantidad" },
          { key: "revenue", label: "Ingresos", render: (r) => currency.format(r.revenue) },
        ]}
        rows={data}
      />
    </div>
  );
}
