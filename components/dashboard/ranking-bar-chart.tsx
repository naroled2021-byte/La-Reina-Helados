"use client";

import { useTheme } from "next-themes";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { singleSeriesColor, chartChrome } from "@/lib/chart-colors";
import { useMounted } from "@/lib/use-mounted";

export function RankingBarChart({ data }: { data: { name: string; quantity: number }[] }) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const mode = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const color = singleSeriesColor[mode];
  const chrome = chartChrome[mode];

  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        Sin ventas registradas todavía.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke={chrome.grid} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={120}
          tick={{ fill: chrome.axis, fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{
            background: chrome.surface,
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
          }}
        />
        <Bar dataKey="quantity" fill={color} radius={[0, 4, 4, 0]} maxBarSize={20}>
          <LabelList dataKey="quantity" position="right" fill="var(--foreground)" fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
