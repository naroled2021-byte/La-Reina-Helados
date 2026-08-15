"use client";

import { ReportTable } from "@/components/reports/report-table";
import { ExportButtons } from "@/components/reports/export-buttons";
import { useReportData } from "@/components/reports/use-report-data";
import { fetchCashReport } from "@/lib/actions/report-actions";
import { currency } from "@/lib/format";
import type { DateRange } from "@/lib/date-range";

export function CashReportTab({ range }: { range: DateRange }) {
  const { data, loading } = useReportData(fetchCashReport, [range]);

  if (loading || !data) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  return (
    <div className="flex flex-col gap-4">
      <ExportButtons
        filename="caja"
        columns={[
          { key: "closedAt", label: "Cierre" },
          { key: "openingAmount", label: "Apertura" },
          { key: "closingAmountExpected", label: "Esperado" },
          { key: "closingAmountDeclared", label: "Declarado" },
          { key: "difference", label: "Diferencia" },
          { key: "closedBy", label: "Responsable" },
        ]}
        rows={data}
      />
      <ReportTable
        emptyMessage="No hay cierres de caja en este rango."
        columns={[
          {
            key: "closedAt",
            label: "Cierre",
            render: (r) =>
              r.closedAt ? new Date(r.closedAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "—",
          },
          { key: "openingAmount", label: "Apertura", render: (r) => currency.format(r.openingAmount) },
          { key: "closingAmountExpected", label: "Esperado", render: (r) => currency.format(r.closingAmountExpected) },
          { key: "closingAmountDeclared", label: "Declarado", render: (r) => currency.format(r.closingAmountDeclared) },
          {
            key: "difference",
            label: "Diferencia",
            render: (r) => (
              <span className={r.difference < 0 ? "text-destructive" : r.difference > 0 ? "text-primary" : ""}>
                {r.difference >= 0 ? "+" : ""}
                {currency.format(r.difference)}
              </span>
            ),
          },
          { key: "closedBy", label: "Responsable" },
        ]}
        rows={data}
      />
    </div>
  );
}
