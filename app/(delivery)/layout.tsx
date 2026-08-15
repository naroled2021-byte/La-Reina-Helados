import { requirePermission } from "@/lib/auth-helpers";
import { DeliveryShell } from "@/components/delivery/delivery-shell";

export default async function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePermission("sales.create");

  return <DeliveryShell userName={session.user.name ?? ""}>{children}</DeliveryShell>;
}
