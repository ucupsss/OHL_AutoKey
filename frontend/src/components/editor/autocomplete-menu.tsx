"use client";

import type { Suggestion } from "@/lib/api";
import { Button } from "@/components/ui/button";

type AutocompleteMenuProps = {
  suggestions: Suggestion[];
  activeIndex: number;
  position: {
    left: number;
    top: number;
  } | null;
  onPick: (word: string) => void;
};

export function AutocompleteMenu({
  suggestions,
  activeIndex,
  position,
  onPick,
}: AutocompleteMenuProps) {
  if (suggestions.length === 0 || position === null) {
    return null;
  }

  return (
    <div
      className="fixed z-50 max-h-[calc(100dvh-2rem)] w-72 overflow-y-auto rounded-2xl border bg-popover p-2 text-popover-foreground shadow-xl"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
      }}
    >
      {suggestions.map((suggestion, index) => (
        <Button
          key={suggestion.word}
          type="button"
          variant="ghost"
          className={`h-10 w-full justify-between rounded-xl ${
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
