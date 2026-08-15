"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { closeCashRegister } from "@/lib/actions/cash-actions";
import { sumAmounts } from "@/lib/cash-utils";
import { currency } from "@/lib/format";
import type { CashPaymentMethod } from "@/components/cash/types";

export function CloseRegisterDialog({
  open,
  onOpenChange,
  expectedByMethod,
  paymentMethods,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedByMethod: Record<string, number>;
  paymentMethods: CashPaymentMethod[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open && (
          <CloseForm expectedByMethod={expectedByMethod} paymentMethods={paymentMethods} onOpenChange={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CloseForm({
  expectedByMethod,
  paymentMethods,
  onOpenChange,
}: {
  expectedByMethod: Record<string, number>;
  paymentMethods: CashPaymentMethod[];
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [declared, setDeclared] = useState<Record<string, string>>(() =>
    Object.fromEntries(paymentMethods.map((m) => [m.key, String(expectedByMethod[m.key] ?? 0)]))
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const expectedTotal = sumAmounts(expectedByMethod);
  const declaredTotal = useMemo(
    () => Object.values(declared).reduce((sum, v) => sum + (Number(v) || 0), 0),
    [declared]
  );
  const totalDifference = declaredTotal - expectedTotal;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const declaredAmounts = Object.fromEntries(
        Object.entries(declared).map(([key, value]) => [key, Number(value) || 0])
      );
      const res = await closeCashRegister({ declaredAmounts, notes });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(
        Math.abs(res.data.difference) < 0.01
          ? "Caja cerrada sin diferencias"
          : `Caja cerrada con diferencia de ${currency.format(res.data.difference)}`
      );
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cerrar caja — Arqueo</DialogTitle>
        <DialogDescription>Total esperado: {currency.format(expectedTotal)}</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
          {paymentMethods.map((m, i) => {
            const methodDifference = (Number(declared[m.key]) || 0) - (expectedByMethod[m.key] ?? 0);
            return (
              <div key={m.key} className="flex flex-col gap-1.5">
                <Label htmlFor={`declared-${m.key}`}>
                  {m.label} contado{" "}
                  <span className="text-xs text-muted-foreground">
                    (esperado: {currency.format(expectedByMethod[m.key] ?? 0)})
                  </span>
                </Label>
                <Input
                  id={`declared-${m.key}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={declared[m.key] ?? "0"}
                  onChange={(e) => setDeclared((prev) => ({ ...prev, [m.key]: e.target.value }))}
                  required
                  autoFocus={i === 0}
                />
                {Math.abs(methodDifference) >= 0.01 && (
                  <p className={`text-xs ${methodDifference > 0 ? "text-primary" : "text-destructive"}`}>
                    Diferencia: {methodDifference >= 0 ? "+" : ""}
                    {currency.format(methodDifference)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            Math.abs(totalDifference) < 0.01
              ? "bg-secondary/40 text-secondary-foreground"
              : totalDifference > 0
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive"
          }`}
        >
          Diferencia total: {totalDifference >= 0 ? "+" : ""}
          {currency.format(totalDifference)}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Cerrar caja
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
