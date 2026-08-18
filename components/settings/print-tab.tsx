"use client";

import { useState, useTransition } from "react";
import { Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketView, type TicketData, type TicketSettings } from "@/components/mostrador/ticket-view";
import { updatePrintSettings } from "@/lib/actions/settings-actions";

const TEST_TICKET: TicketData = {
  number: 0,
  createdAt: new Date().toISOString(),
  items: [
    { key: "1", productId: "", productName: "1/4 Kilo", unitPrice: 5500, quantity: 1, flavorIds: [], flavorNames: ["Chocolate", "Dulce de leche"] },
    { key: "2", productId: "", productName: "Cucurucho", unitPrice: 800, quantity: 2, flavorIds: [], flavorNames: [] },
  ],
  subtotal: 7100,
  discount: 0,
  total: 7100,
  paymentMethodLabel: "Efectivo",
  orderType: "TAKEAWAY",
  customerName: null,
};

export function PrintTab({ settingsMap }: { settingsMap: Record<string, string> }) {
  const [form, setForm] = useState({
    ticketHeader: settingsMap["print.ticketHeader"] ?? "",
    ticketFooter: settingsMap["print.ticketFooter"] ?? "¡Gracias por tu compra!",
    paperWidth: settingsMap["print.paperWidth"] || "80mm",
    copies: settingsMap["print.copies"] || "2",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [test, setTest] = useState<{ copies: number; nonce: number } | null>(null);

  const testSettings: TicketSettings = {
    businessName: settingsMap["business.name"] || "La Reina Helados",
    address: settingsMap["business.address"] || "",
    phone: settingsMap["business.phone"] || "",
    ticketHeader: form.ticketHeader,
    ticketFooter: form.ticketFooter,
    paperWidth: form.paperWidth,
    copies: test?.copies ?? 1,
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updatePrintSettings({ ...form, copies: Number(form.copies) } as never);
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
        Mostrador, Ventas y Pedidos imprimen con estas preferencias apenas se guardan — no hace falta reiniciar nada.
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="copies">Copias automáticas por pedido</Label>
        <Input
          id="copies"
          type="number"
          min={1}
          max={4}
          className="w-24"
          value={form.copies}
          onChange={(e) => setForm((f) => ({ ...f, copies: e.target.value }))}
        />
      </div>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Guardar
      </Button>

      <div className="flex flex-col gap-2 border-t pt-4">
        <Label>Probar impresión</Label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setTest({ copies: 1, nonce: Date.now() })}>
            <Printer className="size-4" />
            Imprimir ticket de prueba
          </Button>
          <Button type="button" variant="outline" onClick={() => setTest({ copies: 2, nonce: Date.now() })}>
            <Printer className="size-4" />
            Imprimir 2 copias de prueba
          </Button>
        </div>
      </div>

      <TicketView
        key={test?.nonce}
        ticket={test ? { ...TEST_TICKET, createdAt: new Date().toISOString() } : null}
        settings={testSettings}
        onClose={() => setTest(null)}
      />
    </form>
  );
}
