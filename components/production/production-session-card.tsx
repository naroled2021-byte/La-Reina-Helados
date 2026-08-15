import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRODUCTION_STATUS } from "@/lib/constants";
import type { ProductionSession, ProductionItemRow } from "@/components/production/types";

const statusLabel: Record<string, string> = {
  [PRODUCTION_STATUS.PENDING]: "Pendiente",
  [PRODUCTION_STATUS.IN_PROGRESS]: "En producción",
  [PRODUCTION_STATUS.COMPLETED]: "Completada",
};

const statusColor: Record<string, string> = {
  [PRODUCTION_STATUS.PENDING]: "#FBBF24",
  [PRODUCTION_STATUS.IN_PROGRESS]: "#60A5FA",
  [PRODUCTION_STATUS.COMPLETED]: "#34D399",
};

export function ProductionSessionCard({
  session,
  onRecord,
}: {
  session: ProductionSession;
  onRecord: (item: ProductionItemRow) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            Producción {new Date(session.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          {session.createdByName && <p className="text-xs text-muted-foreground">{session.createdByName}</p>}
        </div>
        <Badge
          variant="outline"
          className="border-none text-[10px]"
          style={{ backgroundColor: `${statusColor[session.status]}22`, color: statusColor[session.status] }}
        >
          {statusLabel[session.status] ?? session.status}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        {session.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{item.flavorName}</p>
              <p className="text-xs text-muted-foreground">
                Plan: {item.quantityPlanned}kg
                {item.recorded && <> · Producido: {item.quantityProduced}kg · Merma: {item.waste}kg</>}
              </p>
            </div>
            {!item.recorded && (
              <Button size="sm" variant="outline" onClick={() => onRecord(item)}>
                Registrar
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
