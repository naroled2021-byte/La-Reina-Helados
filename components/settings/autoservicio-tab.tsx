"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateAutoservicioSettings } from "@/lib/actions/settings-actions";

export function AutoservicioTab({ settingsMap }: { settingsMap: Record<string, string> }) {
  const [waitMinutes, setWaitMinutes] = useState(settingsMap["autoservicio.waitMinutes"] ?? "");
  const [enabled, setEnabled] = useState(settingsMap["autoservicio.enabled"] !== "false");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateAutoservicioSettings({ waitMinutes: waitMinutes as never, enabled });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Configuración de Autoservicio actualizada");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
        <div>
          <p className="text-sm font-medium">Autoservicio activo</p>
          <p className="text-xs text-muted-foreground">
            Si lo apagás, la página pública de Autoservicio muestra un aviso de que está cerrado y no deja
            hacer pedidos. Mostrador y Ventas siguen funcionando igual.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        Se muestra en la pantalla de confirmación de Autoservicio: &quot;Tu pedido va a estar listo en
        aproximadamente X minutos&quot;. Dejalo en 0 para no mostrar ningún tiempo estimado.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="waitMinutes">Demora estimada (minutos)</Label>
        <Input
          id="waitMinutes"
          type="number"
          min={0}
          max={180}
          value={waitMinutes}
          onChange={(e) => setWaitMinutes(e.target.value)}
          placeholder="Ej: 15"
        />
      </div>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Guardar
      </Button>
    </form>
  );
}
