"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info, Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
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
import { IceCreamOrderPanel } from "@/components/delivery/ice-cream-order-panel";
import { TicketView, type TicketData, type TicketSettings } from "@/components/mostrador/ticket-view";
import { createSale } from "@/lib/actions/sale-actions";
import { createCustomer } from "@/lib/actions/customer-actions";
import { currency } from "@/lib/format";
import { ORDER_TYPE_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import type { CartLine, SaleCustomer, SaleFlavor, SalePaymentMethod } from "@/components/sales/types";
import type { ProductRow } from "@/components/products/types";

const orderTypes = ["DELIVERY", "TAKEAWAY", "DINE_IN"] as const;

const FORMAT_GROUP_NAMES = ["Kilo", "1/2 Kilo", "1/4 Kilo", "Paquete Cucuruchos x3", "Paquete Vasitos x5"];

export function DeliveryClient({
  products,
  flavors,
  paymentMethods,
  customers: initialCustomers,
  ticketSettings,
}: {
  products: ProductRow[];
  flavors: SaleFlavor[];
  paymentMethods: SalePaymentMethod[];
  customers: SaleCustomer[];
  ticketSettings: TicketSettings;
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [ticket, setTicket] = useState<TicketData | null>(null);

  const formatProducts = useMemo(
    () =>
      FORMAT_GROUP_NAMES.map((name) => products.find((p) => p.name === name)).filter(
        (p): p is ProductRow => !!p
      ),
    [products]
  );
  const [orderType, setOrderType] = useState<string>("DELIVERY");
  const [tableNumber, setTableNumber] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressReference, setAddressReference] = useState("");
  const deliveryAddress = [
    [addressStreet.trim(), addressNumber.trim()].filter(Boolean).join(" "),
    addressReference.trim(),
  ]
    .filter(Boolean)
    .join(" - ");
  const [customers, setCustomers] = useState(initialCustomers);
  const [customerId, setCustomerId] = useState("none");
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]?.key ?? "");
  const [discount, setDiscount] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCreatingCustomer, startCreatingCustomer] = useTransition();

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart]
  );
  const discountValue = Number(discount) || 0;
  const total = Math.max(subtotal - discountValue, 0);

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

  function handleAddCustomer() {
    if (!newCustomerName.trim()) return;
    setCustomerError(null);
    startCreatingCustomer(async () => {
      const res = await createCustomer({ name: newCustomerName.trim(), phone: "", email: "", address: "", notes: "" });
      if (!res.ok) {
        setCustomerError(res.error);
        return;
      }
      setCustomers((prev) => [...prev, { id: res.data.id, name: res.data.name, phone: null }]);
      setCustomerId(res.data.id);
      setNewCustomerName("");
      setAddingCustomer(false);
      toast.success(`Cliente "${res.data.name}" creado`);
    });
  }

  function resetCart() {
    setCart([]);
    setDiscount("0");
    setTableNumber("");
    setAddressStreet("");
    setAddressNumber("");
    setAddressReference("");
    setCustomerId("none");
  }

  function handleConfirmSale() {
    setError(null);
    if (cart.length === 0) {
      setError("Agregá al menos un producto al pedido");
      return;
    }
    if (!paymentMethod) {
      setError("Elegí un método de pago");
      return;
    }

    startTransition(async () => {
      const res = await createSale({
        customerId: customerId === "none" ? "" : customerId,
        type: orderType as never,
        tableNumber,
        deliveryAddress,
        paymentMethod,
        discount: discountValue as never,
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, flavorIds: l.flavorIds })),
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(`Pedido #${res.data.number} confirmado — ${currency.format(res.data.total)}`);
      setTicket({
        number: res.data.number,
        createdAt: new Date().toISOString(),
        items: cart,
        subtotal,
        discount: discountValue,
        total: res.data.total,
        paymentMethodLabel: paymentMethods.find((m) => m.key === paymentMethod)?.label ?? PAYMENT_METHOD_LABEL[paymentMethod] ?? paymentMethod,
        orderType,
        customerName: customerId === "none" ? null : customers.find((c) => c.id === customerId)?.name ?? null,
        deliveryAddress: orderType === "DELIVERY" ? deliveryAddress : null,
      });
      resetCart();
      router.refresh();
    });
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
            Pedido
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
                  Recordá informar al cliente que el delivery tiene un <strong>adicional de $500</strong> que se
                  cobra aparte (no se suma al total ni queda registrado en la caja del sistema).
                </p>
              </div>
            </div>
          )}

          {orderType === "DINE_IN" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tableNumber">Mesa (opcional)</Label>
              <Input id="tableNumber" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Cliente (opcional)</Label>
            {addingCustomer ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  placeholder="Nombre del cliente"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomer();
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={handleAddCustomer} disabled={isCreatingCustomer}>
                  Agregar
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setAddingCustomer(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "none")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Consumidor final">
                      {(value: string) =>
                        value === "none" ? "Consumidor final" : customers.find((c) => c.id === value)?.name ?? "Consumidor final"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Consumidor final</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.phone ? ` · ${c.phone}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setAddingCustomer(true)}
                  aria-label="Nuevo cliente"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            )}
            {customerError && <p className="text-xs text-destructive">{customerError}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Método de pago</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v ?? paymentMethod)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegí un método">
                  {(value: string) => PAYMENT_METHOD_LABEL[value] ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="discount">Descuento</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              step="1"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1 border-t pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{currency.format(subtotal)}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Descuento</span>
                <span>-{currency.format(discountValue)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{currency.format(total)}</span>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <Button size="lg" disabled={isPending} onClick={handleConfirmSale}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirmar pedido
          </Button>
        </CardContent>
      </Card>

      <TicketView ticket={ticket} settings={ticketSettings} onClose={() => setTicket(null)} />
    </div>
  );
}
