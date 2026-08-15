export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  points: number;
  totalSpent: number;
  lastPurchaseAt: string | null;
  orderCount: number;
};

export type CustomerOrderRow = {
  id: string;
  number: number;
  createdAt: string;
  status: string;
  total: number;
  itemsSummary: string;
};
