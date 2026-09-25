import { ShieldAlert } from "lucide-react";
import { requireSession } from "@/lib/auth-helpers";

export default async function SinAccesoPage() {
  // A propósito solo pide sesión, no un permiso puntual: es el destino al que
  // requirePermission() manda a cualquiera sin el permiso que pedía, así que esta pantalla
  // tiene que ser accesible para todo usuario logueado, sea cual sea su rol.
  await requireSession();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="size-6" strokeWidth={1.75} />
      </div>
      <h1 className="text-xl font-semibold">No tenés acceso a esta sección</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Tu usuario no tiene el permiso necesario. Si creés que deberías tenerlo, pedile a un administrador que lo
        habilite en Empleados → Roles.
      </p>
    </div>
  );
}
