import { requireSession } from "@/lib/auth-helpers";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <SidebarProvider>
      <AppSidebar permissions={session.user.permissions} />
      <SidebarInset>
        <Topbar name={session.user.name ?? "Usuario"} role={session.user.role} />
        <div className="flex-1 p-4 md:p-6 print:p-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
