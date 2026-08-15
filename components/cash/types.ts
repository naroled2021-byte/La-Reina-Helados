export type CashMovementRow = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  userName: string | null;
  createdAt: string;
};

export type OpenRegister = {
  id: string;
  openingAmount: number;
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
