export const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

/** Fija el huso horario explícitamente (en vez de dejar que toLocaleString use el del
 *  entorno) para que el servidor (UTC) y el navegador del usuario calculen el mismo
 *  texto — si no, React tira un error de hidratación por el desfasaje. */
export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString("es-AR", { timeZone: ARGENTINA_TIME_ZONE });
}

export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 100_000) return `$${Math.round(value / 1_000)}K`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `$${Math.round(value)}`;
}
