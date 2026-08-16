import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT_DIR } from "./config";

const LOCK_PATH = path.join(ROOT_DIR, "agent.lock");

function isRunning(pid: number): boolean {
  try {
    // No mata nada — la señal 0 solo pregunta si el proceso existe.
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Evita que queden dos Print Agent corriendo al mismo tiempo en esta PC (por ejemplo si
 *  alguien lo abrió a mano mientras la tarea programada ya lo tenía corriendo) — ya pasó
 *  de verdad y causó que la misma comanda se imprimiera repetida. Si detecta que ya hay
 *  uno vivo, corta acá en vez de arrancar un segundo. */
export function ensureSingleInstance(): void {
  if (existsSync(LOCK_PATH)) {
    const existingPid = Number(readFileSync(LOCK_PATH, "utf-8").trim());
    if (existingPid && isRunning(existingPid)) {
      console.error(
        `Ya hay un Print Agent corriendo en esta PC (PID ${existingPid}). No arranco una segunda copia.`
      );
      process.exit(1);
    }
  }
  writeFileSync(LOCK_PATH, String(process.pid), "utf-8");
}
