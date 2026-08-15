"use client";

import Link from "next/link";
import {
  ShoppingCart,
  ClipboardPlus,
  UserPlus,
  PackagePlus,
  Factory,
  Boxes,
  Wallet,
  WalletCards,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { LucideIcon } from "lucide-react";

const ACTIONS: { label: string; icon: LucideIcon; href?: string; permission?: string }[] = [
  { label: "Nueva venta", icon: ShoppingCart, href: "/admin/ventas", permission: "sales.create" },
  { label: "Nuevo pedido", icon: ClipboardPlus, href: "/admin/ventas", permission: "sales.create" },
  { label: "Nuevo cliente", icon: UserPlus, href: "/admin/clientes", permission: "customers.manage" },
  { label: "Agregar producto", icon: PackagePlus, href: "/admin/productos", permission: "products.manage" },
  { label: "Registrar producción", icon: Factory, href: "/admin/produccion", permission: "production.manage" },
  { label: "Ajustar stock", icon: Boxes, href: "/admin/stock", permission: "inventory.manage" },
  { label: "Abrir caja", icon: Wallet, href: "/admin/caja", permission: "cash.manage" },
  { label: "Cerrar caja", icon: WalletCards, href: "/admin/caja", permission: "cash.manage" },
];

export function QuickActions({ permissions }: { permissions: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTIONS.map((action) => {
        const enabled = !!action.href && (!action.permission || permissions.includes(action.permission));

        if (enabled) {
          return (
            <Link
              key={action.label}
              href={action.href!}
              className="flex flex-col items-center gap-2 rounded-2xl border bg-card px-3 py-4 text-center transition-colors hover:bg-muted"
            >
              <action.icon className="size-5 text-primary" strokeWidth={1.75} />
              <span className="text-xs font-medium leading-tight">{action.label}</span>
            </Link>
          );
        }

        return (
          <Tooltip key={action.label}>
            <TooltipTrigger
              aria-disabled
              onClick={(e) => e.preventDefault()}
              className="flex cursor-not-allowed flex-col items-center gap-2 rounded-2xl border border-dashed bg-card px-3 py-4 text-center opacity-60 transition-opacity hover:opacity-90"
            >
              <action.icon className="size-5 text-primary" strokeWidth={1.75} />
              <span className="text-xs font-medium leading-tight">{action.label}</span>
            </TooltipTrigger>
            <TooltipContent>
              {action.href ? "No tenés permiso para esta acción" : "Disponible en una próxima etapa"}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
