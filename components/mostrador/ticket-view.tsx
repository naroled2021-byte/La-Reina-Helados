"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { currency } from "@/lib/format";
import { ORDER_TYPE_LABEL } from "@/lib/constants";
import { LOGO_PRINT_DATA_URI } from "@/lib/logo-print-data-uri";
import type { CartLine } from "@/components/sales/types";

export type TicketData = {
  number: number;
  createdAt: string;
  items: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethodLabel: string;
  orderType: string;
  customerName: string | null;
  deliveryAddress?: string | null;
  notes?: string | null;
  /** Copias a imprimir para este pedido puntual — si no viene, se usa settings.copies. */
  copies?: number;
};

export type TicketSettings = {
  businessName: string;
  address: string;
  phone: string;
  ticketHeader: string;
  ticketFooter: string;
  paperWidth: string;
  copies: number;
};

const CHAR_WIDTH: Record<string, number> = { "58mm": 19, "80mm": 28 };
const PRINT_WIDTH_MM: Record<string, string> = { "58mm": "38mm", "80mm": "58mm" };
// Margen entre una copia y la siguiente — una impresora lenta puede descartar el segundo
// trabajo si se lo mandamos muy pegado al primero.
const COPY_GAP_MS = 3500;

function centerText(text: string, width: number) {
  if (text.length >= width) return text;
  return " ".repeat(Math.floor((width - text.length) / 2)) + text;
}

/** Centra texto que puede no entrar en una línea: lo envuelve primero y centra cada línea,
 *  para que nunca se pase del ancho imprimible (a diferencia de centerText solo). */
function centeredLines(text: string, width: number): string[] {
  return wrapText(text, width).map((l) => centerText(l, width));
}

/** Arma una línea alineada como recibo de texto plano; si no entra en una línea, la apila en dos. */
function padRow(left: string, right: string, width: number): string[] {
  const gap = width - left.length - right.length;
  if (gap < 1) {
    const safeLeft = left.length > width ? left.slice(0, width) : left;
    return [safeLeft, right.padStart(width)];
  }
  return [left + " ".repeat(gap) + right];
}

/** Envuelve texto libre (ej. lista de sabores) en varias líneas para que ninguna supere el ancho. */
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

/** Como padRow, pero si el nombre no entra junto al precio lo envuelve en varias líneas
 *  completas en vez de truncarlo a la mitad de una palabra. */
function itemRow(left: string, right: string, width: number): string[] {
  if (left.length + 1 + right.length <= width) return padRow(left, right, width);
  return [...wrapText(left, width), right.padStart(width)];
}

function Line({ text, big }: { text: string; big?: boolean }) {
  return <div className={`whitespace-pre font-bold ${big ? "text-[1.3em]" : ""}`}>{text || " "}</div>;
}

function ReceiptBody({
  ticket,
  settings,
  logoSrc,
  copyLabel,
}: {
  ticket: TicketData;
  settings: TicketSettings;
  logoSrc: string;
  /** "COPIA 1/2", etc. — solo se muestra cuando se imprime más de una copia. */
  copyLabel?: string;
}) {
  const width = CHAR_WIDTH[settings.paperWidth] ?? 32;
  const bigWidth = Math.floor(width / 1.3);
  const divider = "-".repeat(width);
  const date = new Date(ticket.createdAt).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto flex flex-col items-center gap-2">
      <div className="size-36 shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" className="size-full object-contain" />
      </div>

      <div className="flex w-full flex-col items-center text-center">
        {centeredLines(settings.businessName, bigWidth).map((l, i) => (
          <Line key={i} text={l} big />
        ))}
        {settings.address &&
          centeredLines(settings.address, width).map((l, i) => <Line key={i} text={l} />)}
        {settings.phone &&
          centeredLines(`Tel: ${settings.phone}`, width).map((l, i) => <Line key={i} text={l} />)}
        {settings.ticketHeader &&
          settings.ticketHeader
            .split("\n")
            .flatMap((l) => centeredLines(l, width))
            .map((l, i) => <Line key={i} text={l} />)}
      </div>

      <div className="flex w-full flex-col">
        <Line text={divider} />
        {padRow(`Pedido #${ticket.number}`, date, width).map((l, i) => (
          <Line key={i} text={l} />
        ))}
        <Line text={ORDER_TYPE_LABEL[ticket.orderType] ?? ticket.orderType} />
        {ticket.customerName && <Line text={`Cliente: ${ticket.customerName}`} />}
        {ticket.deliveryAddress &&
          wrapText(`Dirección: ${ticket.deliveryAddress}`, width).map((l, i) => <Line key={i} text={l} />)}
        {ticket.notes && wrapText(ticket.notes, width).map((l, i) => <Line key={i} text={l} big />)}

        <Line text={divider} />
        {ticket.items.map((line) => (
          <div key={line.key}>
            {itemRow(`${line.quantity}x ${line.productName}`, currency.format(line.unitPrice * line.quantity), width).map(
              (l, i) => (
                <Line key={i} text={l} />
              )
            )}
            {line.flavorNames.length > 0 &&
              wrapText(line.flavorNames.join(" + "), Math.max(width - 2, 1)).map((l, i) => (
                <Line key={i} text={`  ${l}`} />
              ))}
          </div>
        ))}

        <Line text={divider} />
        {padRow("Subtotal", currency.format(ticket.subtotal), width).map((l, i) => (
          <Line key={i} text={l} />
        ))}
        {ticket.discount > 0 &&
          padRow("Descuento", `-${currency.format(ticket.discount)}`, width).map((l, i) => <Line key={i} text={l} />)}
        {ticket.total > ticket.subtotal - ticket.discount &&
          padRow("Envío", currency.format(ticket.total - ticket.subtotal + ticket.discount), width).map((l, i) => (
            <Line key={i} text={l} />
          ))}
        {padRow("Total", currency.format(ticket.total), bigWidth).map((l, i) => (
          <Line key={i} text={l} big />
        ))}
        {padRow("Pago", ticket.paymentMethodLabel, width).map((l, i) => (
          <Line key={i} text={l} />
        ))}

        <Line text={divider} />
      </div>

      <div className="flex w-full flex-col items-center text-center">
        {settings.ticketFooter
          .split("\n")
          .flatMap((l) => centeredLines(l, width))
          .map((l, i) => (
            <Line key={i} text={l} />
          ))}
      </div>

      {copyLabel && (
        <div className="flex w-full flex-col items-center text-center">
          <Line text={divider} />
          {centeredLines(copyLabel, width).map((l, i) => (
            <Line key={i} text={l} big />
          ))}
        </div>
      )}
    </div>
  );
}

