import { requirePermission } from "@/lib/auth-helpers";
import { ReportsClient } from "@/components/reports/reports-client";

export default async function ReportesPage() {
  await requirePermission("reports.view");

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">Ventas, productos, stock, caja y más — filtrable y exportable</p>
      </div>

      <ReportsClient />
    </div>
  );
}
