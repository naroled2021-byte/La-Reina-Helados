import { ORDER_TYPE_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { currency, formatOrderNumber } from "@/lib/format";

// Ancho usado solo para decidir DÓNDE cortar un texto largo en varias líneas (direcciones,
// notas, lista de sabores) — no para alinear ni centrar: eso lo hace el script que imprime,
// midiendo el ancho real de cada línea en la impresora.
const WRAP_WIDTH = 40;

function wrapText(text: string, width: number): string[] {
  const words = text.split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

export type ComandaLine =
  | { type: "divider" }
  | { type: "text"; text: string; right?: string; align?: "center"; big?: boolean };

function text(text: string, opts?: { right?: string; align?: "center"; big?: boolean }): ComandaLine {
  return { type: "text", text, ...opts };
}

const divider: ComandaLine = { type: "divider" };

export type ComandaSettings = {
  businessName: string;
  address: string;
  phone: string;
  ticketHeader: string;
  ticketFooter: string;
};

export type ComandaOrder = {
  channel: string;
  channelNumber: number;
  createdAt: Date;
  type: string;
  customerName: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string | null;
  items: { productName: string; quantity: number; unitPrice: number; flavorNames: string[] }[];
};

/** Mismo contenido que el ticket completo de Mostrador (logo aparte, lo agrega el script que
 *  imprime), con la etiqueta "AUTOSERVICIO" agregada para distinguirlo de un vistazo. Devuelve
 *  líneas con su alineación en vez de texto ya formateado, para que el centrado/alineado se
 *  haga con el ancho real de la impresora, no con una estimación de caracteres. */
export function buildComandaLines(order: ComandaOrder, settings: ComandaSettings): ComandaLine[] {
  const lines: ComandaLine[] = [];

  lines.push(text(settings.businessName, { align: "center", big: true }));
  if (settings.address) for (const l of wrapText(settings.address, WRAP_WIDTH)) lines.push(text(l, { align: "center" }));
  if (settings.phone) lines.push(text(`Tel: ${settings.phone}`, { align: "center" }));
  if (settings.ticketHeader) {
    for (const raw of settings.ticketHeader.split("\n")) {
      for (const l of wrapText(raw, WRAP_WIDTH)) lines.push(text(l, { align: "center" }));
    }
  }

  lines.push(divider);
  lines.push(text("AUTOSERVICIO", { align: "center", big: true }));
  const date = order.createdAt.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  // "Pedido #" en su propia línea grande: si va junto con la hora en la misma línea (las
  // dos en letra grande) no entran y se pisan en papel angosto.
  lines.push(text(`Pedido #${formatOrderNumber(order.channel, order.channelNumber)}`, { big: true }));
  lines.push(text(date));
  lines.push(text(ORDER_TYPE_LABEL[order.type] ?? order.type));
  if (order.customerName) lines.push(text(`Cliente: ${order.customerName}`));
  if (order.deliveryAddress) {
    for (const l of wrapText(`Dirección: ${order.deliveryAddress}`, WRAP_WIDTH)) lines.push(text(l));
  }
  // La línea de "Paga con $X (vuelto $Y)" se separa del resto de las notas para mostrarla
  // grande después del Total (ver más abajo) — es la plata que tiene que tener lista quien
  // entrega, así que conviene que quede pegada al total, no arriba con los demás datos.
  let paymentNoteLine: string | null = null;
  if (order.notes) {
    for (const raw of order.notes.split("\n")) {
      if (raw.startsWith("Paga con")) {
        paymentNoteLine = raw;
        continue;
      }
      for (const l of wrapText(raw, WRAP_WIDTH)) lines.push(text(l));
    }
  }

  lines.push(divider);
  for (const item of order.items) {
    lines.push(
      text(`${item.quantity}x ${item.productName}`, { right: currency.format(item.unitPrice * item.quantity) })
    );
    if (item.flavorNames.length > 0) {
      for (const l of wrapText(item.flavorNames.join(" + "), WRAP_WIDTH - 2)) lines.push(text(`  ${l}`));
    }
  }

  lines.push(divider);
  lines.push(text("Subtotal", { right: currency.format(order.subtotal) }));
  if (order.discount > 0) lines.push(text("Descuento", { right: `-${currency.format(order.discount)}` }));
  if (order.total > order.subtotal - order.discount) {
    lines.push(text("Envío", { right: currency.format(order.total - order.subtotal + order.discount) }));
  }
  lines.push(text("Total", { right: currency.format(order.total), big: true }));
  const paymentLabel = order.paymentMethod ? PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod : "-";
  lines.push(text("Pago", { right: paymentLabel }));

  if (paymentNoteLine) {
    for (const l of wrapText(paymentNoteLine, WRAP_WIDTH - 8)) lines.push(text(l, { big: true }));
  }

  lines.push(divider);
  if (settings.ticketFooter) {
    for (const raw of settings.ticketFooter.split("\n")) {
      for (const l of wrapText(raw, WRAP_WIDTH)) lines.push(text(l, { align: "center" }));
    }
  }

  return lines;
}
