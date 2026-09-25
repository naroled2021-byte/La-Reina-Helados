// "Hoy" en todo el sistema tiene que ser el día calendario de Argentina, no el del
// servidor (Vercel corre en UTC) — si no, cualquier pedido después de las 21:00 (hora
// Argentina, cuando ya es medianoche UTC) queda mal clasificado como "de mañana".
const AR_TIME_ZONE = "America/Argentina/Buenos_Aires";
// Argentina no usa horario de verano desde 2009: offset fijo UTC-3, así que esto no
// necesita recalcularse según la fecha.
const AR_UTC_OFFSET_HOURS = 3;

function argentinaDateKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: AR_TIME_ZONE }).format(d); // "YYYY-MM-DD"
}

/** Medianoche del día de Argentina que contiene `d`, como instante UTC real. */
export function startOfDayAR(d: Date = new Date()): Date {
  const offset = String(AR_UTC_OFFSET_HOURS).padStart(2, "0");
  return new Date(`${argentinaDateKey(d)}T${offset}:00:00.000Z`);
}

/** Último instante del día de Argentina que contiene `d`. */
export function endOfDayAR(d: Date = new Date()): Date {
  return new Date(startOfDayAR(d).getTime() + 24 * 60 * 60 * 1000 - 1);
}
