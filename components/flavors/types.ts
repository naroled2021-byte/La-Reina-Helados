export type FlavorRow = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  popular: boolean;
  active: boolean;
  currentStock: number;
  minStock: number;
};
