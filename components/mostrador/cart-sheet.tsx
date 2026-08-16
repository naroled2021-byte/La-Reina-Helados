"use client";

import { Loader2, Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currency } from "@/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import type { CartLine, SalePaymentMethod } from "@/components/sales/types";

export function CartSheet({
  open,
  onOpenChange,
  cart,
  updateQuantity,
  removeLine,
  paymentMethods,
  paymentMethod,
  setPaymentMethod,
  total,
  error,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartLine[];
  updateQuantity: (key: string, delta: number) => void;
  removeLine: (key: string) => void;
  paymentMethods: SalePaymentMethod[];
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  total: number;
  error: string | null;
  isPending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Pedido</SheetTitle>
          <SheetDescription>Revisá los productos y generá el ticket</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          {cart.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Todavía no agregaste productos.
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
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button variant="outline" size="icon-lg" onClick={() => updateQuantity(line.key, -1)}>
                      <Minus className="size-4" />
                    </Button>
                    <span className="w-6 text-center text-base tabular-nums">{line.quantity}</span>
                    <Button variant="outline" size="icon-lg" onClick={() => updateQuantity(line.key, 1)}>
                      <Plus className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-lg" onClick={() => removeLine(line.key)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

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

          <div className="flex justify-between border-t pt-3 text-base font-semibold">
            <span>Total</span>
            <span>{currency.format(total)}</span>
          </div>

          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter>
          <Button size="lg" disabled={isPending || cart.length === 0} onClick={onConfirm}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Generar ticket
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
