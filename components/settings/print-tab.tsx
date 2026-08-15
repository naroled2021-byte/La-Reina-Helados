"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePrintSettings } from "@/lib/actions/settings-actions";

export function PrintTab({ settingsMap }: { settingsMap: Record<string, string> }) {
  const [form, setForm] = useState({
    ticketHeader: settingsMap["print.ticketHeader"] ?? "",
    ticketFooter: settingsMap["print.ticketFooter"] ?? "¡Gracias por tu compra!",
    paperWidth: settingsMap["print.paperWidth"] || "80mm",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updatePrintSettings(form as never);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Preferencias de ticket actualizadas");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        La impresión en impresora térmica queda preparada para una futura versión — por ahora estas preferencias solo
        se guardan.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ticketHeader">Encabezado del ticket</Label>
        <Textarea
          id="ticketHeader"
          rows={2}
          value={form.ticketHeader}
          onChange={(e) => setForm((f) => ({ ...f, ticketHeader: e.target.value }))}
          placeholder="Ej: La Reina Helados - CUIT 30-12345678-9"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ticketFooter">Pie del ticket</Label>
        <Textarea
          id="ticketFooter"
          rows={2}
          value={form.ticketFooter}
          onChange={(e) => setForm((f) => ({ ...f, ticketFooter: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Ancho de papel</Label>
        <Select value={form.paperWidth} onValueChange={(v) => setForm((f) => ({ ...f, paperWidth: v ?? f.paperWidth }))}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Ancho">{(value: string) => value}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="58mm">58mm</SelectItem>
            <SelectItem value="80mm">80mm</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Guardar
      </Button>
    </form>
  );
}
