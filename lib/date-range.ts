import { startOfDayAR, endOfDayAR } from "@/lib/date-ar";

export type DateRangePreset = "today" | "yesterday" | "week" | "month" | "year" | "custom";

export type DateRange = { from: Date; to: Date };

const startOfDay = startOfDayAR;
const endOfDay = endOfDayAR;

export function getRangeForPreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "week": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case "month":
      return { from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: endOfDay(now) };
    case "year":
      return { from: startOfDay(new Date(now.getFullYear(), 0, 1)), to: endOfDay(now) };
    default:
      return { from: startOfDay(now), to: endOfDay(now) };
  }
}

export const DATE_RANGE_PRESET_LABEL: Record<DateRangePreset, string> = {
  today: "Hoy",
  yesterday: "Ayer",
  week: "Semana",
  month: "Mes",
  year: "Año",
  custom: "Personalizado",
};
