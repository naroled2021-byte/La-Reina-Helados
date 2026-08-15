"use client";

import { useTheme } from "next-themes";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { singleSeriesColor, chartChrome } from "@/lib/chart-colors";
import { useMounted } from "@/lib/use-mounted";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export function SalesByDayChart({ data }: { data: { label: string; total: number }[] }) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const mode = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const color = singleSeriesColor[mode];
  const chrome = chartChrome[mode];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={chrome.grid} strokeDasharray="0" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: chrome.axis }}
          tick={{ fill: chrome.axis, fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: chrome.axis, fontSize: 12 }}
          tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : v)}
          width={40}
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
        <Area
          type="monotone"
          dataKey="total"
          stroke={color}
          strokeWidth={2}
          fill="url(#salesFill)"
          dot={{ r: 4, fill: color, stroke: chrome.surface, strokeWidth: 2 }}
          activeDot={{ r: 5, fill: color, stroke: chrome.surface, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
