"use server";

import bcrypt from "bcryptjs";
import { signOut } from "@/auth";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-helpers";

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function verifyAdminAccess(password: string): Promise<ActionResult> {
  const session = await requireSession();

  if (!password) return { ok: false, error: "Ingresá tu contraseña" };

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { ok: false, error: "Usuario no encontrado" };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { ok: false, error: "Contraseña incorrecta" };

  return { ok: true, data: undefined };
}
