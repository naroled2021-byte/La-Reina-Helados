"use client";

import { useTheme } from "next-themes";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { singleSeriesColor, chartChrome } from "@/lib/chart-colors";
import { useMounted } from "@/lib/use-mounted";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export function PeakHoursChart({ data }: { data: { hour: string; total: number }[] }) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const mode = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const color = singleSeriesColor[mode];
  const chrome = chartChrome[mode];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={chrome.grid} />
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={{ stroke: chrome.axis }}
          tick={{ fill: chrome.axis, fontSize: 11 }}
          interval={1}
        />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: "color-mix(in oklch, var(--foreground) 6%, transparent)" }}
          formatter={(value) => currency.format(Number(value))}
          contentStyle={{
            background: chrome.surface,
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
          }}
        />
        <Bar dataKey="total" fill={color} radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
