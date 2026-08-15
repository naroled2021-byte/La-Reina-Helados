"use client";

import { ReportTable } from "@/components/reports/report-table";
import { ExportButtons } from "@/components/reports/export-buttons";
import { useReportData } from "@/components/reports/use-report-data";
import { fetchCustomersReport } from "@/lib/actions/report-actions";
import { currency } from "@/lib/format";
import type { DateRange } from "@/lib/date-range";

export function CustomersReportTab({ range }: { range: DateRange }) {
  const { data, loading } = useReportData(fetchCustomersReport, [range]);

  if (loading || !data) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  return (
    <div className="flex flex-col gap-4">
      <ExportButtons
        filename="clientes"
        columns={[
          { key: "name", label: "Cliente" },
          { key: "orders", label: "Pedidos" },
          { key: "total", label: "Total gastado" },
        ]}
        rows={data}
      />
      <ReportTable
        emptyMessage="Ningún cliente compró en este rango."
        columns={[
          { key: "name", label: "Cliente" },
          { key: "orders", label: "Pedidos" },
          { key: "total", label: "Total gastado", render: (r) => currency.format(r.total) },
        ]}
        rows={data}
      />
    </div>
  );
}
