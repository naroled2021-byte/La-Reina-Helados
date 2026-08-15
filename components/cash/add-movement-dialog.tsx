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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addCashMovement } from "@/lib/actions/cash-actions";

export function AddMovementDialog({
  type,
  open,
  onOpenChange,
}: {
  type: "INCOME" | "EXPENSE";
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
  type: "INCOME" | "EXPENSE";
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addCashMovement({ type, amount: amount as never, description });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(type === "INCOME" ? "Ingreso registrado" : "Egreso registrado");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{type === "INCOME" ? "Registrar ingreso" : "Registrar egreso"}</DialogTitle>
        <DialogDescription>
          {type === "INCOME" ? "Dinero que entra a la caja fuera de una venta." : "Dinero que sale de la caja."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Motivo</Label>
          <Textarea
            id="description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={type === "INCOME" ? "Ej: reposición de caja chica" : "Ej: compra de insumos"}
          />
        </div>

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
