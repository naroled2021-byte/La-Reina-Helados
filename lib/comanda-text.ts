import { ORDER_TYPE_LABEL } from "@/lib/constants";
import { formatOrderNumber } from "@/lib/format";

const WIDTH = 32; // ancho seguro en texto plano monoespaciado para 58mm

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

export type ComandaOrder = {
  number: number;
  channel: string;
  channelNumber: number;
  createdAt: Date;
  type: string;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  items: { productName: string; quantity: number; flavorNames: string[] }[];
};

/** Comanda de cocina en texto plano, pensada para imprimir directo por nombre de impresora
 *  (sin pasar por el navegador) — por eso es más simple que el ticket completo: sin logo,
 *  sin desglose de pago, solo lo que necesita quien arma el pedido. */
export function buildComandaText(order: ComandaOrder): string {
  const divider = "=".repeat(WIDTH);
  const thinDivider = "-".repeat(WIDTH);
  const lines: string[] = [];

  lines.push(divider);
  const time = order.createdAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  lines.push(`PEDIDO #${formatOrderNumber(order.channel, order.channelNumber)}  ${time}`);
  lines.push(ORDER_TYPE_LABEL[order.type] ?? order.type);
  if (order.customerName) {
    for (const l of wrapText(order.customerName, WIDTH)) lines.push(l);
  }
  if (order.customerPhone) {
    lines.push(order.customerPhone);
  }
  if (order.deliveryAddress) {
    for (const l of wrapText(order.deliveryAddress, WIDTH)) lines.push(l);
  }
  lines.push(thinDivider);

  for (const item of order.items) {
    lines.push(`${item.quantity}x ${item.productName}`);
    if (item.flavorNames.length > 0) {
      for (const l of wrapText(item.flavorNames.join(", "), WIDTH - 3)) lines.push(`   ${l}`);
    }
  }

  if (order.notes) {
    lines.push(thinDivider);
    for (const raw of order.notes.split("\n")) {
      for (const l of wrapText(raw, WIDTH)) lines.push(l);
    }
  }

  lines.push(divider);
  return lines.join("\r\n") + "\r\n\f";
}
