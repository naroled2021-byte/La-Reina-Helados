export type KanbanOrder = {
  id: string;
  number: number;
  type: string;
  status: string;
  channel: string;
  createdAt: string;
  subtotal: number;
  discount: number;
  total: number;
  tableNumber: string | null;
  deliveryAddress: string | null;
  customerName: string | null;
  notes: string | null;
  itemsSummary: string;
  paymentMethod: string | null;
  orderItems: { productName: string; quantity: number; unitPrice: number; flavorNames: string[] }[];
};
