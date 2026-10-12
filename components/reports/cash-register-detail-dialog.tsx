"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MovementsList } from "@/components/cash/movements-list";
import { fetchCashRegisterDetail } from "@/lib/actions/report-actions";
import { currency } from "@/lib/format";
import { summarizeMovements } from "@/lib/cash-utils";

/** Detalle completo de un cierre de caja — se abre al hacer click en una fila del historial
 *  de Reportes → Caja: caja inicial, ingresos, egresos, total y el listado de movimientos. */
export function CashRegisterDetailDialog({
  registerId,
  onOpenChange,
}: {
  registerId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!registerId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        {registerId && <DetailBody key={registerId} registerId={registerId} />}
      </DialogContent>
    </Dialog>
  );
}

function DetailBody({ registerId }: { registerId: string }) {
  const [register, setRegister] = useState<Awaited<ReturnType<typeof fetchCashRegisterDetail>> | undefined>(
    undefined
  );

  useEffect(() => {
    let cancelled = false;
    fetchCashRegisterDetail(registerId).then((data) => {
      if (!cancelled) setRegister(data);
    });
    return () => {
      cancelled = true;
    };
  }, [registerId]);

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

  const { salesCash, salesDigital, income, expense } = summarizeMovements(register.movements);
  const totalIngresos = salesCash + salesDigital + income;
  const total = register.closingAmountDeclared ?? register.closingAmountExpected ?? 0;
  const difference = register.difference ?? 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Caja {register.closedAt ? "cerrada" : "abierta"}</DialogTitle>
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

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-muted-foreground">Movimientos</p>
        <MovementsList
          movements={register.movements.map((m) => ({
            id: m.id,
            type: m.type,
            amount: m.amount,
            paymentMethod: m.paymentMethod,
            description: m.description,
            userName: m.user?.name ?? null,
            createdAt: m.createdAt.toISOString(),
          }))}
        />
      </div>
    </>
  );
}
