"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUploadField } from "@/components/ui/image-upload";
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
import { createFlavor, updateFlavor } from "@/lib/actions/flavor-actions";
import { flavorCategoryValues } from "@/lib/validations/flavor";
import { FLAVOR_CATEGORY_LABEL } from "@/lib/constants";
import type { FlavorRow } from "@/components/flavors/types";

type FormState = {
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  popular: boolean;
  active: boolean;
  initialStock: string;
  minStock: string;
};

function initialFormState(flavor: FlavorRow | null): FormState {
  if (flavor) {
    return {
      name: flavor.name,
      description: flavor.description ?? "",
      category: flavor.category,
      imageUrl: flavor.imageUrl ?? "",
      popular: flavor.popular,
      active: flavor.active,
      initialStock: String(flavor.currentStock),
      minStock: String(flavor.minStock),
    };
  }
  return {
    name: "",
    description: "",
    category: "crema",
    imageUrl: "",
    popular: false,
    active: true,
    initialStock: "10",
    minStock: "8",
  };
}

export function FlavorFormDialog({
  open,
  onOpenChange,
  flavor,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flavor: FlavorRow | null;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        {open && (
          <FlavorForm
            key={flavor?.id ?? "create"}
            flavor={flavor}
            onSaved={onSaved}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FlavorForm({
  flavor,
  onSaved,
  onOpenChange,
}: {
  flavor: FlavorRow | null;
  onSaved: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState<FormState>(() => initialFormState(flavor));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = flavor
        ? await updateFlavor(flavor.id, {
            name: form.name,
            description: form.description,
            category: form.category as never,
            imageUrl: form.imageUrl,
            popular: form.popular,
            active: form.active,
            minStock: form.minStock as never,
          })
        : await createFlavor({
            name: form.name,
            description: form.description,
            category: form.category as never,
            imageUrl: form.imageUrl,
            popular: form.popular,
            active: true,
            initialStock: form.initialStock as never,
            minStock: form.minStock as never,
          });

      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success(flavor ? "Sabor actualizado" : "Sabor creado");
      onOpenChange(false);
      onSaved();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{flavor ? "Editar sabor" : "Nuevo sabor"}</DialogTitle>
        <DialogDescription>
          {flavor ? "Actualizá los datos del sabor." : "Completá los datos del nuevo sabor."}
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
          <Select
            value={form.category}
            onValueChange={(value) => setForm((f) => ({ ...f, category: value ?? "crema" }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elegí una categoría">
                {(value: string) => FLAVOR_CATEGORY_LABEL[value] ?? value}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {flavorCategoryValues.map((c) => (
                <SelectItem key={c} value={c}>
                  {FLAVOR_CATEGORY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        <div className="flex flex-col gap-1.5">
          <Label>Foto</Label>
          <ImageUploadField
            value={form.imageUrl}
            onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
          />
        </div>

        {flavor ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minStock">Stock mínimo (kg)</Label>
            <Input
              id="minStock"
              type="number"
              min="0"
              step="0.5"
              value={form.minStock}
              onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Stock actual: {flavor.currentStock}kg — se ajusta desde el módulo de Stock.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="initialStock">Stock inicial (kg)</Label>
              <Input
                id="initialStock"
                type="number"
                min="0"
                step="0.5"
                value={form.initialStock}
                onChange={(e) => setForm((f) => ({ ...f, initialStock: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="minStock">Stock mínimo (kg)</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                step="0.5"
                value={form.minStock}
                onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <Label htmlFor="popular">Sabor popular</Label>
          <Switch
            id="popular"
            checked={form.popular}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, popular: checked }))}
          />
        </div>

        {flavor && (
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
            {flavor ? "Guardar cambios" : "Crear sabor"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
