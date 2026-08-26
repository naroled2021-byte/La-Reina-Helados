"use server";

import { requirePermission } from "@/lib/auth-helpers";
import { getAuditLog, getAuditFilterOptions, type AuditFilters } from "@/lib/queries/audit";
import type { DateRange } from "@/lib/date-range";

export async function fetchAuditLog(range: DateRange, filters: AuditFilters) {
  await requirePermission("audit.view");
  return getAuditLog(range, filters);
}

export async function fetchAuditFilterOptions() {
  await requirePermission("audit.view");
  return getAuditFilterOptions();
}
