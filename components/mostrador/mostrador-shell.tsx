"use client";

import { useState } from "react";
import { LayoutDashboard, LogOut, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminAccessDialog } from "@/components/mostrador/admin-access-dialog";
import { logoutAction } from "@/lib/actions/auth-actions";

export function MostradorShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const [adminAccessOpen, setAdminAccessOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-40 flex items-center gap-2 bg-primary px-4 py-3 text-primary-foreground shadow-sm">
        <div className="size-8 shrink-0 overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo2.png" alt="La Reina Helados" className="size-full object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight">Artículos</h1>
          <p className="truncate text-[11px] text-primary-foreground/80">{userName}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-xl hover:bg-primary-foreground/15">
            <MoreVertical className="size-4.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{userName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAdminAccessOpen(true)}>
                <LayoutDashboard className="size-4" />
                Ir al panel de administración
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => logoutAction()}>
                <LogOut className="size-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-3 pb-20 pt-3">{children}</main>

      <AdminAccessDialog open={adminAccessOpen} onOpenChange={setAdminAccessOpen} />
    </div>
  );
}
