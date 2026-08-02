"use client";

import type { SpellSuggestion } from "@/lib/api";
import { Button } from "@/components/ui/button";

type CorrectionMenuProps = {
  word: string;
  suggestions: SpellSuggestion[];
  onPick: (word: string) => void;
  onAdd: (word: string) => void;
};

export function CorrectionMenu({
  word,
  suggestions,
  onPick,
  onAdd,
}: CorrectionMenuProps) {
  return (
    <div className="absolute right-4 top-16 z-20 w-72 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
      {suggestions.length === 0 ? (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          Tidak ada saran koreksi.
        </div>
      ) : null}
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion.word}
          type="button"
          variant="ghost"
          className="h-9 w-full justify-between"
          onMouseDown={(event) => {
            event.preventDefault();
            onPick(suggestion.word);
          }}
        >
          <span>{suggestion.word}</span>
          <span className="text-xs text-muted-foreground">
            d={suggestion.distance}
          </span>
        </Button>
      ))}
      <Button
        type="button"
        variant="secondary"
        className="mt-1 h-9 w-full justify-start"
        onMouseDown={(event) => {
          event.preventDefault();
          onAdd(word);
        }}
      >
        Tambah ke kamus
      </Button>
    </div>
  );
}
