"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth-helpers";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function createTestPrintJob(): Promise<ActionResult> {
  await requirePermission("settings.manage");

  await db.printJob.create({ data: { isTest: true } });

  revalidatePath("/admin/impresion");
  return { ok: true, data: undefined };
}
