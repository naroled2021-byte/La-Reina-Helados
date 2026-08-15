export type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string;
  price: number;
  cost: number;
  active: boolean;
  allowsFlavors: boolean;
  maxFlavors: number;
};

export type CategoryOption = { id: string; name: string };
