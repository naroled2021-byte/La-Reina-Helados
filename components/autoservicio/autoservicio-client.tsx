"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Info, Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IceCreamOrderPanel } from "@/components/autoservicio/ice-cream-order-panel";
import { createSelfServiceOrder } from "@/lib/actions/self-service-actions";
import { currency } from "@/lib/format";
import { ORDER_TYPE_LABEL } from "@/lib/constants";
import type { CartLine, SaleFlavor } from "@/components/sales/types";
import type { ProductRow } from "@/components/products/types";

const orderTypes = ["DELIVERY", "TAKEAWAY"] as const;

const FORMAT_GROUP_NAMES = ["Kilo", "1/2 Kilo", "1/4 Kilo", "Paquete Cucuruchos x3", "Paquete Vasitos x5"];

export function AutoservicioClient({
  products,
  flavors,
}: {
  products: ProductRow[];
  flavors: SaleFlavor[];
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [confirmed, setConfirmed] = useState<{ number: number; total: number } | null>(null);

  const formatProducts = useMemo(
    () =>
      FORMAT_GROUP_NAMES.map((name) => products.find((p) => p.name === name)).filter(
        (p): p is ProductRow => !!p
      ),
    [products]
  );
  const [orderType, setOrderType] = useState<string>("DELIVERY");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressReference, setAddressReference] = useState("");
  const deliveryAddress = [
    [addressStreet.trim(), addressNumber.trim()].filter(Boolean).join(" "),
    addressReference.trim(),
  ]
    .filter(Boolean)
    .join(" - ");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart]
  );

  function handleAddFormat(format: ProductRow, flavorIds: string[]) {
    const names = flavorIds.map((id) => flavors.find((f) => f.id === id)?.name ?? "").filter(Boolean);
    setCart((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        productId: format.id,
        productName: format.name,
        unitPrice: format.price,
        quantity: 1,
        flavorIds,
        flavorNames: names,
      },
    ]);
    toast.success(`${format.name} agregado al pedido`);
  }

  function updateQuantity(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  function resetForm() {
    setCart([]);
    setOrderType("DELIVERY");
    setAddressStreet("");
    setAddressNumber("");
    setAddressReference("");
    setCustomerName("");
    setCustomerPhone("");
    setConfirmed(null);
  }

  function handleConfirmOrder() {
    setError(null);
    if (cart.length === 0) {
      setError("Agregá al menos un producto a tu pedido");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Completá tu nombre y teléfono");
      return;
    }
    if (orderType === "DELIVERY" && !deliveryAddress.trim()) {
      setError("Completá la dirección de entrega");
      return;
    }

    startTransition(async () => {
      const res = await createSelfServiceOrder({
        customerName,
        customerPhone,
        type: orderType as never,
        deliveryAddress,
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, flavorIds: l.flavorIds })),
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }
      setConfirmed({ number: res.data.number, total: res.data.total });
    });
  }

  if (confirmed) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <Card className="w-full max-w-md border-none text-center shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 className="size-14 text-primary" strokeWidth={1.5} />
            <h2 className="text-xl font-semibold">¡Pedido #{confirmed.number} recibido!</h2>
            <p className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{currency.format(confirmed.total)}</span>
              <br />
              Pagás en efectivo al {orderType === "DELIVERY" ? "recibir tu pedido" : "retirarlo"}. Te vamos a
              avisar cuando esté listo.
            </p>
            <Button className="mt-2" onClick={resetForm}>
              Hacer otro pedido
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 lg:flex-row lg:items-start">
      <div className="flex-1">
        <IceCreamOrderPanel formats={formatProducts} flavors={flavors} onAdd={handleAddFormat} />
      </div>

      <Card className="w-full border-none shadow-sm lg:sticky lg:top-20 lg:w-96 lg:shrink-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="size-4" />
            Tu pedido
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {cart.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Elegí el formato y los gustos para empezar.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {cart.map((line) => (
                <div key={line.key} className="flex items-start justify-between gap-2 rounded-xl border px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{line.productName}</p>
                    {line.flavorNames.length > 0 && (
                      <p className="truncate text-xs text-muted-foreground">{line.flavorNames.join(" + ")}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{currency.format(line.unitPrice)} c/u</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="outline" size="icon-xs" onClick={() => updateQuantity(line.key, -1)}>
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-5 text-center text-sm tabular-nums">{line.quantity}</span>
                    <Button variant="outline" size="icon-xs" onClick={() => updateQuantity(line.key, 1)}>
                      <Plus className="size-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => removeLine(line.key)}>
                      <Trash2 className="size-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Tipo de pedido</Label>
            <Select value={orderType} onValueChange={(v) => setOrderType(v ?? "DELIVERY")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tipo">{(value: string) => ORDER_TYPE_LABEL[value] ?? value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {orderTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ORDER_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {orderType === "DELIVERY" && (
            <div className="flex flex-col gap-1.5">
              <Label>Dirección de entrega</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  className="col-span-2"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  placeholder="Calle"
                  aria-label="Calle"
                />
                <Input
                  value={addressNumber}
                  onChange={(e) => setAddressNumber(e.target.value)}
                  placeholder="Número"
                  aria-label="Número"
                />
              </div>
              <Input
                value={addressReference}
                onChange={(e) => setAddressReference(e.target.value)}
                placeholder="Referencia (piso, depto, entre calles...)"
                aria-label="Referencia"
              />

              <div className="flex items-start gap-2 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-900">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <p>
                  El delivery tiene un <strong>adicional de $500</strong> que se paga al recibir el pedido (no
                  está incluido en el total de abajo).
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customerName">Tu nombre</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nombre y apellido"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customerPhone">Tu teléfono</Label>
            <Input
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="11-1234-5678"
            />
          </div>

          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Pagás en efectivo al {orderType === "DELIVERY" ? "recibir tu pedido" : "retirarlo"}.
          </p>

          <div className="flex flex-col gap-1 border-t pt-3 text-sm">
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{currency.format(subtotal)}</span>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <Button size="lg" disabled={isPending} onClick={handleConfirmOrder}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirmar pedido
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
