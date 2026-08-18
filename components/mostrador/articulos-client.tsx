"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { TileGrid } from "@/components/mostrador/tile-grid";
import { CartSheet } from "@/components/mostrador/cart-sheet";
import { createSale } from "@/lib/actions/sale-actions";
import { currency } from "@/lib/format";
import { ORDER_TYPE } from "@/lib/constants";
import type { CartLine, SalePaymentMethod, SaleProduct } from "@/components/sales/types";

export function ArticulosClient({
  products,
  paymentMethods,
}: {
  products: SaleProduct[];
  paymentMethods: SalePaymentMethod[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]?.key ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const itemCount = useMemo(() => cart.reduce((sum, l) => sum + l.quantity, 0), [cart]);
  const total = useMemo(() => cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0), [cart]);

  function handlePickProduct(product: SaleProduct) {
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
    toast.success(`${product.name} agregado`);
  }

  function updateQuantity(key: string, delta: number) {
    setCart((prev) =>
      prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l)).filter((l) => l.quantity > 0)
    );
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
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
        customerId: "",
        type: ORDER_TYPE.TAKEAWAY as never,
        tableNumber: "",
        deliveryAddress: "",
        paymentMethod,
        discount: 0 as never,
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, flavorIds: l.flavorIds })),
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(`Pedido #${res.data.number} confirmado — ${currency.format(res.data.total)}`);
      setCart([]);
      setCartOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <TileGrid products={products} onPick={handlePickProduct} />

      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cart}
        updateQuantity={updateQuantity}
        removeLine={removeLine}
        paymentMethods={paymentMethods}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        total={total}
        error={error}
        isPending={isPending}
        onConfirm={handleConfirmSale}
      />

      {itemCount > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-lg items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-lg"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/20 text-xs">
              {itemCount}
            </span>
            <ShoppingBag className="size-4" />
            Generar ticket
          </span>
          <span className="text-sm font-semibold">{currency.format(total)}</span>
        </button>
      )}
    </div>
  );
}
