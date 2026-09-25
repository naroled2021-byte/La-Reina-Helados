import { ArrowDownCircle, ArrowUpCircle, Factory, SlidersHorizontal, Trash2 } from "lucide-react";
import { MOVEMENT_TYPE_LABEL } from "@/lib/constants";
import type { InventoryMovementRow } from "@/components/inventory/types";

const icons: Record<string, typeof ArrowUpCircle> = {
  IN: ArrowUpCircle,
  OUT: ArrowDownCircle,
  WASTE: Trash2,
  ADJUSTMENT: SlidersHorizontal,
  PRODUCTION: Factory,
  SALE: ArrowDownCircle,
};

// IN/PRODUCTION suman stock; OUT/WASTE/SALE se guardan en positivo pero restan; ADJUSTMENT
// ya viene con su propio signo (puede ser +/-), tal como lo carga stock-adjust-dialog.
const alwaysOutgoing = new Set(["OUT", "WASTE", "SALE"]);

export function InventoryMovementsList({ movements }: { movements: InventoryMovementRow[] }) {
  if (movements.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
        Todavía no hay movimientos de stock registrados.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {movements.map((m) => {
        const Icon = icons[m.type] ?? SlidersHorizontal;
        const signedQuantity = alwaysOutgoing.has(m.type) ? -Math.abs(m.quantity) : m.quantity;
        const negative = signedQuantity < 0;
        return (
          <div key={m.id} className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {m.itemName} · {MOVEMENT_TYPE_LABEL[m.type] ?? m.type}
                {m.reason ? ` · ${m.reason}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {m.userName ?? "Sistema"} ·{" "}
                {new Date(m.createdAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
              </p>
            </div>
            <span className={`text-sm font-semibold tabular-nums ${negative ? "text-destructive" : "text-primary"}`}>
              {negative ? "" : "+"}
              {signedQuantity}
              {m.unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}
