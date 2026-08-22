"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addCashMovement } from "@/lib/actions/cash-actions";
import { INCOME_REASONS, EXPENSE_REASONS, MANUAL_OPEN_REASONS } from "@/lib/constants";

type MovementType = "INCOME" | "EXPENSE" | "MANUAL_OPEN";

const REASONS: Record<MovementType, readonly string[]> = {
  INCOME: INCOME_REASONS,
  EXPENSE: EXPENSE_REASONS,
  MANUAL_OPEN: MANUAL_OPEN_REASONS,
};

const TITLES: Record<MovementType, string> = {
  INCOME: "Registrar ingreso",
  EXPENSE: "Registrar egreso",
  MANUAL_OPEN: "Registrar apertura manual",
};

const DESCRIPTIONS: Record<MovementType, string> = {
  INCOME: "Dinero que entra a la caja fuera de una venta.",
  EXPENSE: "Dinero que sale de la caja.",
  MANUAL_OPEN: "Dejá constancia de por qué se abrió la caja sin que haya una venta detrás.",
};

export function AddMovementDialog({
  type,
  open,
  onOpenChange,
}: {
  type: MovementType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open && <MovementForm type={type} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function MovementForm({
  type,
  onOpenChange,
}: {
  type: MovementType;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const reasons = REASONS[type];
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState(reasons[0]);
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const description = reason === "Otro" ? customReason.trim() : reason;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addCashMovement({
        type,
        amount: type === "MANUAL_OPEN" ? (0 as never) : (amount as never),
        description,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(
        type === "INCOME" ? "Ingreso registrado" : type === "EXPENSE" ? "Egreso registrado" : "Apertura registrada"
      );
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{TITLES[type]}</DialogTitle>
        <DialogDescription>{DESCRIPTIONS[type]}</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {type !== "MANUAL_OPEN" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label>Motivo</Label>
          <Select value={reason} onValueChange={(v) => v && setReason(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Motivo">{(value: string) => value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {reasons.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {reason === "Otro" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customReason">Detalle</Label>
            <Textarea
              id="customReason"
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Especificá el motivo"
              autoFocus
            />
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
