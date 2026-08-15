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
import { currency } from "@/lib/format";

export function CloseRegisterDialog({
  open,
  onOpenChange,
  expected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expected: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open && <CloseForm expected={expected} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function CloseForm({
  expected,
  onOpenChange,
}: {
  expected: number;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [declaredAmount, setDeclaredAmount] = useState(String(expected));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const difference = useMemo(() => {
    const declared = Number(declaredAmount);
    return Number.isFinite(declared) ? declared - expected : 0;
  }, [declaredAmount, expected]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await closeCashRegister({ declaredAmount: declaredAmount as never, notes });
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
        <DialogDescription>Efectivo esperado: {currency.format(expected)}</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="declaredAmount">Efectivo contado</Label>
          <Input
            id="declaredAmount"
            type="number"
            min="0"
            step="0.01"
            value={declaredAmount}
            onChange={(e) => setDeclaredAmount(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            Math.abs(difference) < 0.01
              ? "bg-secondary/40 text-secondary-foreground"
              : difference > 0
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive"
          }`}
        >
          Diferencia: {difference >= 0 ? "+" : ""}
          {currency.format(difference)}
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
