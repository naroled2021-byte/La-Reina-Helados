"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/products/product-card";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import type { CategoryOption, ProductRow } from "@/components/products/types";

export function ProductsClient({
  initialProducts,
  categories: initialCategories,
}: {
  initialProducts: ProductRow[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState(initialCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  const filtered = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [initialProducts, search, categoryFilter]);

  function openCreate() {
    setEditingProduct(null);
    setDialogOpen(true);
  }

  function openEdit(product: ProductRow) {
    setEditingProduct(product);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value ?? "all")}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Categoría">
                {(value: string) =>
                  value === "all" ? "Todas las categorías" : categories.find((c) => c.id === value)?.name ?? "Categoría"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Nuevo producto
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center">
          <p className="font-medium">
            {initialProducts.length === 0 ? "Todavía no cargaste productos" : "Sin resultados"}
          </p>
          <p className="text-sm text-muted-foreground">
            {initialProducts.length === 0
              ? "Creá tu primer producto para empezar a vender."
              : "Probá con otra búsqueda o categoría."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onEdit={openEdit} />
          ))}
        </div>
      )}

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        categories={categories}
        onCategoryCreated={(category) => setCategories((prev) => [...prev, category])}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
