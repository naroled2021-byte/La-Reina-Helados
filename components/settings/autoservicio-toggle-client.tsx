"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Power, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toggleAutoservicioEnabled, updateAutoservicioWaitMinutes } from "@/lib/actions/settings-actions";
import { cn } from "@/lib/utils";

export function AutoservicioToggleClient({
  initialEnabled,
  initialWaitMinutes,
}: {
  initialEnabled: boolean;
  initialWaitMinutes: number;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  const [waitMinutes, setWaitMinutes] = useState(String(initialWaitMinutes));
  const [isSavingWait, startSavingWait] = useTransition();

  function handleToggle() {
    const next = !enabled;
    startTransition(async () => {
      const res = await toggleAutoservicioEnabled(next);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setEnabled(next);
      toast.success(next ? "Autoservicio activado" : "Autoservicio desactivado");
      router.refresh();
    });
  }

  function handleSaveWaitMinutes() {
    startSavingWait(async () => {
      const res = await updateAutoservicioWaitMinutes({ waitMinutes: waitMinutes as never });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Demora estimada actualizada");
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-md border-none shadow-sm">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div
          className={cn(
            "flex size-16 items-center justify-center rounded-full",
            enabled ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
          )}
        >
          <ShoppingBag className="size-8" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-lg font-semibold">{enabled ? "Autoservicio activo" : "Autoservicio cerrado"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {enabled
              ? "Los clientes pueden hacer pedidos desde la página pública de Autoservicio."
              : "La página pública muestra un aviso de cerrado y no deja hacer pedidos nuevos."}
          </p>
        </div>
        <Button
          size="lg"
          variant={enabled ? "destructive" : "default"}
          disabled={isPending}
          onClick={handleToggle}
          className="w-full gap-2"
        >
          <Power className="size-4" />
          {enabled ? "Desactivar Autoservicio" : "Activar Autoservicio"}
        </Button>

        <div className="mt-2 flex w-full flex-col gap-1.5 border-t pt-4 text-left">
          <Label htmlFor="waitMinutes">Demora estimada (minutos)</Label>
          <p className="text-xs text-muted-foreground">
            Se muestra a los clientes cuando hacen un pedido. Dejalo en 0 para no mostrar ningún tiempo.
          </p>
          <div className="flex gap-2">
            <Input
              id="waitMinutes"
              type="number"
              min={0}
              max={180}
              value={waitMinutes}
              onChange={(e) => setWaitMinutes(e.target.value)}
              placeholder="Ej: 15"
            />
            <Button variant="outline" disabled={isSavingWait} onClick={handleSaveWaitMinutes}>
              {isSavingWait && <Loader2 className="size-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
