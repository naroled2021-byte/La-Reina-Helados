import { execFile } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT_DIR } from "./config";

const TASK_NAME = "PrintAgent La Reina Helados";
const VBS_PATH = path.join(ROOT_DIR, "start-hidden.vbs");

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, (error, _stdout, stderr) => {
      if (error) reject(new Error(stderr?.trim() || error.message));
      else resolve();
    });
  });
}

async function main(): Promise<void> {
  const distIndex = path.join(ROOT_DIR, "dist", "index.js");
  const nodeExe = process.execPath;

  // Lanzador que corre el Agent sin ventana visible (WScript.Shell con estilo 0 = oculto).
  const vbs = `Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "${ROOT_DIR.replace(/\\/g, "\\\\")}"
WshShell.Run """${nodeExe.replace(/\\/g, "\\\\")}"" ""${distIndex.replace(/\\/g, "\\\\")}""", 0, False
`;
  writeFileSync(VBS_PATH, vbs, "utf-8");

  // Sin /rl highest a propósito: imprimir no necesita permisos de administrador, y una
  // tarea elevada solo se puede cerrar/depurar desde otra ventana también elevada — más
  // difícil de gestionar el día de mañana sin ganar nada a cambio.
  await run("schtasks", ["/create", "/tn", TASK_NAME, "/tr", `wscript.exe "${VBS_PATH}"`, "/sc", "onlogon", "/f"]);

  console.log(`Tarea programada "${TASK_NAME}" creada — el Print Agent va a arrancar solo al iniciar sesión en Windows.`);
  console.log(`Para probarlo ahora mismo sin reiniciar: doble click en start-hidden.vbs`);
}

main().catch((err) => {
  console.error("No se pudo instalar el arranque automático:", err.message);
  process.exit(1);
});
