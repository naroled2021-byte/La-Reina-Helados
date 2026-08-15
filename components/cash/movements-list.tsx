import { ArrowDownCircle, ArrowUpCircle, Banknote, CreditCard } from "lucide-react";
import { currency } from "@/lib/format";
import { CASH_MOVEMENT_TYPE, CASH_MOVEMENT_TYPE_LABEL } from "@/lib/constants";
import type { CashMovementRow } from "@/components/cash/types";

const icons: Record<string, typeof Banknote> = {
  SALE_CASH: Banknote,
  SALE_DIGITAL: CreditCard,
  INCOME: ArrowUpCircle,
  EXPENSE: ArrowDownCircle,
};

export function MovementsList({ movements }: { movements: CashMovementRow[] }) {
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
            <span className={`text-sm font-semibold tabular-nums ${isNegative ? "text-destructive" : ""}`}>
              {isNegative ? "-" : "+"}
              {currency.format(m.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
