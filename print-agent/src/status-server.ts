import { createServer } from "node:http";
import { env, loadLocalConfig, saveLocalConfig } from "./config";
import { logger } from "./logger";
import { listInstalledPrinters, printRawBuffer } from "./print-windows";
import { getRecentJobs } from "./print-queue";
import { state } from "./state";
import { EscPosBuilder } from "./escpos";

function page(body: string): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Print Agent — La Reina Helados</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; color: #222; }
  h1 { font-size: 1.3rem; } h2 { font-size: 1rem; margin-top: 2rem; }
  .ok { color: #16a34a; } .bad { color: #dc2626; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  td, th { text-align: left; padding: 4px 6px; border-bottom: 1px solid #eee; }
  button, select { font-size: 1rem; padding: 6px 10px; }
  form { margin: 0.5rem 0; }
</style></head>
<body>${body}</body></html>`;
}

export function startStatusServer(): void {
  const server = createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/") {
        const config = loadLocalConfig();
        const printers = await listInstalledPrinters().catch(() => []);
        const jobs = getRecentJobs();

        const printerOptions = printers
          .map((p) => `<option value="${p}" ${p === config.printerName ? "selected" : ""}>${p}</option>`)
          .join("");

        const jobsRows = jobs
          .map(
            (j) =>
              `<tr><td>${new Date(j.at).toLocaleString("es-AR")}</td><td>${j.label}</td><td class="${j.ok ? "ok" : "bad"}">${j.ok ? "OK" : "Error"}</td><td>${j.message}</td></tr>`
          )
          .join("");

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          page(`
            <h1>Print Agent — La Reina Helados</h1>
            <p>Servidor: <code>${env.serverUrl}</code></p>
            <p>Última consulta al servidor: ${state.lastPollAt ? new Date(state.lastPollAt).toLocaleString("es-AR") : "todavía ninguna"}
              — <span class="${state.lastPollOk ? "ok" : "bad"}">${state.lastPollOk === null ? "esperando" : state.lastPollOk ? "conectado" : "con error"}</span></p>
            ${state.lastError ? `<p class="bad">${state.lastError}</p>` : ""}

            <h2>Impresora</h2>
            <form method="post" action="/select-printer">
              <select name="printerName">${printerOptions || "<option disabled>No se detectó ninguna impresora</option>"}</select>
              <button type="submit">Guardar</button>
            </form>
            <form method="post" action="/test-print"><button type="submit">Impresión de prueba (directa, sin pasar por el servidor)</button></form>

            <h2>Últimas impresiones</h2>
            <table><tr><th>Hora</th><th>Pedido</th><th>Resultado</th><th>Detalle</th></tr>${jobsRows || "<tr><td colspan=4>Sin actividad todavía</td></tr>"}</table>
          `)
        );
        return;
      }

      if (req.method === "POST" && req.url === "/select-printer") {
        const body = await readBody(req);
        const params = new URLSearchParams(body);
        const printerName = params.get("printerName");
        if (printerName) {
          saveLocalConfig({ printerName });
          logger.info(`Impresora seleccionada: ${printerName}`);
        }
        res.writeHead(302, { Location: "/" });
        res.end();
        return;
      }

      if (req.method === "POST" && req.url === "/test-print") {
        const config = loadLocalConfig();
        if (config.printerName) {
          const b = new EscPosBuilder();
          b.align("center").bold(true).line("La Reina Helados").bold(false);
          b.line("Prueba de impresión del Print Agent").line(new Date().toLocaleString("es-AR")).feed(3).cut();
          await printRawBuffer(config.printerName, b.build()).catch((e) => logger.error(`Prueba fallida: ${e.message}`));
        }
        res.writeHead(302, { Location: "/" });
        res.end();
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    } catch (err) {
      logger.error(`Error en la página de estado: ${(err as Error).message}`);
      res.writeHead(500);
      res.end("Error interno");
    }
  });

  server.listen(env.statusPort, () => {
    logger.info(`Página de estado en http://localhost:${env.statusPort}`);
  });
}

function readBody(req: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
