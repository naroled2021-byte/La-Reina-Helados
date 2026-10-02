import { requireSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { AutoservicioToggleClient } from "@/components/settings/autoservicio-toggle-client";

export default async function DesactivarAutoservicioPage() {
  // Sin requirePermission a propósito: cualquier empleado logueado puede entrar y
  // prender/apagar Autoservicio, no hace falta ser administrador.
  await requireSession();

  const settings = await db.setting.findMany({
    where: { key: { in: ["autoservicio.enabled", "autoservicio.waitMinutes"] } },
  });
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const enabled = settingsMap["autoservicio.enabled"] !== "false";
  const waitMinutes = Number(settingsMap["autoservicio.waitMinutes"]) || 0;

  return (
    <div className="flex flex-col items-center gap-6 pb-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold">Autoservicio</h1>
        <p className="text-sm text-muted-foreground">Activar/desactivar y ajustar la demora estimada</p>
      </div>

      <AutoservicioToggleClient initialEnabled={enabled} initialWaitMinutes={waitMinutes} />
    </div>
  );
}
