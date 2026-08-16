import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPrintAgentToken } from "@/lib/print-agent-auth";

export async function POST(req: NextRequest) {
  if (!verifyPrintAgentToken(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await db.setting.upsert({
    where: { key: "printagent.lastHeartbeat" },
    create: { key: "printagent.lastHeartbeat", value: new Date().toISOString(), group: "printagent" },
    update: { value: new Date().toISOString() },
  });

  return NextResponse.json({ ok: true });
}
