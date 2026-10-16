"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MovementsList } from "@/components/cash/movements-list";
import { EditMovementDialog } from "@/components/cash/edit-movement-dialog";
import { fetchCashRegisterForCaja, updateClosedRegister, deleteCashMovement } from "@/lib/actions/cash-actions";
import { currency } from "@/lib/format";
import { summarizeMovements, sumAmounts } from "@/lib/cash-utils";
import type { CashMovementRow, CashPaymentMethod } from "@/components/cash/types";

/** Detalle de un cierre de caja, con edición para Administrador: montos declarados por
 *  método de pago, notas, y los movimientos INCOME/EXPENSE (editar/borrar recalcula el
 *  esperado y la diferencia de ese cierre — ver cash-actions.ts). */
export function ClosureDetailDialog({
  registerId,
  onOpenChange,
  isAdmin,
  paymentMethods,
}: {
  registerId: string | null;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  paymentMethods: CashPaymentMethod[];
}) {
  return (
    <Dialog open={!!registerId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        {registerId && (
          <DetailBody key={registerId} registerId={registerId} isAdmin={isAdmin} paymentMethods={paymentMethods} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailBody({
  registerId,
  isAdmin,
  paymentMethods,
}: {
  registerId: string;
  isAdmin: boolean;
  paymentMethods: CashPaymentMethod[];
}) {
  const router = useRouter();
  const [register, setRegister] = useState<Awaited<ReturnType<typeof fetchCashRegisterForCaja>> | undefined>(undefined);
  const [editingMovement, setEditingMovement] = useState<CashMovementRow | null>(null);
  const [editingClosure, setEditingClosure] = useState(false);
  const [isDeleting, startDeleting] = useTransition();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchCashRegisterForCaja(registerId).then((data) => {
      if (!cancelled) setRegister(data);
    });
    return () => {
      cancelled = true;
    };
  }, [registerId, reloadKey]);

  function reload() {
    setReloadKey((k) => k + 1);
    router.refresh();
  }

  function handleDeleteMovement(movement: CashMovementRow) {
    if (!confirm(`¿Borrar este movimiento (${movement.description ?? movement.type})?`)) return;
    startDeleting(async () => {
      const res = await deleteCashMovement(movement.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Movimiento borrado");
      reload();
    });
  }

  if (register === undefined) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!register) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No se encontró la caja.</p>;
  }

  const isClosed = register.status === "CLOSED";

  if (editingClosure) {
    return (
      <EditClosureForm
        registerId={register.id}
        declaredAmounts={(register.closingDeclaredAmounts as Record<string, number> | null) ?? {}}
        expectedByMethod={(register.closingExpectedAmounts as Record<string, number> | null) ?? {}}
        notes={register.notes ?? ""}
        paymentMethods={paymentMethods}
        onCancel={() => setEditingClosure(false)}
        onSaved={() => {
          setEditingClosure(false);
          reload();
        }}
      />
    );
  }

  const { salesCash, salesDigital, income, expense } = summarizeMovements(register.movements);
  const totalIngresos = salesCash + salesDigital + income;
  const total = register.closingAmountDeclared ?? register.closingAmountExpected ?? 0;
  const difference = register.difference ?? 0;

  const movementRows: CashMovementRow[] = register.movements.map((m) => ({
    id: m.id,
    type: m.type,
    amount: m.amount,
    paymentMethod: m.paymentMethod,
    description: m.description,
    userName: m.user?.name ?? null,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <>
      <DialogHeader>
        <DialogTitle>Caja {isClosed ? "cerrada" : "abierta"}</DialogTitle>
        <DialogDescription>
          {new Date(register.openedAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
          {register.closedAt &&
            ` — ${new Date(register.closedAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}`}
          {register.closedBy && ` · ${register.closedBy.name}`}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1 rounded-2xl border bg-card p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Caja inicial</span>
          <span className="tabular-nums">{currency.format(register.openingAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ingresos</span>
          <span className="tabular-nums text-primary">+{currency.format(totalIngresos)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Egresos</span>
          <span className="tabular-nums text-destructive">-{currency.format(expense)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t pt-1 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{currency.format(total)}</span>
        </div>
        {register.closingAmountDeclared != null && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Esperado {currency.format(register.closingAmountExpected ?? 0)}</span>
            <span className={difference < 0 ? "text-destructive" : difference > 0 ? "text-primary" : ""}>
              Diferencia {difference >= 0 ? "+" : ""}
              {currency.format(difference)}
            </span>
          </div>
        )}
      </div>

      {isAdmin && isClosed && (
        <Button variant="outline" size="sm" className="gap-1.5 self-start" onClick={() => setEditingClosure(true)}>
          <Pencil className="size-3.5" />
          Editar montos declarados del cierre
        </Button>
      )}

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-muted-foreground">Movimientos</p>
        <MovementsList
          movements={movementRows}
          onEdit={isAdmin ? setEditingMovement : undefined}
          onDelete={isAdmin ? handleDeleteMovement : undefined}
          disabled={isDeleting}
        />
      </div>

      <EditMovementDialog
        movement={editingMovement}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMovement(null);
            reload();
          }
        }}
      />
    </>
  );
}

function EditClosureForm({
  registerId,
  declaredAmounts,
  expectedByMethod,
  notes,
  paymentMethods,
  onCancel,
  onSaved,
}: {
  registerId: string;
  declaredAmounts: Record<string, number>;
  expectedByMethod: Record<string, number>;
  notes: string;
  paymentMethods: CashPaymentMethod[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [declared, setDeclared] = useState<Record<string, string>>(() =>
    Object.fromEntries(paymentMethods.map((m) => [m.key, String(declaredAmounts[m.key] ?? 0)]))
  );
  const [notesValue, setNotesValue] = useState(notes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const expectedTotal = sumAmounts(expectedByMethod);
  const declaredTotal = Object.values(declared).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const totalDifference = declaredTotal - expectedTotal;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const declaredAmountsPayload = Object.fromEntries(
        Object.entries(declared).map(([key, value]) => [key, Number(value) || 0])
      );
      const res = await updateClosedRegister({ id: registerId, declaredAmounts: declaredAmountsPayload, notes: notesValue });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Cierre actualizado");
      onSaved();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar cierre</DialogTitle>
        <DialogDescription>Total esperado: {currency.format(expectedTotal)}</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
          {paymentMethods.map((m, i) => {
            const methodDifference = (Number(declared[m.key]) || 0) - (expectedByMethod[m.key] ?? 0);
            return (
              <div key={m.key} className="flex flex-col gap-1.5">
                <Label htmlFor={`closure-declared-${m.key}`}>
                  {m.label} declarado{" "}
                  <span className="text-xs text-muted-foreground">
                    (esperado: {currency.format(expectedByMethod[m.key] ?? 0)})
                  </span>
                </Label>
                <Input
                  id={`closure-declared-${m.key}`}
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
          <Label htmlFor="closure-notes">Notas</Label>
          <Textarea id="closure-notes" rows={2} value={notesValue} onChange={(e) => setNotesValue(e.target.value)} />
        </div>

        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
