"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DATE_RANGE_PRESET_LABEL, getRangeForPreset, type DateRange, type DateRangePreset } from "@/lib/date-range";

const presets: DateRangePreset[] = ["today", "yesterday", "week", "month", "year"];

function toInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function DateRangeFilter({
  onChange,
}: {
  onChange: (range: DateRange, preset: DateRangePreset) => void;
}) {
  const [preset, setPreset] = useState<DateRangePreset>("today");
  const [customFrom, setCustomFrom] = useState(toInputValue(new Date()));
  const [customTo, setCustomTo] = useState(toInputValue(new Date()));

  function selectPreset(p: DateRangePreset) {
    setPreset(p);
    onChange(getRangeForPreset(p), p);
  }

  function applyCustom() {
    setPreset("custom");
    const from = new Date(customFrom + "T00:00:00");
    const to = new Date(customTo + "T23:59:59");
    onChange({ from, to }, "custom");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => selectPreset(p)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            preset === p ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
        >
          {DATE_RANGE_PRESET_LABEL[p]}
        </button>
      ))}
      <div className="flex flex-wrap items-center gap-1.5">
        <Input
          type="date"
          value={customFrom}
          onChange={(e) => setCustomFrom(e.target.value)}
          className="h-8 w-32 sm:w-36"
        />
        <span className="text-xs text-muted-foreground">a</span>
        <Input
          type="date"
          value={customTo}
          onChange={(e) => setCustomTo(e.target.value)}
          className="h-8 w-32 sm:w-36"
        />
        <button
          type="button"
          onClick={applyCustom}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            preset === "custom" ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
