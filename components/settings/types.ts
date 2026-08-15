export type PaymentMethodRow = { id: string; key: string; label: string; enabled: boolean };

export type CategoryRow = { id: string; name: string; order: number; active: boolean };

export type PromotionRow = {
  id: string;
  name: string;
  type: string;
  value: number | null;
  minQuantity: number | null;
  daysOfWeek: string | null;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
};
