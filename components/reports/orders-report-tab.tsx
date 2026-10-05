"use client";

import { DollarSign, ClipboardList, Receipt } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesByDayChart } from "@/components/dashboard/sales-by-day-chart";
import { ReportTable } from "@/components/reports/report-table";
import { ExportButtons } from "@/components/reports/export-buttons";
import { useReportData } from "@/components/reports/use-report-data";
import { fetchSalesReport, fetchCancelledOrdersReport } from "@/lib/actions/report-actions";
import { currency } from "@/lib/format";
import { ORDER_TYPE_LABEL, ORDER_STATUS_LABEL } from "@/lib/constants";
import type { DateRange } from "@/lib/date-range";

/** Reportes de Ventas y de Pedidos cancelados, separados por canal (Mostrador/Ventas vs
 *  Autoservicio) — mismo detalle en los dos, solo cambia de qué pedidos se trata. */
export function OrdersReportTab({
  range,
  channel,
  cancelled,
}: {
  range: DateRange;
  channel: string;
  cancelled: boolean;
}) {
  const fetcher = cancelled ? fetchCancelledOrdersReport : fetchSalesReport;
  const { data, loading } = useReportData(fetcher, [range, channel]);

  if (loading || !data) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  const totalLabel = cancelled ? "Total cancelado" : "Ventas totales";
  const countLabel = cancelled ? "Pedidos cancelados" : "Pedidos";
  const avgLabel = cancelled ? "Promedio cancelado" : "Ticket promedio";
  const filenamePrefix = cancelled ? "pedidos-cancelados" : "ventas";
  const channelSlug = channel === "SELF_SERVICE" ? "autoservicio" : "mostrador";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard label={totalLabel} value={currency.format(data.total)} icon={DollarSign} />
        <KpiCard label={countLabel} value={String(data.count)} icon={ClipboardList} />
        <KpiCard label={avgLabel} value={currency.format(data.avgTicket)} icon={Receipt} />
      </div>

      {data.daily.length > 1 && (
        <div className="rounded-2xl border bg-card p-4">
          <SalesByDayChart
            data={data.daily.map((d) => ({
              label: new Date(d.date + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
              total: d.total,
            }))}
          />
        </div>
      )}

      <ExportButtons
        filename={`${filenamePrefix}-${channelSlug}`}
        columns={[
          { key: "number", label: "Pedido" },
          { key: "date", label: "Fecha" },
          { key: "type", label: "Tipo" },
          { key: "status", label: "Estado" },
          { key: "customer", label: "Cliente" },
          { key: "total", label: "Total" },
        ]}
        rows={data.rows}
      />

      <ReportTable
        columns={[
          { key: "number", label: "Pedido", render: (r) => `#${r.number}` /* r.number ya viene formateado (0001 / 001) */ },
          {
            key: "date",
            label: "Fecha",
            render: (r) => new Date(r.date).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }),
          },
          { key: "type", label: "Tipo", render: (r) => ORDER_TYPE_LABEL[r.type] ?? r.type },
          { key: "status", label: "Estado", render: (r) => ORDER_STATUS_LABEL[r.status] ?? r.status },
          { key: "customer", label: "Cliente" },
          { key: "total", label: "Total", render: (r) => currency.format(r.total) },
        ]}
        rows={data.rows}
      />
    </div>
  );
}
