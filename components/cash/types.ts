export type CashMovementRow = {
  id: string;
  type: string;
  amount: number;
  paymentMethod: string | null;
  description: string | null;
  userName: string | null;
  createdAt: string;
};

export type OpenRegister = {
  id: string;
  openingAmount: number;
  openingAmounts: Record<string, number>;
  openedAt: string;
  openedByName: string;
  movements: CashMovementRow[];
};

export type ClosedRegister = {
  id: string;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  closingAmountExpected: number | null;
  closingAmountDeclared: number | null;
  difference: number | null;
  openedByName: string;
  closedByName: string | null;
};

export type CashPaymentMethod = { key: string; label: string };
