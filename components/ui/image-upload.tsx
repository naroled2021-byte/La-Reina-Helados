"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ImageUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "No se pudo subir la imagen");
        return;
      }
      onChange(data.url);
    } catch {
      toast.error("No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="size-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
            aria-label="Quitar imagen"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-dashed text-muted-foreground">
          <ImagePlus className="size-6" />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading && <Loader2 className="size-4 animate-spin" />}
          {value ? "Cambiar foto" : "Subir foto"}
        </Button>
        <p className="text-xs text-muted-foreground">JPG, PNG o WEBP. Máx 5MB.</p>
      </div>
    </div>
  );
}
