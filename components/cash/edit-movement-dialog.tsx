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
import { updateCashMovement } from "@/lib/actions/cash-actions";
import { CASH_MOVEMENT_TYPE_LABEL } from "@/lib/constants";
import type { CashMovementRow } from "@/components/cash/types";

export function EditMovementDialog({
  movement,
  onOpenChange,
}: {
  movement: CashMovementRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!movement} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {movement && <EditForm key={movement.id} movement={movement} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  movement,
  onOpenChange,
}: {
  movement: CashMovementRow;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(movement.amount));
  const [description, setDescription] = useState(movement.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateCashMovement({ id: movement.id, amount: amount as never, description });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Movimiento actualizado");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar {CASH_MOVEMENT_TYPE_LABEL[movement.type]?.toLowerCase() ?? "movimiento"}</DialogTitle>
        <DialogDescription>Los cambios se guardan de inmediato.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-amount">Monto</Label>
          <Input
            id="edit-amount"
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
          <Label htmlFor="edit-description">Motivo</Label>
          <Textarea
            id="edit-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
