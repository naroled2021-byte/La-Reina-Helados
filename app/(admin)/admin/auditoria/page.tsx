import { requirePermission } from "@/lib/auth-helpers";
import { AuditClient } from "@/components/audit/audit-client";

export default async function AuditoriaPage() {
  await requirePermission("audit.view");

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold">Auditoría</h1>
        <p className="text-sm text-muted-foreground">Historial de eventos importantes del sistema</p>
      </div>

      <AuditClient />
    </div>
  );
}
