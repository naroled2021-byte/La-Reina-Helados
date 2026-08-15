"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateThemeSettings } from "@/lib/actions/settings-actions";
import { DEFAULT_THEME } from "@/lib/queries/settings";

const fields = [
  { key: "primaryColor" as const, label: "Color primario" },
  { key: "secondaryColor" as const, label: "Color secundario" },
  { key: "accentColor" as const, label: "Color de acento" },
];

export function AppearanceTab({ settingsMap }: { settingsMap: Record<string, string> }) {
  const router = useRouter();
  const [form, setForm] = useState({
    primaryColor: settingsMap["theme.primaryColor"] || DEFAULT_THEME.primaryColor,
    secondaryColor: settingsMap["theme.secondaryColor"] || DEFAULT_THEME.secondaryColor,
    accentColor: settingsMap["theme.accentColor"] || DEFAULT_THEME.accentColor,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateThemeSettings(form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Colores actualizados");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      {fields.map((f) => (
        <div key={f.key} className="flex flex-col gap-1.5">
          <Label htmlFor={f.key}>{f.label}</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form[f.key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="size-9 shrink-0 cursor-pointer rounded-lg border"
              aria-label={f.label}
            />
            <Input
              id={f.key}
              value={form[f.key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="font-mono uppercase"
            />
          </div>
        </div>
      ))}

      <div className="flex items-center gap-2 rounded-2xl border p-3">
        <span className="text-xs text-muted-foreground">Vista previa:</span>
        <span className="rounded-full px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: form.primaryColor }}>
          Primario
        </span>
        <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: form.secondaryColor }}>
          Secundario
        </span>
        <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: form.accentColor }}>
          Acento
        </span>
      </div>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Guardar
      </Button>
    </form>
  );
}
