"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { togglePaymentMethod } from "@/lib/actions/settings-actions";
import type { PaymentMethodRow } from "@/components/settings/types";

export function PaymentMethodsTab({ methods }: { methods: PaymentMethodRow[] }) {
  const [items, setItems] = useState(methods);
  const [isPending, startTransition] = useTransition();

  function handleToggle(method: PaymentMethodRow) {
    startTransition(async () => {
      const res = await togglePaymentMethod(method.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setItems((prev) => prev.map((m) => (m.id === method.id ? { ...m, enabled: res.data.enabled } : m)));
      toast.success(res.data.enabled ? `${method.label} activado` : `${method.label} desactivado`);
    });
  }

  return (
    <div className="flex max-w-md flex-col gap-2">
      {items.map((m) => (
        <div key={m.id} className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <Switch checked={m.enabled} onCheckedChange={() => handleToggle(m)} disabled={isPending} />
            <span className="font-medium">{m.label}</span>
          </div>
          <Badge variant={m.enabled ? "secondary" : "outline"} className="text-[10px]">
            {m.enabled ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      ))}
    </div>
  );
}
