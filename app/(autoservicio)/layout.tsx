import { AutoservicioShell } from "@/components/autoservicio/autoservicio-shell";

export default function AutoservicioLayout({ children }: { children: React.ReactNode }) {
  return <AutoservicioShell>{children}</AutoservicioShell>;
}
