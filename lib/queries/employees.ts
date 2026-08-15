import { db } from "@/lib/db";

export async function getEmployeesPageData() {
  const [users, roles, permissions, auditLogs] = await Promise.all([
    db.user.findMany({ include: { role: true }, orderBy: { name: "asc" } }),
    db.role.findMany({ include: { permissions: true, _count: { select: { users: true } } }, orderBy: { name: "asc" } }),
    db.permission.findMany({ orderBy: { key: "asc" } }),
    db.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return { users, roles, permissions, auditLogs };
}
