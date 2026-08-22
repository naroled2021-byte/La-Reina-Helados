"use client";

import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, DoorOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpenRegisterCard } from "@/components/cash/open-register-card";
import { CashSummaryCards } from "@/components/cash/cash-summary-cards";
import { MovementsList } from "@/components/cash/movements-list";
import { AddMovementDialog } from "@/components/cash/add-movement-dialog";
import { CloseRegisterDialog } from "@/components/cash/close-register-dialog";
import { ClosuresHistory } from "@/components/cash/closures-history";
import { computeExpectedByMethod } from "@/lib/cash-utils";
import type { CashPaymentMethod, ClosedRegister, OpenRegister } from "@/components/cash/types";

export function CashClient({
  openRegister,
  closedRegisters,
  paymentMethods,
}: {
  openRegister: OpenRegister | null;
  closedRegisters: ClosedRegister[];
  paymentMethods: CashPaymentMethod[];
}) {
  const [movementDialog, setMovementDialog] = useState<"INCOME" | "EXPENSE" | "MANUAL_OPEN" | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  if (!openRegister) {
    return (
      <div className="flex flex-col gap-8">
        <OpenRegisterCard paymentMethods={paymentMethods} />
        {closedRegisters.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Historial de cierres</h2>
            <ClosuresHistory closures={closedRegisters} />
          </div>
        )}
      </div>
    );
  }

  const expectedByMethod = computeExpectedByMethod(openRegister.openingAmounts, openRegister.movements);

  return (
    <div className="flex flex-col gap-6">
      <CashSummaryCards register={openRegister} paymentMethods={paymentMethods} />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setMovementDialog("INCOME")}>
          <ArrowUpCircle className="size-4" />
          Registrar ingreso
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setMovementDialog("EXPENSE")}>
          <ArrowDownCircle className="size-4" />
          Registrar egreso
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setMovementDialog("MANUAL_OPEN")}>
          <DoorOpen className="size-4" />
          Registrar apertura manual
        </Button>
        <Button variant="destructive" size="sm" className="ml-auto gap-1.5" onClick={() => setCloseDialogOpen(true)}>
          <Lock className="size-4" />
          Cerrar caja
        </Button>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Movimientos</h2>
        <MovementsList movements={openRegister.movements} />
      </div>

      {closedRegisters.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Historial de cierres</h2>
          <ClosuresHistory closures={closedRegisters} />
        </div>
      )}

      {movementDialog && (
        <AddMovementDialog
          type={movementDialog}
          open={!!movementDialog}
          onOpenChange={(open) => !open && setMovementDialog(null)}
        />
      )}
      <CloseRegisterDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        expectedByMethod={expectedByMethod}
        paymentMethods={paymentMethods}
      />
    </div>
  );
}
