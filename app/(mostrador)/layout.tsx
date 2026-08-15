import { requirePermission } from "@/lib/auth-helpers";
import { MostradorShell } from "@/components/mostrador/mostrador-shell";

export default async function MostradorLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePermission("sales.create");

  return <MostradorShell userName={session.user.name ?? ""}>{children}</MostradorShell>;
}
