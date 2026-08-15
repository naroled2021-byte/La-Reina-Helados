"use client";

import { PaymentMethodsChart } from "@/components/dashboard/payment-methods-chart";
import { ReportTable } from "@/components/reports/report-table";
import { ExportButtons } from "@/components/reports/export-buttons";
import { useReportData } from "@/components/reports/use-report-data";
import { fetchPaymentMethodsReport } from "@/lib/actions/report-actions";
import { currency } from "@/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import type { DateRange } from "@/lib/date-range";

export function PaymentMethodsReportTab({ range }: { range: DateRange }) {
  const { data, loading } = useReportData(fetchPaymentMethodsReport, [range]);

  if (loading || !data) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  const rows = data.map((d) => ({ ...d, label: PAYMENT_METHOD_LABEL[d.method] ?? d.method }));

  return (
    <div className="flex flex-col gap-4">
      {rows.length > 0 && (
        <div className="rounded-2xl border bg-card p-4">
          <PaymentMethodsChart data={rows.map((r) => ({ label: r.label, amount: r.amount }))} />
        </div>
      )}

      <ExportButtons
        filename="metodos-de-pago"
        columns={[
          { key: "label", label: "Método" },
          { key: "count", label: "Cantidad" },
          { key: "amount", label: "Monto" },
        ]}
        rows={rows}
      />

      <ReportTable
        columns={[
          { key: "label", label: "Método" },
          { key: "count", label: "Cantidad" },
          { key: "amount", label: "Monto", render: (r) => currency.format(r.amount) },
        ]}
        rows={rows}
      />
    </div>
  );
}
