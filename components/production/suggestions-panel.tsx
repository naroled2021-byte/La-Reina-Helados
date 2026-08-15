"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STOCK_STATUS_LABEL, STOCK_STATUS_COLOR } from "@/lib/constants";
import type { Suggestion } from "@/components/production/types";

export function SuggestionsPanel({
  suggestions,
  onUseSuggestions,
}: {
  suggestions: Suggestion[];
  onUseSuggestions: () => void;
}) {
  if (suggestions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed py-8 text-center text-sm text-muted-foreground">
        No hay sabores con stock bajo por ahora.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Sugerencias de producción</h2>
        <Button size="sm" onClick={onUseSuggestions}>
          Crear producción con sugerencias
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="pb-2 font-medium">Sabor</th>
              <th className="pb-2 font-medium">Stock</th>
              <th className="pb-2 font-medium">Mínimo</th>
              <th className="pb-2 font-medium">Sugerido</th>
              <th className="pb-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s) => (
              <tr key={s.flavorId} className="border-t">
                <td className="py-2 font-medium">{s.flavorName}</td>
                <td className="py-2 tabular-nums">{s.currentStock}kg</td>
                <td className="py-2 tabular-nums text-muted-foreground">{s.minStock}kg</td>
                <td className="py-2 tabular-nums font-semibold">{s.suggested}kg</td>
                <td className="py-2">
                  <Badge
                    variant="outline"
                    className="border-none text-[10px]"
                    style={{
                      backgroundColor: `${STOCK_STATUS_COLOR[s.status]}22`,
                      color: STOCK_STATUS_COLOR[s.status],
                    }}
                  >
                    {STOCK_STATUS_LABEL[s.status] ?? s.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
