"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomerCard } from "@/components/customers/customer-card";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { CustomerHistoryDialog } from "@/components/customers/customer-history-dialog";
import type { CustomerRow } from "@/components/customers/types";

export function CustomersClient({ initialCustomers }: { initialCustomers: CustomerRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<CustomerRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initialCustomers;
    return initialCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [initialCustomers, search]);

  function openCreate() {
    setEditingCustomer(null);
    setFormOpen(true);
  }

  function openEdit(customer: CustomerRow) {
    setEditingCustomer(customer);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Nuevo cliente
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center">
          <p className="font-medium">
            {initialCustomers.length === 0 ? "Todavía no cargaste clientes" : "Sin resultados"}
          </p>
          <p className="text-sm text-muted-foreground">
            {initialCustomers.length === 0
              ? "Creá tu primer cliente para empezar a construir tu base."
              : "Probá con otra búsqueda."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} onEdit={openEdit} onHistory={setHistoryCustomer} />
          ))}
        </div>
      )}

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editingCustomer}
        onSaved={() => router.refresh()}
      />
      <CustomerHistoryDialog customer={historyCustomer} onOpenChange={(open) => !open && setHistoryCustomer(null)} />
    </div>
  );
}
