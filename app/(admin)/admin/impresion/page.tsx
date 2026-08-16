import { requirePermission } from "@/lib/auth-helpers";
import { getPrintAgentPageData } from "@/lib/queries/print-agent";
import { PrintAgentClient } from "@/components/print-agent/print-agent-client";

export default async function ImpresionPage() {
  await requirePermission("settings.manage");

  const { online, lastHeartbeat, jobs, printedCount } = await getPrintAgentPageData();

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold">Impresión</h1>
        <p className="text-sm text-muted-foreground">Estado del Print Agent y cola de comandas</p>
      </div>

      <PrintAgentClient
        online={online}
        lastHeartbeat={lastHeartbeat?.toISOString() ?? null}
        printedCount={printedCount}
        jobs={jobs.map((j) => ({
          id: j.id,
          orderId: j.orderId,
          orderNumber: j.order?.number ?? null,
          isTest: j.isTest,
          status: j.status,
          attempts: j.attempts,
          lastError: j.lastError,
          createdAt: j.createdAt.toISOString(),
          printedAt: j.printedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
