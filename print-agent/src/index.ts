import { assertEnvConfigured, env, loadLocalConfig } from "./config";
import { logger } from "./logger";
import { fetchPendingJobs, sendHeartbeat } from "./api-client";
import { processJob } from "./print-queue";
import { startStatusServer } from "./status-server";
import { state } from "./state";

async function tick(): Promise<void> {
  try {
    await sendHeartbeat();
  } catch (err) {
    logger.warn(`No se pudo enviar el heartbeat: ${(err as Error).message}`);
  }

  try {
    const { settings, jobs } = await fetchPendingJobs();
    state.lastPollOk = true;
    state.lastPollAt = new Date().toISOString();
    state.lastError = null;

    if (jobs.length > 0) {
      logger.info(`${jobs.length} comanda(s) para imprimir`);
      const { printerName } = loadLocalConfig();
      for (const job of jobs) {
        await processJob(job, settings, printerName);
      }
    }
  } catch (err) {
    state.lastPollOk = false;
    state.lastPollAt = new Date().toISOString();
    state.lastError = (err as Error).message;
    logger.warn(`No se pudo consultar al servidor: ${(err as Error).message}`);
  }
}

async function main(): Promise<void> {
  assertEnvConfigured();
  logger.info(`Print Agent iniciado — servidor: ${env.serverUrl}`);

  const { printerName } = loadLocalConfig();
  if (!printerName) {
    logger.warn(
      `Todavía no hay impresora configurada. Abrí http://localhost:${env.statusPort} para elegirla.`
    );
  } else {
    logger.info(`Impresora configurada: ${printerName}`);
  }

  startStatusServer();

  // Loop con setTimeout recursivo (no setInterval) para nunca solapar dos consultas
  // si el servidor tarda en responder.
  const loop = async () => {
    await tick();
    setTimeout(loop, env.pollIntervalMs);
  };
  void loop();
}

main().catch((err) => {
  logger.error(`Error fatal: ${(err as Error).message}`);
  process.exit(1);
});
