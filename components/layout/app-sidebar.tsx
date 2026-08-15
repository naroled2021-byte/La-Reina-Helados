"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, ShieldAlert } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="size-9 shrink-0 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo2.png" alt="La Reina Helados" className="size-full object-contain" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm">La Reina Helados</span>
            <span className="text-xs text-muted-foreground">Panel de gestión</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const hasPermission = !item.permission || permissions.includes(item.permission);
                const isUnlocked = item.available && hasPermission;
                const reason = !item.available ? "próximamente" : "sin permiso";

                const content = (
                  <>
                    <item.icon />
                    <span>{item.label}</span>
                    {!isUnlocked && (
                      <Badge
                        variant="secondary"
                        className="ml-auto h-5 gap-1 px-1.5 text-[10px] group-data-[collapsible=icon]:hidden"
                      >
                        {item.available ? <ShieldAlert className="size-2.5" /> : <Lock className="size-2.5" />}
                      </Badge>
                    )}
                  </>
                );

                return (
                  <SidebarMenuItem key={item.href}>
                    {isUnlocked ? (
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        {content}
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        disabled
                        tooltip={`${item.label} — ${reason}`}
                        className="opacity-50 cursor-not-allowed"
                      >
                        {content}
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
