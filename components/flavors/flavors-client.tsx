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
import { FlavorCard } from "@/components/flavors/flavor-card";
import { FlavorFormDialog } from "@/components/flavors/flavor-form-dialog";
import { getStockStatus, STOCK_STATUS_LABEL, FLAVOR_CATEGORY_LABEL } from "@/lib/constants";
import { flavorCategoryValues } from "@/lib/validations/flavor";
import type { FlavorRow } from "@/components/flavors/types";

const categoryFilterLabel: Record<string, string> = { all: "Todas las categorías", ...FLAVOR_CATEGORY_LABEL };
const stockFilterLabel: Record<string, string> = { all: "Cualquier stock", ...STOCK_STATUS_LABEL };

export function FlavorsClient({ initialFlavors }: { initialFlavors: FlavorRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState<FlavorRow | null>(null);

  const filtered = useMemo(() => {
    return initialFlavors.filter((f) => {
      const matchesSearch = f.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesCategory = categoryFilter === "all" || f.category === categoryFilter;
      const matchesStock = stockFilter === "all" || getStockStatus(f.currentStock, f.minStock) === stockFilter;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [initialFlavors, search, categoryFilter, stockFilter]);

  function openCreate() {
    setEditingFlavor(null);
    setDialogOpen(true);
  }

  function openEdit(flavor: FlavorRow) {
    setEditingFlavor(flavor);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar sabor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Categoría">
                {(value: string) => categoryFilterLabel[value] ?? value}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {flavorCategoryValues.map((c) => (
                <SelectItem key={c} value={c}>
                  {FLAVOR_CATEGORY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={(v) => setStockFilter(v ?? "all")}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Stock">{(value: string) => stockFilterLabel[value] ?? value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier stock</SelectItem>
              {Object.entries(STOCK_STATUS_LABEL).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Nuevo sabor
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center">
          <p className="font-medium">
            {initialFlavors.length === 0 ? "Todavía no cargaste sabores" : "Sin resultados"}
          </p>
          <p className="text-sm text-muted-foreground">
            {initialFlavors.length === 0
              ? "Creá tu primer sabor para empezar a ofrecerlo en los productos."
              : "Probá con otra búsqueda o filtro."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((flavor) => (
            <FlavorCard key={flavor.id} flavor={flavor} onEdit={openEdit} />
          ))}
        </div>
      )}

      <FlavorFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        flavor={editingFlavor}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
