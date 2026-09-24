"use client";

import { useState } from "react";
import { Check, IceCreamCone, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { currency } from "@/lib/format";
import type { SaleFlavor } from "@/components/sales/types";
import type { ProductRow } from "@/components/products/types";

export function IceCreamOrderPanel({
  formats,
  flavors,
  onAdd,
}: {
  formats: ProductRow[];
  flavors: SaleFlavor[];
  onAdd: (format: ProductRow, flavorIds: string[]) => void;
}) {
  const [formatId, setFormatId] = useState(formats[0]?.id ?? "");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const format = formats.find((f) => f.id === formatId) ?? formats[0];
  const max = format?.maxFlavors ?? 0;

  const filteredFlavors = flavors.filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase()));

  function selectFormat(id: string) {
    const next = formats.find((f) => f.id === id);
    setFormatId(id);
    setSelected([]);
    // Los paquetes no tienen gustos para elegir: al tocarlos ya está todo decidido,
    // así que se cargan directo al pedido sin pasos extra.
    if (next && next.maxFlavors === 0) {
      onAdd(next, []);
    }
  }

  function toggleFlavor(id: string) {
    if (selected.includes(id)) {
      setSelected(selected.filter((f) => f !== id));
      return;
    }
    if (selected.length >= max) return;

    const next = [...selected, id];
    // Al completar la cantidad de gustos permitida, se carga directo al pedido.
    if (format && next.length >= max) {
      onAdd(format, next);
      setSelected([]);
    } else {
      setSelected(next);
    }
  }

  function handleAdd() {
    if (!format) return;
    onAdd(format, selected);
    setSelected([]);
  }

  if (!format) {
    return (
      <p className="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">
        No hay formatos configurados todavía.
      </p>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 lg:flex-row">
      <div className="flex shrink-0 flex-col gap-2 lg:w-52">
        {formats.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => selectFormat(f.id)}
            className={cn(
              "flex w-full flex-col items-start gap-0.5 rounded-2xl border px-4 py-3 text-left transition-colors",
              f.id === formatId ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card hover:bg-muted"
            )}
          >
            <span className="text-sm font-medium">{f.name}</span>
            <span className={cn("text-xs", f.id === formatId ? "text-primary-foreground/85" : "text-muted-foreground")}>
              {currency.format(f.price)}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">
            {format.name} · <span className="text-primary">{currency.format(format.price)}</span>
          </h2>
          {max > 0 && (
            <p className="text-sm text-muted-foreground">
              Elegí hasta {max} gusto{max > 1 ? "s" : ""} ({selected.length}/{max})
            </p>
          )}
        </div>

        {max === 0 ? (
          <p className="flex min-h-32 flex-1 items-center justify-center rounded-2xl border border-dashed text-center text-sm text-muted-foreground">
            Este formato no lleva selección de gustos.
          </p>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar sabor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-2xl pl-9"
              />
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 xl:grid-cols-5">
              {filteredFlavors.map((flavor) => {
                const isSelected = selected.includes(flavor.id);
                return (
                  <button
                    key={flavor.id}
                    type="button"
                    onClick={() => toggleFlavor(flavor.id)}
                    className={cn(
                      "group relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border text-center transition-colors",
                      isSelected ? "border-primary ring-2 ring-primary" : "hover:border-primary"
                    )}
                  >
                    {flavor.imageUrl ? (
                      <div className="relative size-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={flavor.imageUrl} alt="" className="size-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 pt-4 pb-1.5">
                          <span className="line-clamp-2 text-xs font-medium leading-tight text-white">
                            {flavor.name}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-primary/15 to-accent/25 p-2">
                        <IceCreamCone className="size-7 text-primary" strokeWidth={1.5} />
                        <span className="line-clamp-2 text-xs font-medium leading-tight">{flavor.name}</span>
                      </div>
                    )}
                    {flavor.popular && !isSelected && (
                      <Star className="absolute top-1.5 right-1.5 size-3.5 fill-amber-400 text-amber-400" />
                    )}
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {max > 0 && (
          <Button size="lg" onClick={handleAdd} className="mt-auto self-start">
            Agregar {format.name} · {currency.format(format.price)}
          </Button>
        )}
      </div>
    </div>
  );
}
