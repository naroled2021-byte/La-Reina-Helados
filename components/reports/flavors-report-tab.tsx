"use client";

import { RankingBarChart } from "@/components/dashboard/ranking-bar-chart";
import { ReportTable } from "@/components/reports/report-table";
import { ExportButtons } from "@/components/reports/export-buttons";
import { useReportData } from "@/components/reports/use-report-data";
import { fetchFlavorsReport } from "@/lib/actions/report-actions";
import type { DateRange } from "@/lib/date-range";

export function FlavorsReportTab({ range }: { range: DateRange }) {
  const { data, loading } = useReportData(fetchFlavorsReport, [range]);

  if (loading || !data) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  return (
    <div className="flex flex-col gap-4">
      {data.length > 0 && (
        <div className="rounded-2xl border bg-card p-4">
          <RankingBarChart data={data.slice(0, 8).map((f) => ({ name: f.name, quantity: f.count }))} />
        </div>
      )}

      <ExportButtons
        filename="sabores"
        columns={[
          { key: "name", label: "Sabor" },
          { key: "count", label: "Veces usado" },
        ]}
        rows={data}
      />

      <ReportTable
        columns={[
          { key: "name", label: "Sabor" },
          { key: "count", label: "Veces usado" },
        ]}
        rows={data}
      />
    </div>
  );
}
