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
import { InventoryItemCard } from "@/components/inventory/inventory-item-card";
import { InventoryItemFormDialog } from "@/components/inventory/inventory-item-form-dialog";
import { StockAdjustDialog } from "@/components/inventory/stock-adjust-dialog";
import { getStockStatus, STOCK_STATUS_LABEL, INVENTORY_ITEM_TYPE_LABEL } from "@/lib/constants";
import type { InventoryItemRow, SupplierOption } from "@/components/inventory/types";

const typeFilterLabel: Record<string, string> = { all: "Todos los tipos", ...INVENTORY_ITEM_TYPE_LABEL };
const stockFilterLabel: Record<string, string> = { all: "Cualquier stock", ...STOCK_STATUS_LABEL };

export function InventoryClient({
  initialItems,
  suppliers: initialSuppliers,
}: {
  initialItems: InventoryItemRow[];
  suppliers: SupplierOption[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemRow | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItemRow | null>(null);

  const typesPresent = useMemo(
    () => Array.from(new Set(initialItems.map((i) => i.type))),
    [initialItems]
  );

  const filtered = useMemo(() => {
    return initialItems.filter((i) => {
      const matchesSearch = i.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesType = typeFilter === "all" || i.type === typeFilter;
      const matchesStock = stockFilter === "all" || getStockStatus(i.currentStock, i.minStock) === stockFilter;
      return matchesSearch && matchesType && matchesStock;
    });
  }, [initialItems, search, typeFilter, stockFilter]);

  function openCreate() {
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: InventoryItemRow) {
    setEditingItem(item);
    setFormOpen(true);
  }

  function openAdjust(item: InventoryItemRow) {
    setAdjustingItem(item);
    setAdjustOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar ítem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Tipo">{(value: string) => typeFilterLabel[value] ?? value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {typesPresent.map((t) => (
                <SelectItem key={t} value={t}>
                  {INVENTORY_ITEM_TYPE_LABEL[t] ?? t}
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
          Nuevo ítem
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center">
          <p className="font-medium">
            {initialItems.length === 0 ? "Todavía no cargaste ítems de stock" : "Sin resultados"}
          </p>
          <p className="text-sm text-muted-foreground">
            {initialItems.length === 0
              ? "Creá tu primer ítem para empezar a controlar el inventario."
              : "Probá con otra búsqueda o filtro."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <InventoryItemCard key={item.id} item={item} onEdit={openEdit} onAdjust={openAdjust} />
          ))}
        </div>
      )}

      <InventoryItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
        suppliers={suppliers}
        onSupplierCreated={(supplier) => setSuppliers((prev) => [...prev, supplier])}
        onSaved={() => router.refresh()}
      />

      <StockAdjustDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        item={adjustingItem}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
