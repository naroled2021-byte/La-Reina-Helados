import { currency } from "@/lib/format";
import type { ClosedRegister } from "@/components/cash/types";

export function ClosuresHistory({ closures }: { closures: ClosedRegister[] }) {
  if (closures.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed py-8 text-center text-sm text-muted-foreground">
        Todavía no hay cierres registrados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="pb-2 font-medium">Cierre</th>
            <th className="pb-2 font-medium">Apertura</th>
            <th className="pb-2 font-medium">Esperado</th>
            <th className="pb-2 font-medium">Declarado</th>
            <th className="pb-2 font-medium">Diferencia</th>
            <th className="pb-2 font-medium">Responsable</th>
          </tr>
        </thead>
        <tbody>
          {closures.map((c) => {
            const diff = c.difference ?? 0;
            return (
              <tr key={c.id} className="border-t">
                <td className="py-2">
                  {c.closedAt ? new Date(c.closedAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "—"}
                </td>
                <td className="py-2 tabular-nums">{currency.format(c.openingAmount)}</td>
                <td className="py-2 tabular-nums">
                  {c.closingAmountExpected != null ? currency.format(c.closingAmountExpected) : "—"}
                </td>
                <td className="py-2 tabular-nums">
                  {c.closingAmountDeclared != null ? currency.format(c.closingAmountDeclared) : "—"}
                </td>
                <td
                  className={`py-2 font-medium tabular-nums ${
                    Math.abs(diff) < 0.01 ? "text-muted-foreground" : diff > 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {diff >= 0 ? "+" : ""}
                  {currency.format(diff)}
                </td>
                <td className="py-2 text-muted-foreground">{c.closedByName ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
