import { db } from "@/lib/db";
import type { DateRange } from "@/lib/date-range";
import { AUDIT_ACTION_LABEL } from "@/lib/constants";

export type AuditFilters = {
  userId?: string;
  action?: string;
  q?: string;
};

export async function getAuditLog(range: DateRange, filters: AuditFilters = {}) {
  const logs = await db.auditLog.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      userId: filters.userId || undefined,
      action: filters.action || undefined,
      ...(filters.q
        ? {
            OR: [
              { action: { contains: filters.q, mode: "insensitive" } },
              { entity: { contains: filters.q, mode: "insensitive" } },
              { entityId: { contains: filters.q, mode: "insensitive" } },
              { metadata: { contains: filters.q, mode: "insensitive" } },
              { user: { name: { contains: filters.q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { user: { include: { role: true } } },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    actionLabel: AUDIT_ACTION_LABEL[log.action] ?? log.action,
    entity: log.entity,
    entityId: log.entityId,
    metadata: log.metadata,
    userId: log.userId,
    userName: log.user?.name ?? "Sistema",
    roleName: log.user?.role.name ?? "—",
    createdAt: log.createdAt.toISOString(),
  }));
}

export async function getAuditFilterOptions() {
  const [users, actionRows] = await Promise.all([
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.auditLog.findMany({ select: { action: true }, distinct: ["action"] }),
  ]);

  const actions = actionRows
    .map((r) => r.action)
    .sort((a, b) => (AUDIT_ACTION_LABEL[a] ?? a).localeCompare(AUDIT_ACTION_LABEL[b] ?? b));

  return { users, actions };
}
