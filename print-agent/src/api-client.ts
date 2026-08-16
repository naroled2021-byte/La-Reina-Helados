import { env } from "./config";
import type { Ticket, TicketSettings } from "./ticket-format";

export type PrintJobPayload = { id: string; isTest: boolean; ticket: Ticket };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(env.serverUrl + path, {
    ...init,
    headers: { Authorization: `Bearer ${env.token}`, "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${path} → HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export function fetchPendingJobs(): Promise<{ settings: TicketSettings; jobs: PrintJobPayload[] }> {
  return call("/api/print-agent/jobs");
}

export function reportJobResult(jobId: string, status: "PRINTED" | "ERROR", error?: string): Promise<void> {
  return call(`/api/print-agent/jobs/${jobId}/result`, {
    method: "POST",
    body: JSON.stringify({ status, error }),
  }).then(() => undefined);
}

export function sendHeartbeat(): Promise<void> {
  return call("/api/print-agent/heartbeat", { method: "POST" }).then(() => undefined);
}
