"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCategory, createProduct, updateProduct } from "@/lib/actions/product-actions";
import type { CategoryOption, ProductRow } from "@/components/products/types";

type FormState = {
  name: string;
  description: string;
  categoryId: string;
  price: string;
  cost: string;
  imageUrl: string;
  allowsFlavors: boolean;
  maxFlavors: string;
  active: boolean;
};

function initialFormState(product: ProductRow | null, categories: CategoryOption[]): FormState {
  if (product) {
    return {
      name: product.name,
      description: product.description ?? "",
      categoryId: product.categoryId,
      price: String(product.price),
      cost: String(product.cost),
      imageUrl: product.imageUrl ?? "",
      allowsFlavors: product.allowsFlavors,
      maxFlavors: String(product.maxFlavors || 1),
      active: product.active,
    };
  }
  return {
    name: "",
    description: "",
    categoryId: categories[0]?.id ?? "",
    price: "",
    cost: "",
    imageUrl: "",
    allowsFlavors: false,
    maxFlavors: "1",
    active: true,
  };
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  onCategoryCreated,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductRow | null;
  categories: CategoryOption[];
  onCategoryCreated: (category: CategoryOption) => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        {open && (
          <ProductForm
            key={product?.id ?? "create"}
            product={product}
            categories={categories}
            onCategoryCreated={onCategoryCreated}
            onSaved={onSaved}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProductForm({
  product,
  categories,
  onCategoryCreated,
  onSaved,
  onOpenChange,
}: {
  product: ProductRow | null;
  categories: CategoryOption[];
  onCategoryCreated: (category: CategoryOption) => void;
  onSaved: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<FormState>(() => initialFormState(product, categories));
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    startTransition(async () => {
      const res = await createCategory(newCategoryName.trim());
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onCategoryCreated(res.data);
      setForm((f) => ({ ...f, categoryId: res.data.id }));
      setNewCategoryName("");
      setAddingCategory(false);
      toast.success(`Categoría "${res.data.name}" creada`);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name: form.name,
      description: form.description,
      categoryId: form.categoryId,
      price: form.price,
      cost: form.cost || 0,
      imageUrl: form.imageUrl,
      allowsFlavors: form.allowsFlavors,
      maxFlavors: form.maxFlavors,
      active: form.active,
    };

    startTransition(async () => {
      const res = product
        ? await updateProduct(product.id, payload as never)
        : await createProduct(payload as never);

      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(product ? "Producto actualizado" : "Producto creado");
      onOpenChange(false);
      onSaved();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{product ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        <DialogDescription>
          {product ? "Actualizá los datos del producto." : "Completá los datos del nuevo producto."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Categoría</Label>
          {addingCategory ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="Nombre de la categoría"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <Button type="button" size="sm" onClick={handleAddCategory} disabled={isPending}>
                Agregar
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAddingCategory(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select
                value={form.categoryId}
                onValueChange={(value) => setForm((f) => ({ ...f, categoryId: value ?? "" }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegí una categoría">
                    {(value: string) => categories.find((c) => c.id === value)?.name ?? "Elegí una categoría"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAddingCategory(true)}
                aria-label="Nueva categoría"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">Precio</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cost">Costo</Label>
            <Input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="imageUrl">Imagen (URL)</Label>
          <Input
            id="imageUrl"
            placeholder="https://..."
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <div>
            <Label htmlFor="allowsFlavors">Permite elegir sabores</Label>
            <p className="text-xs text-muted-foreground">Para helados, potes, cucuruchos, etc.</p>
          </div>
          <Switch
            id="allowsFlavors"
            checked={form.allowsFlavors}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, allowsFlavors: checked }))}
          />
        </div>

        {form.allowsFlavors && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maxFlavors">Máximo de sabores</Label>
            <Input
              id="maxFlavors"
              type="number"
              min="1"
              max="10"
              value={form.maxFlavors}
              onChange={(e) => setForm((f) => ({ ...f, maxFlavors: e.target.value }))}
            />
          </div>
        )}

        {product && (
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <Label htmlFor="active">Activo</Label>
            <Switch
              id="active"
              checked={form.active}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
            />
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {product ? "Guardar cambios" : "Crear producto"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
