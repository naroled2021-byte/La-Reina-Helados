import { logger } from "./logger";
import { printRawBuffer } from "./print-windows";
import { buildTicketBuffer, type Ticket, type TicketSettings } from "./ticket-format";
import { reportJobResult, type PrintJobPayload } from "./api-client";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = [1000, 2000];

export type RecentJob = { label: string; ok: boolean; message: string; at: string };

const recentJobs: RecentJob[] = [];
export function getRecentJobs(): RecentJob[] {
  return recentJobs;
}

function pushRecent(entry: RecentJob) {
  recentJobs.unshift(entry);
  if (recentJobs.length > 20) recentJobs.length = 20;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function printWithRetries(printerName: string, ticket: Ticket, settings: TicketSettings): Promise<void> {
  const buffer = buildTicketBuffer(ticket, settings);
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await printRawBuffer(printerName, buffer);
      return;
    } catch (err) {
      lastError = err;
      logger.warn(`Intento ${attempt}/${MAX_ATTEMPTS} de impresión falló: ${(err as Error).message}`);
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS[attempt - 1] ?? 2000);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function processJob(
  job: PrintJobPayload,
  settings: TicketSettings,
  printerName: string | null
): Promise<void> {
  const label = job.isTest ? "Prueba" : `Pedido #${job.ticket.number}`;

  if (!printerName) {
    const message = "No hay una impresora configurada en el Print Agent";
    logger.error(`${label}: ${message}`);
    pushRecent({ label, ok: false, message, at: new Date().toISOString() });
    await reportJobResult(job.id, "ERROR", message).catch((e) => logger.error(`No se pudo reportar error: ${e}`));
    return;
  }

  try {
    await printWithRetries(printerName, job.ticket, settings);
    logger.info(`${label}: impreso correctamente`);
    pushRecent({ label, ok: true, message: "Impreso", at: new Date().toISOString() });
    await reportJobResult(job.id, "PRINTED");
  } catch (err) {
    const message = (err as Error).message;
    logger.error(`${label}: error de impresión — ${message}`);
    pushRecent({ label, ok: false, message, at: new Date().toISOString() });
    await reportJobResult(job.id, "ERROR", message).catch((e) => logger.error(`No se pudo reportar error: ${e}`));
  }
}
