"use client";

import { Badge } from "@/components/ui/badge";
import { ReportTable } from "@/components/reports/report-table";
import { ExportButtons } from "@/components/reports/export-buttons";
import { useReportData } from "@/components/reports/use-report-data";
import { fetchPromotionsReport } from "@/lib/actions/report-actions";
import { PROMOTION_TYPE } from "@/lib/constants";

const PROMOTION_TYPE_LABEL: Record<string, string> = {
  [PROMOTION_TYPE.TWO_FOR_ONE]: "2x1",
  [PROMOTION_TYPE.THREE_FOR_TWO]: "3x2",
  [PROMOTION_TYPE.PERCENTAGE_DISCOUNT]: "Descuento %",
  [PROMOTION_TYPE.QUANTITY_DISCOUNT]: "Descuento por cantidad",
  [PROMOTION_TYPE.COMBO]: "Combo",
  [PROMOTION_TYPE.TIME_OF_DAY]: "Por horario",
  [PROMOTION_TYPE.DAY_OF_WEEK]: "Por día",
  [PROMOTION_TYPE.LOYALTY]: "Fidelización",
};

export function PromotionsReportTab() {
  const { data, loading } = useReportData(fetchPromotionsReport, []);

  if (loading || !data) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-muted-foreground">
        Promociones y cupones configurados. El motor de aplicación automática (2x1, por horario, etc.) todavía no
        está conectado a las ventas — los descuentos se aplican manualmente desde Ventas — así que acá no se
        muestran contadores de uso.
      </p>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Promociones</h3>
          <ExportButtons
            filename="promociones"
            columns={[
              { key: "name", label: "Nombre" },
              { key: "type", label: "Tipo" },
              { key: "active", label: "Activa" },
            ]}
            rows={data.promotions}
          />
        </div>
        <ReportTable
          columns={[
            { key: "name", label: "Nombre" },
            { key: "type", label: "Tipo", render: (r) => PROMOTION_TYPE_LABEL[r.type] ?? r.type },
            {
              key: "active",
              label: "Estado",
              render: (r) => (
                <Badge variant={r.active ? "secondary" : "outline"} className="text-[10px]">
                  {r.active ? "Activa" : "Inactiva"}
                </Badge>
              ),
            },
          ]}
          rows={data.promotions}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Cupones</h3>
        <ReportTable
          emptyMessage="No hay cupones configurados."
          columns={[
            { key: "code", label: "Código" },
            {
              key: "discountValue",
              label: "Descuento",
              render: (r) => (r.discountType === "PERCENTAGE" ? `${r.discountValue}%` : `$${r.discountValue}`),
            },
            { key: "usageLimit", label: "Límite de uso", render: (r) => r.usageLimit ?? "Sin límite" },
            {
              key: "active",
              label: "Estado",
              render: (r) => (
                <Badge variant={r.active ? "secondary" : "outline"} className="text-[10px]">
                  {r.active ? "Activo" : "Inactivo"}
                </Badge>
              ),
            },
          ]}
          rows={data.coupons}
        />
      </div>
    </div>
  );
}
