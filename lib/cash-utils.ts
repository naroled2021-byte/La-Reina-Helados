import { CASH_MOVEMENT_TYPE } from "@/lib/constants";

type MovementLike = { type: string; amount: number };

/** Efectivo físico esperado en el cajón: apertura + ventas en efectivo + ingresos - egresos. */
export function computeExpectedCash(openingAmount: number, movements: MovementLike[]): number {
  return movements.reduce((sum, m) => {
    if (m.type === CASH_MOVEMENT_TYPE.SALE_CASH || m.type === CASH_MOVEMENT_TYPE.INCOME) return sum + m.amount;
    if (m.type === CASH_MOVEMENT_TYPE.EXPENSE) return sum - m.amount;
    return sum; // SALE_DIGITAL no es efectivo físico
  }, openingAmount);
}

export function summarizeMovements(movements: MovementLike[]) {
  const totals = { salesCash: 0, salesDigital: 0, income: 0, expense: 0 };
  for (const m of movements) {
    if (m.type === CASH_MOVEMENT_TYPE.SALE_CASH) totals.salesCash += m.amount;
    else if (m.type === CASH_MOVEMENT_TYPE.SALE_DIGITAL) totals.salesDigital += m.amount;
    else if (m.type === CASH_MOVEMENT_TYPE.INCOME) totals.income += m.amount;
    else if (m.type === CASH_MOVEMENT_TYPE.EXPENSE) totals.expense += m.amount;
  }
  return totals;
}
