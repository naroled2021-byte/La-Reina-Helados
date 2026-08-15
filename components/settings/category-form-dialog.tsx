"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateCategory } from "@/lib/actions/product-actions";
import type { CategoryRow } from "@/components/settings/types";

export function CategoryFormDialog({
  category,
  onOpenChange,
}: {
  category: CategoryRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!category} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {category && <CategoryForm key={category.id} category={category} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({
  category,
  onOpenChange,
}: {
  category: CategoryRow;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [order, setOrder] = useState(String(category.order));
  const [active, setActive] = useState(category.active);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateCategory(category.id, { name, order: order as never, active });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Categoría actualizada");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar categoría</DialogTitle>
        <DialogDescription>Nombre, orden y estado de la categoría.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="order">Orden</Label>
          <Input id="order" type="number" min="0" step="1" value={order} onChange={(e) => setOrder(e.target.value)} />
        </div>
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <Label htmlFor="active">Activa</Label>
          <Switch id="active" checked={active} onCheckedChange={setActive} />
        </div>

        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
