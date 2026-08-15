"use client";

import { Badge } from "@/components/ui/badge";
import { ReportTable } from "@/components/reports/report-table";
import { ExportButtons } from "@/components/reports/export-buttons";
import { useReportData } from "@/components/reports/use-report-data";
import { fetchStockReport } from "@/lib/actions/report-actions";
import {
  STOCK_STATUS_LABEL,
  STOCK_STATUS_COLOR,
  INVENTORY_ITEM_TYPE_LABEL,
  MOVEMENT_TYPE_LABEL,
} from "@/lib/constants";
import type { DateRange } from "@/lib/date-range";

export function StockReportTab({ range }: { range: DateRange }) {
  const { data, loading } = useReportData(fetchStockReport, [range]);

  if (loading || !data) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        {Object.entries(data.movementTotals)
          .filter(([, qty]) => qty > 0)
          .map(([type, qty]) => (
            <div key={type} className="rounded-2xl border bg-card px-4 py-2 text-sm">
              <span className="text-muted-foreground">{MOVEMENT_TYPE_LABEL[type] ?? type}: </span>
              <span className="font-semibold tabular-nums">{qty}</span>
            </div>
          ))}
      </div>

      <ExportButtons
        filename="stock"
        columns={[
          { key: "name", label: "Ítem" },
          { key: "type", label: "Tipo" },
          { key: "currentStock", label: "Stock" },
          { key: "minStock", label: "Mínimo" },
          { key: "status", label: "Estado" },
        ]}
        rows={data.rows}
      />

      <ReportTable
        columns={[
          { key: "name", label: "Ítem" },
          { key: "type", label: "Tipo", render: (r) => INVENTORY_ITEM_TYPE_LABEL[r.type] ?? r.type },
          { key: "currentStock", label: "Stock", render: (r) => `${r.currentStock}${r.unit}` },
          { key: "minStock", label: "Mínimo", render: (r) => `${r.minStock}${r.unit}` },
          {
            key: "status",
            label: "Estado",
            render: (r) => (
              <Badge
                variant="outline"
                className="border-none text-[10px]"
                style={{ backgroundColor: `${STOCK_STATUS_COLOR[r.status]}22`, color: STOCK_STATUS_COLOR[r.status] }}
              >
                {STOCK_STATUS_LABEL[r.status] ?? r.status}
              </Badge>
            ),
          },
        ]}
        rows={data.rows}
      />
    </div>
  );
}
