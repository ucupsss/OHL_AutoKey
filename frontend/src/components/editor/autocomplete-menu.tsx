"use client";

import type { Suggestion } from "@/lib/api";
import { Button } from "@/components/ui/button";

type AutocompleteMenuProps = {
  suggestions: Suggestion[];
  activeIndex: number;
  onPick: (word: string) => void;
};

export function AutocompleteMenu({
  suggestions,
  activeIndex,
  onPick,
}: AutocompleteMenuProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-4 top-16 z-20 w-72 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
      {suggestions.map((suggestion, index) => (
        <Button
          key={suggestion.word}
          type="button"
          variant="ghost"
          className={`h-9 w-full justify-between ${
            index === activeIndex ? "autokey-suggestion-active" : ""
          }`}
          onMouseDown={(event) => {
            event.preventDefault();
            onPick(suggestion.word);
          }}
        >
          <span>{suggestion.word}</span>
          <span className="text-xs text-muted-foreground">
            {suggestion.frequency}
          </span>
        </Button>
      ))}
    </div>
  );
}
