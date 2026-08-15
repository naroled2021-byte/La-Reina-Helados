"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { AuditLogRow } from "@/components/employees/types";

export function ActivityLog({ logs }: { logs: AuditLogRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q) ||
        l.userName?.toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por acción, entidad o usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          Sin actividad registrada.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Usuario</th>
                <th className="pb-2 font-medium">Acción</th>
                <th className="pb-2 font-medium">Entidad</th>
                <th className="pb-2 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="py-2">{log.userName ?? "Sistema"}</td>
                  <td className="py-2 font-mono text-xs">{log.action}</td>
                  <td className="py-2 text-muted-foreground">{log.entity}</td>
                  <td className="py-2 text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
