import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPrintAgentToken } from "@/lib/print-agent-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyPrintAgentToken(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (status !== "PRINTED" && status !== "ERROR") {
    return NextResponse.json({ error: "status inválido" }, { status: 400 });
  }

  const job = await db.printJob.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Trabajo no encontrado" }, { status: 404 });

  await db.printJob.update({
    where: { id },
    data: {
      status,
      attempts: { increment: 1 },
      lastError: status === "ERROR" ? String(body?.error ?? "Error desconocido").slice(0, 500) : null,
      printedAt: status === "PRINTED" ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true });
}
