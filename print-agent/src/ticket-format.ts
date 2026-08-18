import path from "node:path";
import { EscPosBuilder } from "./escpos";
import { ROOT_DIR, env } from "./config";

export type TicketItem = { productName: string; quantity: number; unitPrice: number; flavorNames: string[] };
export type Ticket = {
  number: number;
  createdAt: string;
  items: TicketItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethodLabel: string;
  orderType: string;
  customerName: string | null;
  deliveryAddress: string | null;
};
export type TicketSettings = {
  businessName: string;
  address: string;
  phone: string;
  ticketHeader: string;
  ticketFooter: string;
  paperWidth: string;
};

// Mismos anchos que components/mostrador/ticket-view.tsx en la app web, para que el
// ticket impreso por el Agent luzca igual al que ya se venía imprimiendo desde el navegador.
const CHAR_WIDTH: Record<string, number> = { "58mm": 19, "80mm": 28 };
const ORDER_TYPE_LABEL: Record<string, string> = { DINE_IN: "Local", TAKEAWAY: "Retirar", DELIVERY: "Delivery" };
const LOGO_PATH = path.join(ROOT_DIR, "assets", "logo-print.png");

const currency = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

function centerText(text: string, width: number): string {
  if (text.length >= width) return text;
  return " ".repeat(Math.floor((width - text.length) / 2)) + text;
}

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

function centeredLines(text: string, width: number): string[] {
  return wrapText(text, width).map((l) => centerText(l, width));
}

function padRow(left: string, right: string, width: number): string[] {
  const gap = width - left.length - right.length;
  if (gap < 1) {
    const safeLeft = left.length > width ? left.slice(0, width) : left;
    return [safeLeft, right.padStart(width)];
  }
  return [left + " ".repeat(gap) + right];
}

function itemRow(left: string, right: string, width: number): string[] {
  if (left.length + 1 + right.length <= width) return padRow(left, right, width);
  return [...wrapText(left, width), right.padStart(width)];
}

/** Línea separadora entre las dos copias, tipo "--- CORTAR ACÁ ----", del mismo ancho que
 *  el resto del ticket — esta impresora no corta sola, así que es la señal visual de dónde
 *  arrancar el papel a mano. */
function cutHereLine(width: number): string {
  // Sin tilde a propósito: la "Á" hace que esta impresora entre en modo de
  // caracteres de doble byte y corrompe toda la línea (probado en hardware real).
  const label = " CORTAR ACA ";
  if (label.length >= width) return label.trim();
  const dashes = width - label.length;
  const left = Math.floor(dashes / 2);
  const right = dashes - left;
  return "-".repeat(left) + label + "-".repeat(right);
}

/** Arma el contenido de UNA copia del ticket (sin el corte final — eso lo decide quien
 *  llama, porque entre dos copias va un separador en vez de un corte). Mismo layout que ya
 *  usa la app web (components/mostrador/ticket-view.tsx) para que ambos impresos luzcan
 *  iguales. */
function appendReceiptBody(b: EscPosBuilder, ticket: Ticket, settings: TicketSettings): void {
  const width = CHAR_WIDTH[settings.paperWidth] ?? 19;
  const bigWidth = Math.floor(width / 1.3);
  const divider = "-".repeat(width);
  const date = new Date(ticket.createdAt).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  b.align("center");
  if (env.printLogo) {
    try {
      b.image(LOGO_PATH);
    } catch {
      // si falta el logo, seguimos igual — mejor imprimir el ticket sin logo que no imprimir nada
    }
    b.line();
  }

  b.big(true);
  for (const l of centeredLines(settings.businessName, bigWidth)) b.line(l);
  b.big(false);
  if (settings.address) for (const l of centeredLines(settings.address, width)) b.line(l);
  if (settings.phone) for (const l of centeredLines(`Tel: ${settings.phone}`, width)) b.line(l);
  if (settings.ticketHeader) {
    for (const raw of settings.ticketHeader.split("\n")) {
      for (const l of centeredLines(raw, width)) b.line(l);
    }
  }

  b.align("left");
  b.line(divider);
  for (const l of padRow(`Pedido #${ticket.number}`, date, width)) b.line(l);
  b.line(ORDER_TYPE_LABEL[ticket.orderType] ?? ticket.orderType);
  if (ticket.customerName) b.line(`Cliente: ${ticket.customerName}`);
  if (ticket.deliveryAddress) {
    for (const l of wrapText(`Dirección: ${ticket.deliveryAddress}`, width)) b.line(l);
  }

  b.line(divider);
  for (const item of ticket.items) {
    for (const l of itemRow(`${item.quantity}x ${item.productName}`, currency(item.unitPrice * item.quantity), width)) {
      b.line(l);
    }
    if (item.flavorNames.length > 0) {
      for (const l of wrapText(item.flavorNames.join(" + "), Math.max(width - 2, 1))) b.line(`  ${l}`);
    }
  }

  b.line(divider);
  for (const l of padRow("Subtotal", currency(ticket.subtotal), width)) b.line(l);
  if (ticket.discount > 0) {
    for (const l of padRow("Descuento", `-${currency(ticket.discount)}`, width)) b.line(l);
  }
  b.big(true);
  for (const l of padRow("Total", currency(ticket.total), bigWidth)) b.line(l);
  b.big(false);
  for (const l of padRow("Pago", ticket.paymentMethodLabel, width)) b.line(l);
  b.line(divider);

  b.align("center");
  for (const raw of settings.ticketFooter.split("\n")) {
    for (const l of centeredLines(raw, width)) b.line(l);
  }
}

/** Arma el trabajo de impresión completo: dos copias del ticket (una para el local, una
 *  para el cliente), con un separador bien visible entre las dos — esta impresora no corta
 *  el papel sola, así que la línea de puntos es la que le indica a quien la usa dónde
 *  arrancar a mano. */
export function buildTicketBuffer(ticket: Ticket, settings: TicketSettings, copies = 2): Buffer {
  const width = CHAR_WIDTH[settings.paperWidth] ?? 19;
  const b = new EscPosBuilder();

  for (let i = 0; i < copies; i++) {
    appendReceiptBody(b, ticket, settings);
    b.feed(2);
    if (i < copies - 1) {
      b.align("center");
      b.line(cutHereLine(width));
      b.feed(2);
    }
  }

  b.cut();
  return b.build();
}
