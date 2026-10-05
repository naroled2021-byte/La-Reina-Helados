"use client";

import { useTransition } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCsv, exportToExcel, type ExportColumn } from "@/lib/report-export";

export function ExportButtons({
  filename,
  columns,
  rows,
}: {
  filename: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
}) {
  const [isExporting, startExporting] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportToCsv(filename, columns, rows)}>
        <Download className="size-3.5" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={isExporting}
        onClick={() => startExporting(() => exportToExcel(filename, columns, rows))}
      >
        <FileSpreadsheet className="size-3.5" />
        Excel
      </Button>
    </div>
  );
}
