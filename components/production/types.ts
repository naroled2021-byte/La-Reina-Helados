import type { StockStatus } from "@/lib/constants";

export type Suggestion = {
  flavorId: string;
  flavorName: string;
  currentStock: number;
  minStock: number;
  suggested: number;
  status: StockStatus;
};

export type FlavorOption = { id: string; name: string };

export type ProductionItemRow = {
  id: string;
  flavorId: string;
  flavorName: string;
  quantityPlanned: number;
  quantityProduced: number;
  waste: number;
  currentStock: number;
  recorded: boolean;
};

export type ProductionSession = {
  id: string;
  status: string;
  createdAt: string;
  createdByName: string | null;
  items: ProductionItemRow[];
};
