import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/** El Print Agent no es un usuario humano — se autentica con un token fijo compartido
 *  (PRINT_AGENT_TOKEN), no con el sistema de sesiones/roles existente. */
export function verifyPrintAgentToken(req: NextRequest): boolean {
  const expected = process.env.PRINT_AGENT_TOKEN;
  if (!expected) return false;

  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!provided || provided.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}
