export type InventoryItemRow = {
  id: string;
  name: string;
  type: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  cost: number;
  price: number | null;
  supplierId: string | null;
  supplierName: string | null;
  active: boolean;
  isFlavor: boolean;
};

export type SupplierOption = { id: string; name: string };
