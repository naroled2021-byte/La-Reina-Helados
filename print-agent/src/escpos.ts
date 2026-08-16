import { readFileSync } from "node:fs";
import { PNG } from "pngjs";

const ESC = 0x1b;
const GS = 0x1d;

/** Arma el buffer de bytes ESC/POS de un ticket. Pensado para impresoras térmicas
 *  genéricas de 58/80mm (como la XP-58) — comandos estándar, sin extensiones de marca. */
export class EscPosBuilder {
  private chunks: Buffer[] = [];

  constructor() {
    this.chunks.push(Buffer.from([ESC, 0x40])); // ESC @ — inicializar
  }

  align(mode: "left" | "center" | "right"): this {
    const n = mode === "center" ? 1 : mode === "right" ? 2 : 0;
    this.chunks.push(Buffer.from([ESC, 0x61, n]));
    return this;
  }

  bold(on: boolean): this {
    this.chunks.push(Buffer.from([ESC, 0x45, on ? 1 : 0]));
    return this;
  }

  /** Texto normal o doble tamaño (para el nombre del negocio / total). */
  big(on: boolean): this {
    this.chunks.push(Buffer.from([GS, 0x21, on ? 0x11 : 0x00]));
    return this;
  }

  line(text: string = ""): this {
    this.chunks.push(Buffer.from(text + "\n", "latin1"));
    return this;
  }

  feed(lines: number = 1): this {
    this.chunks.push(Buffer.from([ESC, 0x64, lines]));
    return this;
  }

  cut(): this {
    this.chunks.push(Buffer.from([GS, 0x56, 0x42, 0x00])); // corte parcial con avance
    return this;
  }

  /** Imprime un PNG en blanco y negro (ya pensado para térmica, sin escala de grises) como
   *  imagen rasterizada ESC/POS (GS v 0). */
  image(pngPath: string): this {
    const png = PNG.sync.read(readFileSync(pngPath));
    const widthBytes = Math.ceil(png.width / 8);
    const raster = Buffer.alloc(widthBytes * png.height, 0);

    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        const idx = (png.width * y + x) << 2;
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];
        const a = png.data[idx + 3];
        const isDark = a > 128 && (r + g + b) / 3 < 128;
        if (isDark) {
          const byteIndex = y * widthBytes + (x >> 3);
          raster[byteIndex] |= 0x80 >> x % 8;
        }
      }
    }

    const xL = widthBytes & 0xff;
    const xH = (widthBytes >> 8) & 0xff;
    const yL = png.height & 0xff;
    const yH = (png.height >> 8) & 0xff;
    this.chunks.push(Buffer.from([GS, 0x76, 0x30, 0x00, xL, xH, yL, yH]));
    this.chunks.push(raster);
    return this;
  }

  build(): Buffer {
    return Buffer.concat(this.chunks);
  }
}
