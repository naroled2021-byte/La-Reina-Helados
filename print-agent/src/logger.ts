import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { LOGS_DIR } from "./config";

mkdirSync(LOGS_DIR, { recursive: true });

function logFilePath(): string {
  const today = new Date().toISOString().slice(0, 10);
  return path.join(LOGS_DIR, `${today}.log`);
}

function write(level: string, message: string): void {
  const line = `[${new Date().toISOString()}] [${level}] ${message}`;
  console.log(line);
  try {
    appendFileSync(logFilePath(), line + "\n", "utf-8");
  } catch {
    // si falla escribir el log a disco, seguimos igual — no es motivo para frenar el agente
  }
}

export const logger = {
  info: (message: string) => write("INFO", message),
  warn: (message: string) => write("WARN", message),
  error: (message: string) => write("ERROR", message),
};
