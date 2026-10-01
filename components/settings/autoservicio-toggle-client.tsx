"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Power, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toggleAutoservicioEnabled } from "@/lib/actions/settings-actions";
import { cn } from "@/lib/utils";

export function AutoservicioToggleClient({ initialEnabled }: { initialEnabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

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
      </CardContent>
    </Card>
  );
}
