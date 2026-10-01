import { requireSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { AutoservicioToggleClient } from "@/components/settings/autoservicio-toggle-client";

export default async function DesactivarAutoservicioPage() {
  // Sin requirePermission a propósito: cualquier empleado logueado puede entrar y
  // prender/apagar Autoservicio, no hace falta ser administrador.
  await requireSession();

  const setting = await db.setting.findUnique({ where: { key: "autoservicio.enabled" } });
  const enabled = setting?.value !== "false";

  return (
    <div className="flex flex-col items-center gap-6 pb-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold">Autoservicio</h1>
        <p className="text-sm text-muted-foreground">Activar o desactivar los pedidos públicos</p>
      </div>

      <AutoservicioToggleClient initialEnabled={enabled} />
    </div>
  );
}
