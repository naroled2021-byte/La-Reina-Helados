"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DateRangeFilter } from "@/components/reports/date-range-filter";
import { ReportTable, type ReportColumn } from "@/components/reports/report-table";
import { ExportButtons } from "@/components/reports/export-buttons";
import { useReportData } from "@/components/reports/use-report-data";
import { fetchAuditLog, fetchAuditFilterOptions } from "@/lib/actions/audit-actions";
import { getRangeForPreset } from "@/lib/date-range";
import type { DateRange } from "@/lib/date-range";

type AuditRow = Awaited<ReturnType<typeof fetchAuditLog>>[number];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "medium" });
}

function parseMetadata(raw: string | null): [string, string][] {
  if (!raw) return [];
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") {
      return Object.entries(obj).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v)]);
    }
  } catch {
    // no era JSON — se muestra como texto plano
  }
  return [["Detalle", raw]];
}

const columns: ReportColumn<AuditRow>[] = [
  { key: "actionLabel", label: "Evento" },
  { key: "userName", label: "Usuario" },
  { key: "createdAt", label: "Fecha", render: (r) => formatDate(r.createdAt).split(" ")[0] },
  {
    key: "hora",
    label: "Hora",
    render: (r) => new Date(r.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  },
  { key: "entity", label: "Entidad", render: (r) => (r.entityId ? `${r.entity} · ${r.entityId.slice(0, 8)}` : r.entity) },
];

export function AuditClient() {
  const [range, setRange] = useState<DateRange>(() => getRangeForPreset("week"));
  const [userId, setUserId] = useState("all");
  const [action, setAction] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const [filterOptions, setFilterOptions] = useState<{ users: { id: string; name: string }[]; actions: string[] }>({
    users: [],
    actions: [],
  });

  useEffect(() => {
    fetchAuditFilterOptions().then(setFilterOptions);
  }, []);

  const filters = useMemo(
    () => ({
      userId: userId === "all" ? undefined : userId,
      action: action === "all" ? undefined : action,
      q: q || undefined,
    }),
    [userId, action, q]
  );
  const { data, loading } = useReportData(fetchAuditLog, [range, filters]);

  const rows = data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <DateRangeFilter onChange={setRange} />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={userId} onValueChange={(v) => v && setUserId(v)}>
          <SelectTrigger size="sm" className="w-44">
            <SelectValue placeholder="Usuario">{(v: string) => (v === "all" ? "Todos los usuarios" : filterOptions.users.find((u) => u.id === v)?.name ?? v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los usuarios</SelectItem>
            {filterOptions.users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={action} onValueChange={(v) => v && setAction(v)}>
          <SelectTrigger size="sm" className="w-52">
            <SelectValue placeholder="Evento">{(v: string) => (v === "all" ? "Todos los eventos" : v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los eventos</SelectItem>
            {filterOptions.actions.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Buscar (ticket, usuario, detalle...)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-9 w-56"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <>
          <ExportButtons
            filename="auditoria"
            columns={[
              { key: "actionLabel", label: "Evento" },
              { key: "userName", label: "Usuario" },
              { key: "roleName", label: "Rol" },
              { key: "createdAt", label: "Fecha y hora" },
              { key: "entity", label: "Entidad" },
              { key: "entityId", label: "ID relacionado" },
              { key: "metadata", label: "Detalle" },
            ]}
            rows={rows}
          />
          <ReportTable
            emptyMessage="No hay eventos de auditoría en este rango."
            columns={columns}
            rows={rows}
            onRowClick={setSelected}
          />
        </>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.actionLabel}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usuario</span>
                  <span className="font-medium">{selected.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rol</span>
                  <span className="font-medium">{selected.roleName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha y hora</span>
                  <span className="font-medium">{formatDate(selected.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entidad</span>
                  <span className="font-medium">{selected.entity}</span>
                </div>
                {selected.entityId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID relacionado</span>
                    <span className="font-medium">{selected.entityId}</span>
                  </div>
                )}
                {parseMetadata(selected.metadata).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="truncate text-right font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
