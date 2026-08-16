import { execFile } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SCRIPTS_DIR = path.join(__dirname, "..", "scripts");

function runPowerShell(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", ...args],
      { timeout: 20_000 },
      (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(stderr?.trim() || error.message));
          return;
        }
        resolve();
      }
    );
  });
}

/** Manda un buffer de bytes crudos (ESC/POS) a una impresora ya instalada en Windows,
 *  usando el mismo driver/cola que ya usa el sistema — sin libusb, sin reemplazar drivers. */
export async function printRawBuffer(printerName: string, buffer: Buffer): Promise<void> {
  const dir = mkdtempSync(path.join(tmpdir(), "print-agent-"));
  const filePath = path.join(dir, "ticket.bin");
  writeFileSync(filePath, buffer);
  try {
    await runPowerShell([
      "-File",
      path.join(SCRIPTS_DIR, "send-raw-print.ps1"),
      "-PrinterName",
      printerName,
      "-FilePath",
      filePath,
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Lista las impresoras instaladas en Windows (mismo listado que Configuración → Impresoras). */
export async function listInstalledPrinters(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", "Get-Printer | Select-Object -ExpandProperty Name"],
      { timeout: 10_000 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr?.trim() || error.message));
          return;
        }
        const names = stdout
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        resolve(names);
      }
    );
  });
}
