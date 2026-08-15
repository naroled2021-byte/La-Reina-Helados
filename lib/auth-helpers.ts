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
  if (!session.user.permissions.includes(key)) redirect("/admin");
  return session;
}
