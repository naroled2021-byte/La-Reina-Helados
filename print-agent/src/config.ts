import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

export const ROOT_DIR = path.join(__dirname, "..");
export const LOGS_DIR = path.join(ROOT_DIR, "logs");
const LOCAL_CONFIG_PATH = path.join(ROOT_DIR, "config.json");

export const env = {
  serverUrl: (process.env.SERVER_URL ?? "").replace(/\/$/, ""),
  token: process.env.PRINT_AGENT_TOKEN ?? "",
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 5000),
  statusPort: Number(process.env.STATUS_PORT ?? 9200),
};

export type LocalConfig = {
  printerName: string | null;
};

export function loadLocalConfig(): LocalConfig {
  if (!existsSync(LOCAL_CONFIG_PATH)) return { printerName: null };
  try {
    return { printerName: null, ...JSON.parse(readFileSync(LOCAL_CONFIG_PATH, "utf-8")) };
  } catch {
    return { printerName: null };
  }
}

export function saveLocalConfig(config: LocalConfig): void {
  writeFileSync(LOCAL_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export function assertEnvConfigured(): void {
  const missing: string[] = [];
  if (!env.serverUrl) missing.push("SERVER_URL");
  if (!env.token) missing.push("PRINT_AGENT_TOKEN");
  if (missing.length > 0) {
    throw new Error(
      `Falta configurar ${missing.join(", ")} en el archivo .env (copiá .env.example a .env y completalo).`
    );
  }
}
