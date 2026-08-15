"use client";

import { useMemo, useState } from "react";
import { IceCreamCone, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { currency } from "@/lib/format";
import type { SaleProduct } from "@/components/sales/types";

export function ProductPickerGrid({
  products,
  onPick,
}: {
  products: SaleProduct[];
  onPick: (product: SaleProduct) => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) map.set(p.categoryId, p.categoryName);
    return Array.from(map.entries());
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategoryFilter("all")}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            categoryFilter === "all" ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
        >
          Todas
        </button>
        {categories.map(([id, name]) => (
          <button
            key={id}
            type="button"
            onClick={() => setCategoryFilter(id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              categoryFilter === id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            {name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed py-12 text-center">
          <p className="font-medium">Sin resultados</p>
          <p className="text-sm text-muted-foreground">Probá con otra búsqueda o categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onPick(product)}
              className="group flex flex-col gap-2 rounded-2xl border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary"
            >
              <div className="flex size-12 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="size-full object-cover" />
                ) : (
                  <IceCreamCone className="size-5" strokeWidth={1.75} />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-tight">{product.name}</p>
                <p className="text-xs text-muted-foreground">{currency.format(product.price)}</p>
              </div>
              <div className="mt-auto flex items-center justify-end">
                <span className="flex size-7 items-center justify-center rounded-lg bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground">
                  <Plus className="size-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
