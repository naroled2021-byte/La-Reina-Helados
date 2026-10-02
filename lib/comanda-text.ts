import { ORDER_TYPE_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { currency, formatOrderNumber } from "@/lib/format";

const WIDTH = 32; // ancho seguro en texto plano monoespaciado para 58mm

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

/** Mismo formato que el ticket completo de Mostrador (logo aparte, lo pone el script que
 *  imprime), para que el de Autoservicio se vea igual — con la etiqueta "Autoservicio"
 *  agregada para distinguirlo apenas se mira. */
export function buildComandaText(order: ComandaOrder, settings: ComandaSettings): string {
  const divider = "-".repeat(WIDTH);
  const lines: string[] = [];

  for (const l of centeredLines(settings.businessName, WIDTH)) lines.push(l);
  if (settings.address) for (const l of centeredLines(settings.address, WIDTH)) lines.push(l);
  if (settings.phone) for (const l of centeredLines(`Tel: ${settings.phone}`, WIDTH)) lines.push(l);
  if (settings.ticketHeader) {
    for (const raw of settings.ticketHeader.split("\n")) {
      for (const l of centeredLines(raw, WIDTH)) lines.push(l);
    }
  }

  lines.push(divider);
  for (const l of centeredLines("AUTOSERVICIO", WIDTH)) lines.push(l);
  const date = order.createdAt.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  for (const l of padRow(`Pedido #${formatOrderNumber(order.channel, order.channelNumber)}`, date, WIDTH)) lines.push(l);
  lines.push(ORDER_TYPE_LABEL[order.type] ?? order.type);
  if (order.customerName) lines.push(`Cliente: ${order.customerName}`);
  if (order.deliveryAddress) {
    for (const l of wrapText(`Dirección: ${order.deliveryAddress}`, WIDTH)) lines.push(l);
  }
  if (order.notes) {
    for (const raw of order.notes.split("\n")) {
      for (const l of wrapText(raw, WIDTH)) lines.push(l);
    }
  }

  lines.push(divider);
  for (const item of order.items) {
    for (const l of itemRow(`${item.quantity}x ${item.productName}`, currency.format(item.unitPrice * item.quantity), WIDTH)) {
      lines.push(l);
    }
    if (item.flavorNames.length > 0) {
      for (const l of wrapText(item.flavorNames.join(" + "), Math.max(WIDTH - 2, 1))) lines.push(`  ${l}`);
    }
  }

  lines.push(divider);
  for (const l of padRow("Subtotal", currency.format(order.subtotal), WIDTH)) lines.push(l);
  if (order.discount > 0) {
    for (const l of padRow("Descuento", `-${currency.format(order.discount)}`, WIDTH)) lines.push(l);
  }
  if (order.total > order.subtotal - order.discount) {
    for (const l of padRow("Envío", currency.format(order.total - order.subtotal + order.discount), WIDTH)) lines.push(l);
  }
  for (const l of padRow("Total", currency.format(order.total), WIDTH)) lines.push(l);
  const paymentLabel = order.paymentMethod ? PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod : "-";
  for (const l of padRow("Pago", paymentLabel, WIDTH)) lines.push(l);

  lines.push(divider);
  if (settings.ticketFooter) {
    for (const raw of settings.ticketFooter.split("\n")) {
      for (const l of centeredLines(raw, WIDTH)) lines.push(l);
    }
  }

  return lines.join("\r\n") + "\r\n\f";
}
