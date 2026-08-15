import { randomUUID } from "node:crypto";
import path from "node:path";
import { put } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.user.permissions.includes("products.manage")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "La imagen no puede pesar más de 5MB" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : ".jpg";
  const filename = `${randomUUID()}${safeExt}`;

  const blob = await put(`uploads/${filename}`, file, { access: "public" });

  return NextResponse.json({ url: blob.url });
}
