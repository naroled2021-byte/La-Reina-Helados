"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateCashLimit } from "@/lib/actions/cash-actions";

export function CashLimitEditor({ cashLimit }: { cashLimit: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(cashLimit ? String(cashLimit) : "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const res = await updateCashLimit(value ? Number(value) : null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Límite de caja actualizado");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setOpen(true)}>
        <Settings2 className="size-3.5" />
        {cashLimit ? `Límite: $${cashLimit.toLocaleString("es-AR")}` : "Configurar límite de efectivo"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Límite de efectivo en caja</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cashLimit">Monto máximo (dejalo vacío para no alertar)</Label>
            <Input
              id="cashLimit"
              type="number"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ej: 200000"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
