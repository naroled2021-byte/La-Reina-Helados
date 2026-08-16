import { db } from "@/lib/db";

const AGENT_ONLINE_THRESHOLD_MS = 20_000;

export async function getPrintAgentPageData() {
  const [heartbeatSetting, jobs, printedCount] = await Promise.all([
    db.setting.findUnique({ where: { key: "printagent.lastHeartbeat" } }),
    db.printJob.findMany({
      include: { order: { select: { number: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.printJob.count({ where: { status: "PRINTED" } }),
  ]);

  const lastHeartbeat = heartbeatSetting ? new Date(heartbeatSetting.value) : null;
  const online = lastHeartbeat ? Date.now() - lastHeartbeat.getTime() < AGENT_ONLINE_THRESHOLD_MS : false;

  return { online, lastHeartbeat, jobs, printedCount };
}
