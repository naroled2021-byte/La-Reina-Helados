import { ArrowDownCircle, ArrowUpCircle, Banknote, CreditCard, DoorOpen, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/format";
import { CASH_MOVEMENT_TYPE, CASH_MOVEMENT_TYPE_LABEL } from "@/lib/constants";
import type { CashMovementRow } from "@/components/cash/types";

const icons: Record<string, typeof Banknote> = {
  SALE_CASH: Banknote,
  SALE_DIGITAL: CreditCard,
  INCOME: ArrowUpCircle,
  EXPENSE: ArrowDownCircle,
  MANUAL_OPEN: DoorOpen,
};

export function MovementsList({
  movements,
  onEdit,
  onDelete,
  disabled,
}: {
  movements: CashMovementRow[];
  /** Si vienen, se muestran botones de editar/borrar — solo tiene sentido para la caja
   *  abierta (ver cash-actions.ts: una vez cerrada, los movimientos quedan fijos). */
  onEdit?: (movement: CashMovementRow) => void;
  onDelete?: (movement: CashMovementRow) => void;
  disabled?: boolean;
}) {
  if (movements.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
        Todavía no hay movimientos en esta caja.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {movements.map((m) => {
        const Icon = icons[m.type] ?? Banknote;
        const isNegative = m.type === CASH_MOVEMENT_TYPE.EXPENSE;
        const isEditable =
          (m.type === CASH_MOVEMENT_TYPE.INCOME || m.type === CASH_MOVEMENT_TYPE.EXPENSE) && (onEdit || onDelete);
        return (
          <div key={m.id} className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {CASH_MOVEMENT_TYPE_LABEL[m.type] ?? m.type}
                {m.description ? ` · ${m.description}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {m.userName ?? "Sistema"} ·{" "}
                {new Date(m.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {m.type !== CASH_MOVEMENT_TYPE.MANUAL_OPEN && (
              <span className={`shrink-0 text-sm font-semibold tabular-nums ${isNegative ? "text-destructive" : ""}`}>
                {isNegative ? "-" : "+"}
                {currency.format(m.amount)}
              </span>
            )}
            {isEditable && (
              <div className="flex shrink-0 items-center gap-0.5">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={disabled}
                    onClick={() => onEdit(m)}
                    aria-label="Editar movimiento"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={disabled}
                    onClick={() => onDelete(m)}
                    aria-label="Borrar movimiento"
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
