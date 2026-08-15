"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toggleCategoryActive } from "@/lib/actions/product-actions";
import { CategoryFormDialog } from "@/components/settings/category-form-dialog";
import type { CategoryRow } from "@/components/settings/types";

export function CategoriesTab({ categories }: { categories: CategoryRow[] }) {
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle(category: CategoryRow) {
    startTransition(async () => {
      const res = await toggleCategoryActive(category.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.data.active ? `${category.name} activada` : `${category.name} desactivada`);
    });
  }

  return (
    <div className="flex max-w-lg flex-col gap-2">
      {categories
        .sort((a, b) => a.order - b.order)
        .map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <Switch checked={c.active} onCheckedChange={() => handleToggle(c)} disabled={isPending} />
              <span className="font-medium">{c.name}</span>
              <Badge variant="outline" className="text-[10px]">
                orden {c.order}
              </Badge>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(c)} aria-label="Editar categoría">
              <Pencil className="size-4" />
            </Button>
          </div>
        ))}

      <p className="text-xs text-muted-foreground">
        Las categorías nuevas se crean desde el formulario de producto (&ldquo;+ nueva categoría&rdquo;).
      </p>

      <CategoryFormDialog category={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </div>
  );
}
