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

export function DeliveryShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const [adminAccessOpen, setAdminAccessOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/70 px-6 py-8 text-primary-foreground shadow-sm sm:px-10">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-16 shrink-0 overflow-hidden rounded-2xl ring-2 ring-primary-foreground/30 sm:size-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpeg" alt="La Reina Helados" className="size-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold leading-tight sm:text-3xl">La Reina Helados</h1>
              <p className="truncate text-sm text-primary-foreground/90 sm:text-base">
                ¡Pedí tu helado favorito, para retirar o delivery!
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10 hover:bg-primary-foreground/20">
              <MoreVertical className="size-5" />
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
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 lg:flex-row lg:gap-5">{children}</main>

      <AdminAccessDialog open={adminAccessOpen} onOpenChange={setAdminAccessOpen} />
    </div>
  );
}