export function TicketView({
  ticket,
  settings,
  onClose,
  silent = false,
}: {
  ticket: TicketData | null;
  settings: TicketSettings;
  onClose: () => void;
  /** No muestra el diálogo en pantalla — solo dispara la impresión en segundo plano.
   *  Para imprimir pedidos que llegan solos (autoservicio) sin interrumpir a nadie con un popup. */
  silent?: boolean;
}) {
  const totalCopies = Math.max(1, ticket?.copies ?? settings.copies ?? 2);
  const [printCopyIndex, setPrintCopyIndex] = useState(1);

  useEffect(() => {
    console.log("[ticket-debug] effect fired, ticket:", ticket?.number, "silent:", silent);
    if (!ticket) return;
    let cancelled = false;
    let triggered = false;

    // Cada copia es su propio trabajo de impresión completo (no varias copias apiladas en
    // un mismo trabajo: la que salía "primera dentro del bloque" venía angosta en la
    // impresora real). El número de copia se pinta en el ticket (copyLabel) ANTES de cada
    // window.print(), por eso se espera un par de frames entre setear el estado e imprimir.
    const printCopy = (copy: number) => {
      if (cancelled) return;
      setPrintCopyIndex(copy);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) return;
          console.log(`[ticket-debug] calling window.print() copy ${copy}/${totalCopies} for order`, ticket.number);
          window.print();
          if (copy < totalCopies) {
            setTimeout(() => printCopy(copy + 1), COPY_GAP_MS);
          }
        });
      });
    };

    const triggerPrints = () => {
      if (triggered || cancelled) return;
      triggered = true;
      printCopy(1);
    };

    // El logo va incrustado como datos (data URI), no como referencia a un archivo, así
    // que no depende de una descarga de red — pero igual esperamos a que el navegador
    // termine de decodificarlo a píxeles antes de imprimir, por las dudas.
    async function waitAndPrint() {
      try {
        const onPageImages = Array.from(
          document.querySelectorAll<HTMLImageElement>(`img[src="${LOGO_PRINT_DATA_URI}"]`)
        );
        await Promise.all(onPageImages.map((el) => el.decode().catch(() => {})));
      } catch {
        // si falla la decodificación, igual imprimimos por el fallback
      }
      triggerPrints();
    }

    void waitAndPrint();
    const fallback = setTimeout(triggerPrints, 1500);

    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.number]);

  function printAgain() {
    let copy = 1;
    const next = () => {
      setPrintCopyIndex(copy);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.print();
          copy += 1;
          if (copy <= totalCopies) setTimeout(next, COPY_GAP_MS);
        });
      });
    };
    next();
  }

  return (
    <>
      {!silent && (
        <Dialog open={!!ticket} onOpenChange={(open) => !open && onClose()}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Ticket</DialogTitle>
            </DialogHeader>

            {ticket && (
              <>
                <div className="overflow-x-auto rounded-xl border bg-white p-2">
                  <div className="mx-auto flex w-max flex-col gap-2 p-2 font-mono text-[12px] font-bold leading-tight tracking-tight text-black">
                    <ReceiptBody ticket={ticket} settings={settings} logoSrc="/logo2.png" />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Cerrar
                  </Button>
                  <Button type="button" onClick={printAgain}>
                    <Printer className="size-4" />
                    Imprimir de nuevo
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}

      {ticket &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-ticket-print
            style={{ width: PRINT_WIDTH_MM[settings.paperWidth] ?? PRINT_WIDTH_MM["58mm"] }}
            className="fixed top-0 left-[-9999px] mx-auto flex flex-col gap-2 bg-white p-1 font-mono text-[13px] font-bold leading-tight tracking-tight break-words text-black print:static print:left-auto"
          >
            <style>{`@page { size: ${settings.paperWidth} auto; margin: 2mm; }`}</style>
            {/* Margen en blanco al inicio, por las dudas: en algún momento el contenido
                salía recortado arriba al empezar un trabajo de impresión. */}
            <div style={{ height: "6mm" }} aria-hidden />
            <ReceiptBody
              ticket={ticket}
              settings={settings}
              logoSrc={LOGO_PRINT_DATA_URI}
              copyLabel={totalCopies > 1 ? `COPIA ${printCopyIndex}/${totalCopies}` : undefined}
            />
          </div>,
          document.body
        )}
    </>
  );
}
