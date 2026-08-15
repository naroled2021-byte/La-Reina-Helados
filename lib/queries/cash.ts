import { db } from "@/lib/db";

export async function getCashPageData() {
  const [openRegister, closedRegisters] = await Promise.all([
    db.cashRegister.findFirst({
      where: { status: "OPEN" },
      include: {
        movements: { include: { user: true }, orderBy: { createdAt: "desc" } },
        openedBy: true,
      },
      orderBy: { openedAt: "desc" },
    }),
    db.cashRegister.findMany({
      where: { status: "CLOSED" },
      include: { openedBy: true, closedBy: true },
      orderBy: { closedAt: "desc" },
      take: 20,
    }),
  ]);

  return { openRegister, closedRegisters };
}
