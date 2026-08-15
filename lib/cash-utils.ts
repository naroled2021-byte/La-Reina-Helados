import { CASH_MOVEMENT_TYPE, PAYMENT_METHOD } from "@/lib/constants";

type MovementLike = { type: string; amount: number };
type MovementWithMethod = MovementLike & { paymentMethod: string | null };
type AmountsByMethod = Record<string, number>;

/** Efectivo físico esperado en el cajón: apertura + ventas en efectivo + ingresos - egresos. */
export function computeExpectedCash(openingAmount: number, movements: MovementLike[]): number {
  return movements.reduce((sum, m) => {
    if (m.type === CASH_MOVEMENT_TYPE.SALE_CASH || m.type === CASH_MOVEMENT_TYPE.INCOME) return sum + m.amount;
    if (m.type === CASH_MOVEMENT_TYPE.EXPENSE) return sum - m.amount;
    return sum; // SALE_DIGITAL no es efectivo físico
  }, openingAmount);
}

/** Igual que computeExpectedCash pero desglosado por método de pago real. Los ingresos/egresos
 *  manuales no tienen método (se cargan a mano) y siempre se imputan a Efectivo, igual que ya
 *  hace computeExpectedCash con el efectivo físico. */
export function computeExpectedByMethod(
  openingAmounts: AmountsByMethod,
  movements: MovementWithMethod[]
): AmountsByMethod {
  const result: AmountsByMethod = { ...openingAmounts };
  const add = (key: string, delta: number) => {
    result[key] = (result[key] ?? 0) + delta;
  };

  for (const m of movements) {
    if (m.type === CASH_MOVEMENT_TYPE.INCOME) add(PAYMENT_METHOD.CASH, m.amount);
    else if (m.type === CASH_MOVEMENT_TYPE.EXPENSE) add(PAYMENT_METHOD.CASH, -m.amount);
    else if (m.type === CASH_MOVEMENT_TYPE.SALE_CASH || m.type === CASH_MOVEMENT_TYPE.SALE_DIGITAL) {
      add(m.paymentMethod ?? PAYMENT_METHOD.CASH, m.amount);
    }
  }

  return result;
}

export function sumAmounts(amounts: AmountsByMethod): number {
  return Object.values(amounts).reduce((sum, v) => sum + v, 0);
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
