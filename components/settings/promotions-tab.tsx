"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { togglePromotionActive } from "@/lib/actions/promotion-actions";
import { PromotionFormDialog } from "@/components/settings/promotion-form-dialog";
import type { PromotionRow } from "@/components/settings/types";

export function PromotionsTab({ promotions }: { promotions: PromotionRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PromotionRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(promotion: PromotionRow) {
    setEditing(promotion);
    setDialogOpen(true);
  }

  function handleToggle(promotion: PromotionRow) {
    startTransition(async () => {
      const res = await togglePromotionActive(promotion.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.data.active ? `${promotion.name} activada` : `${promotion.name} desactivada`);
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Nueva promoción
        </Button>
      </div>

      {promotions.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          Todavía no hay promociones configuradas.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {promotions.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 rounded-2xl border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <Switch checked={p.active} onCheckedChange={() => handleToggle(p)} disabled={isPending} />
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {p.type}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)} aria-label="Editar promoción">
                <Pencil className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <PromotionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        promotion={editing}
        onSaved={() => {}}
      />
    </div>
  );
}
