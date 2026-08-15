"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
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
import { ProductPickerGrid } from "@/components/sales/product-picker-grid";
import { FlavorPickerDialog } from "@/components/sales/flavor-picker-dialog";
import { TodaySalesList } from "@/components/sales/today-sales-list";
import { createSale } from "@/lib/actions/sale-actions";
import { createCustomer } from "@/lib/actions/customer-actions";
import { currency } from "@/lib/format";
import { ORDER_TYPE_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import type {
  CartLine,
  SaleCustomer,
  SaleFlavor,
  SalePaymentMethod,
  SaleProduct,
  TodaySale,
} from "@/components/sales/types";

const orderTypes = ["DINE_IN", "TAKEAWAY", "DELIVERY"] as const;

export function SalesClient({
  products,
  flavors,
  paymentMethods,
  customers: initialCustomers,
  todaySales,
}: {
  products: SaleProduct[];
  flavors: SaleFlavor[];
  paymentMethods: SalePaymentMethod[];
  customers: SaleCustomer[];
  todaySales: TodaySale[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pendingFlavorProduct, setPendingFlavorProduct] = useState<SaleProduct | null>(null);
  const [orderType, setOrderType] = useState<string>("DINE_IN");
  const [tableNumber, setTableNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
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

  function handlePickProduct(product: SaleProduct) {
    if (product.allowsFlavors) {
      setPendingFlavorProduct(product);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id && l.flavorIds.length === 0);
      if (existing) {
        return prev.map((l) => (l.key === existing.key ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          key: crypto.randomUUID(),
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1,
          flavorIds: [],
          flavorNames: [],
        },
      ];
    });
  }

  function handleConfirmFlavors(flavorIds: string[]) {
    if (!pendingFlavorProduct) return;
    const names = flavorIds.map((id) => flavors.find((f) => f.id === id)?.name ?? "").filter(Boolean);
    setCart((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        productId: pendingFlavorProduct.id,
        productName: pendingFlavorProduct.name,
        unitPrice: pendingFlavorProduct.price,
        quantity: 1,
        flavorIds,
        flavorNames: names,
      },
    ]);
    setPendingFlavorProduct(null);
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
    setDeliveryAddress("");
    setCustomerId("none");
  }

  function handleConfirmSale() {
    setError(null);
    if (cart.length === 0) {
      setError("Agregá al menos un producto al carrito");
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
      toast.success(`Venta #${res.data.number} confirmada — ${currency.format(res.data.total)}`);
      resetCart();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex-1">
        <ProductPickerGrid products={products} onPick={handlePickProduct} />
      </div>

      <Card className="w-full border-none shadow-sm lg:sticky lg:top-20 lg:w-96 lg:shrink-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="size-4" />
            Carrito
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {cart.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Elegí productos del catálogo para empezar.
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
            <Select value={orderType} onValueChange={(v) => setOrderType(v ?? "DINE_IN")}>
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

          {orderType === "DINE_IN" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tableNumber">Mesa (opcional)</Label>
              <Input id="tableNumber" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
            </div>
          )}

          {orderType === "DELIVERY" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deliveryAddress">Dirección de entrega</Label>
              <Input
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
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
            Confirmar venta
          </Button>
        </CardContent>
      </Card>

      <FlavorPickerDialog
        product={pendingFlavorProduct}
        flavors={flavors}
        onCancel={() => setPendingFlavorProduct(null)}
        onConfirm={handleConfirmFlavors}
      />
    </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Ventas de hoy</h2>
        <TodaySalesList sales={todaySales} />
      </div>
    </div>
  );
}
