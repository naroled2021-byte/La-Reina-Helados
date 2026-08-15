"use client";

import { useTheme } from "next-themes";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoricalPalette, chartChrome } from "@/lib/chart-colors";
import { useMounted } from "@/lib/use-mounted";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export function PaymentMethodsChart({ data }: { data: { label: string; amount: number }[] }) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const mode = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const palette = categoricalPalette[mode];
  const chrome = chartChrome[mode];

  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        Sin pagos registrados todavía.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="label"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          stroke={chrome.surface}
          strokeWidth={2}
          label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
          labelLine={false}
        >
          {data.map((entry, i) => (
            <Cell key={entry.label} fill={palette[i % palette.length]} />
          ))}
        </Pie>
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
        />
        <Tooltip
          formatter={(value) => currency.format(Number(value))}
          contentStyle={{
            background: chrome.surface,
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
