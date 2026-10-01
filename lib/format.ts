import { ORDER_CHANNEL } from "@/lib/constants";

// Mostrador/Ventas usa 4 dígitos (0001, 0002...) y Autoservicio 3 (001, 002...) — cada canal
// tiene su propio correlativo independiente (ver Order.channelNumber).
export function formatOrderNumber(channel: string, channelNumber: number): string {
  const digits = channel === ORDER_CHANNEL.SELF_SERVICE ? 3 : 4;
  return String(channelNumber).padStart(digits, "0");
}

export const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 100_000) return `$${Math.round(value / 1_000)}K`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `$${Math.round(value)}`;
}
