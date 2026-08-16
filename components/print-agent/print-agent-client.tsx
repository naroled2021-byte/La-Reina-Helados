"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Printer, RotateCw, TestTube2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { retryPrintJob } from "@/lib/actions/order-actions";
import { createTestPrintJob } from "@/lib/actions/print-agent-actions";
import { formatDateTime } from "@/lib/format";

type PrintJobRow = {
  id: string;
  orderId: string | null;
  orderNumber: number | null;
  isTest: boolean;
  status: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  printedAt: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  SENDING: "Enviando",
  PRINTED: "Impreso",
  ERROR: "Error",
};

const STATUS_VARIANT: Record<string, "outline" | "secondary" | "destructive"> = {
  PENDING: "outline",
  SENDING: "outline",
  PRINTED: "secondary",
  ERROR: "destructive",
};

export function PrintAgentClient({
  online,
  lastHeartbeat,
  printedCount,
  jobs,
}: {
  online: boolean;
  lastHeartbeat: string | null;
  printedCount: number;
  jobs: PrintJobRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const pendingCount = jobs.filter((j) => j.status === "PENDING" || j.status === "SENDING").length;
  const errorCount = jobs.filter((j) => j.status === "ERROR").length;

  function handleReprint(orderId: string) {
    startTransition(async () => {
      const res = await retryPrintJob(orderId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Reimpresión encolada");
      router.refresh();
    });
  }

  function handleTestPrint() {
    startTransition(async () => {
      const res = await createTestPrintJob();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Impresión de prueba encolada");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-none shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                online ? "bg-primary/12 text-primary" : "bg-destructive/10 text-destructive"
              }`}
            >
              <Printer className="size-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-medium">
                <span className={`size-2 rounded-full ${online ? "bg-primary" : "bg-destructive"}`} />
                {online ? "Print Agent conectado" : "Print Agent desconectado"}
              </p>
              <p className="text-xs text-muted-foreground">
                {lastHeartbeat
                  ? `Última señal: ${formatDateTime(lastHeartbeat)}`
                  : "Todavía no se conectó ningún Print Agent"}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={isPending} onClick={handleTestPrint}>
            <TestTube2 className="size-4" />
            Impresión de prueba
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard label="Comandas impresas" value={String(printedCount)} icon={Printer} />
        <KpiCard label="Pendientes" value={String(pendingCount)} icon={RotateCw} />
        <KpiCard label="Con error" value={String(errorCount)} icon={TestTube2} tone={errorCount > 0 ? "critical" : "default"} />
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Pedido</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Intentos</th>
              <th className="px-4 py-2 font-medium">Creado</th>
              <th className="px-4 py-2 font-medium">Error</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Todavía no hay comandas en la cola de impresión.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">
                    {job.isTest ? "Prueba" : job.orderNumber ? `#${job.orderNumber}` : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={STATUS_VARIANT[job.status] ?? "outline"}>{STATUS_LABEL[job.status] ?? job.status}</Badge>
                  </td>
                  <td className="px-4 py-2 tabular-nums">{job.attempts}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{formatDateTime(job.createdAt)}</td>
                  <td className="max-w-48 truncate px-4 py-2 text-xs text-destructive">{job.lastError ?? ""}</td>
                  <td className="px-4 py-2 text-right">
                    {job.orderId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        disabled={isPending}
                        onClick={() => handleReprint(job.orderId!)}
                      >
                        <RotateCw className="size-3.5" />
                        Reimprimir
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
