export type SaleProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  categoryId: string;
  categoryName: string;
  allowsFlavors: boolean;
  maxFlavors: number;
};

export type SaleFlavor = {
  id: string;
  name: string;
  popular: boolean;
  imageUrl: string | null;
};

export type SalePaymentMethod = { key: string; label: string };
export type SaleCustomer = { id: string; name: string; phone: string | null };

export type CartLine = {
  key: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  flavorIds: string[];
  flavorNames: string[];
};

export type TodaySale = {
  id: string;
  number: number;
  createdAt: string;
  total: number;
  status: string;
  paymentMethod: string | null;
  customerName: string | null;
  itemsSummary: string;
};
