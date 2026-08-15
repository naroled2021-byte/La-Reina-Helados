"use client";

import { useMemo, useState } from "react";
import { IceCreamCone, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { currency } from "@/lib/format";
import { NewArticleDialog } from "@/components/mostrador/new-article-dialog";
import type { SaleProduct } from "@/components/sales/types";

export function TileGrid({
  products,
  onPick,
}: {
  products: SaleProduct[];
  onPick: (product: SaleProduct) => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newArticleOpen, setNewArticleOpen] = useState(false);

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
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Quiero vender..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 rounded-2xl pl-9 text-base"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategoryFilter("all")}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
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
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              categoryFilter === id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            {name}
          </button>
        ))}
      </div>

      {filtered.length === 0 && search.trim() ? (
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed py-12 text-center">
          <p className="font-medium">Sin resultados</p>
          <p className="text-sm text-muted-foreground">Probá con otra búsqueda o categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {filtered.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onPick(product)}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border bg-card p-2 text-center shadow-sm transition-colors active:border-primary active:bg-primary/5"
            >
              <div className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="size-full object-cover" />
                ) : (
                  <IceCreamCone className="size-5" strokeWidth={1.75} />
                )}
              </div>
              <p className="line-clamp-2 text-xs font-medium leading-tight">{product.name}</p>
              <p className="text-[11px] font-semibold text-primary">{currency.format(product.price)}</p>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setNewArticleOpen(true)}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-2 text-center text-primary transition-colors active:bg-primary/10"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/15">
              <Plus className="size-5" />
            </span>
            <p className="text-xs font-semibold leading-tight">Nuevo artículo</p>
          </button>
        </div>
      )}

      <NewArticleDialog open={newArticleOpen} onOpenChange={setNewArticleOpen} />
    </div>
  );
}
