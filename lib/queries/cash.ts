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

/** Detalle completo de una caja puntual (abierta o cerrada) — lo usa el reporte de Caja
 *  para mostrar el desglose completo al hacer click en un cierre del historial. */
export async function getCashRegisterDetail(id: string) {
  return db.cashRegister.findUnique({
    where: { id },
    include: {
      movements: { include: { user: true }, orderBy: { createdAt: "desc" } },
      openedBy: true,
      closedBy: true,
    },
  });
}
