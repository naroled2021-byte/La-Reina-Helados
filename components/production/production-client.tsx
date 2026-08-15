"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuggestionsPanel } from "@/components/production/suggestions-panel";
import { NewProductionDialog } from "@/components/production/new-production-dialog";
import { ProductionSessionCard } from "@/components/production/production-session-card";
import { RecordProductionDialog } from "@/components/production/record-production-dialog";
import type { FlavorOption, ProductionItemRow, ProductionSession, Suggestion } from "@/components/production/types";

export function ProductionClient({
  suggestions,
  flavors,
  sessions,
}: {
  suggestions: Suggestion[];
  flavors: FlavorOption[];
  sessions: ProductionSession[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSeed, setDialogSeed] = useState<{ flavorId: string; quantity: number }[]>([]);
  const [recordingItem, setRecordingItem] = useState<ProductionItemRow | null>(null);

  function openManual() {
    setDialogSeed([]);
    setDialogOpen(true);
  }

  function openFromSuggestions() {
    setDialogSeed(suggestions.map((s) => ({ flavorId: s.flavorId, quantity: s.suggested })));
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <SuggestionsPanel suggestions={suggestions} onUseSuggestions={openFromSuggestions} />

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Producción de hoy</h2>
        <Button size="sm" onClick={openManual}>
          <Plus className="size-4" />
          Nueva producción
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          Todavía no hay producción registrada hoy.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sessions.map((session) => (
            <ProductionSessionCard key={session.id} session={session} onRecord={setRecordingItem} />
          ))}
        </div>
      )}

      <NewProductionDialog open={dialogOpen} onOpenChange={setDialogOpen} flavors={flavors} initialLines={dialogSeed} />
      <RecordProductionDialog item={recordingItem} onOpenChange={(open) => !open && setRecordingItem(null)} />
    </div>
  );
}
