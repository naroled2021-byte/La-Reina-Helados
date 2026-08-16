import { execFile } from "node:child_process";

const TASK_NAME = "PrintAgent La Reina Helados";

execFile("schtasks", ["/delete", "/tn", TASK_NAME, "/f"], (error, _stdout, stderr) => {
  if (error) {
    console.error("No se pudo quitar el arranque automático:", stderr?.trim() || error.message);
    process.exit(1);
  }
  console.log(`Tarea programada "${TASK_NAME}" eliminada.`);
});
