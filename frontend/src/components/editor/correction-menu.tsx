"use client";

import { Plus, WandSparkles } from "lucide-react";

import type { SpellSuggestion } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type CorrectionMenuProps = {
  word: string;
  suggestions: SpellSuggestion[];
  position: {
    left: number;
    top: number;
  };
  onPick: (word: string) => void;
  onAdd: (word: string) => void;
};

export function CorrectionMenu({
  word,
  suggestions,
  position,
  onPick,
  onAdd,
}: CorrectionMenuProps) {
  return (
    <div
      className="fixed z-50 flex max-h-[calc(100dvh-2rem)] w-80 flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-xl"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
      }}
    >
      <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
        <WandSparkles className="size-4" aria-hidden="true" />
        <span>Saran untuk &quot;{word}&quot;</span>
      </div>
      {suggestions.length === 0 ? (
        <div className="px-4 pb-3 text-sm text-muted-foreground">
          Tidak ada saran koreksi.
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion.word}
            type="button"
            variant="ghost"
            className="h-10 w-full justify-between rounded-xl"
            onMouseDown={(event) => {
              event.preventDefault();
              onPick(suggestion.word);
            }}
          >
            <span>{suggestion.word}</span>
            <span className="text-xs text-muted-foreground">
              dist {suggestion.distance} - freq {suggestion.frequency}
            </span>
          </Button>
        ))}
      </div>
      <Separator />
      <Button
        type="button"
        variant="ghost"
        className="h-12 w-full shrink-0 justify-start rounded-none px-5 text-[var(--autokey-accent-strong)]"
        onMouseDown={(event) => {
          event.preventDefault();
          onAdd(word);
        }}
      >
        <Plus aria-hidden="true" />
        Tambah ke kamus
      </Button>
    </div>
  );
}
