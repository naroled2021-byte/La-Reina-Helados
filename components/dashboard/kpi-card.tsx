import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "warning" | "critical";
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xl md:text-2xl font-semibold tabular-nums leading-tight truncate">
            {value}
          </span>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl",
            tone === "critical" && "bg-destructive/15 text-destructive",
            tone === "warning" && "bg-[color-mix(in_oklch,var(--chart-5)_25%,transparent)] text-[#a06a1f] dark:text-[#e0a85f]",
            tone === "default" && "bg-primary/12 text-primary"
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
      </CardContent>
    </Card>
  );
}
