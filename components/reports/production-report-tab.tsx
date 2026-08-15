"use client";

import { ReportTable } from "@/components/reports/report-table";
import { ExportButtons } from "@/components/reports/export-buttons";
import { useReportData } from "@/components/reports/use-report-data";
import { fetchProductionReport } from "@/lib/actions/report-actions";
import type { DateRange } from "@/lib/date-range";

export function ProductionReportTab({ range }: { range: DateRange }) {
  const { data, loading } = useReportData(fetchProductionReport, [range]);

  if (loading || !data) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  return (
    <div className="flex flex-col gap-4">
      <ExportButtons
        filename="produccion"
        columns={[
          { key: "date", label: "Fecha" },
          { key: "flavor", label: "Sabor" },
          { key: "quantityPlanned", label: "Planificado" },
          { key: "quantityProduced", label: "Producido" },
          { key: "waste", label: "Merma" },
        ]}
        rows={data}
      />
      <ReportTable
        columns={[
          {
            key: "date",
            label: "Fecha",
            render: (r) => new Date(r.date).toLocaleDateString("es-AR", { dateStyle: "short" }),
          },
          { key: "flavor", label: "Sabor" },
          { key: "quantityPlanned", label: "Planificado", render: (r) => `${r.quantityPlanned}kg` },
          { key: "quantityProduced", label: "Producido", render: (r) => `${r.quantityProduced}kg` },
          { key: "waste", label: "Merma", render: (r) => `${r.waste}kg` },
        ]}
        rows={data}
      />
    </div>
  );
}
