"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { openCashRegister } from "@/lib/actions/cash-actions";

export function OpenRegisterCard() {
  const router = useRouter();
  const [openingAmount, setOpeningAmount] = useState("20000");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await openCashRegister({ openingAmount: openingAmount as never, notes });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Caja abierta");
      router.refresh();
    });
  }

  return (
    <Card className="mx-auto w-full max-w-sm border-none shadow-sm">
      <CardHeader className="items-center text-center gap-2">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Wallet className="size-6" strokeWidth={1.75} />
        </div>
        <CardTitle>La caja está cerrada</CardTitle>
        <p className="text-sm text-muted-foreground">Abrí la caja para empezar a registrar movimientos.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="openingAmount">Efectivo inicial</Label>
            <Input
              id="openingAmount"
              type="number"
              min="0"
              step="0.01"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Abrir caja
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
