import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requirePermission(key: string) {
  const session = await requireSession();
  // No redirige a /admin: el Dashboard también exige un permiso (dashboard.view), así que
  // si ese fuera el destino, un usuario sin ese permiso entraría en un loop de redirects.
  if (!session.user.permissions.includes(key)) redirect("/admin/sin-acceso");
  return session;
}
