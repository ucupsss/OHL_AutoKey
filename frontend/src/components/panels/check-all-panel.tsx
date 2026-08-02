"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, SearchCheck } from "lucide-react";

import { api, type InvalidWord } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type CheckAllPanelProps = {
  text: string;
  disabled?: boolean;
};

export function CheckAllPanel({ text, disabled = false }: CheckAllPanelProps) {
  const [invalidWords, setInvalidWords] = useState<InvalidWord[]>([]);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckAll() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.checkAll(text);
      setInvalidWords(response.invalid_words);
      setChecked(true);
    } catch {
      setInvalidWords([]);
      setChecked(false);
      setError("Check All service unavailable.");
    } finally {
      setLoading(false);
    }
  }

  const canRun = text.trim().length > 0 && !loading && !disabled;

  return (
    <div className="space-y-4">
      <Button
        type="button"
        className="w-full"
        onClick={handleCheckAll}
        disabled={!canRun}
      >
        <SearchCheck aria-hidden="true" />
        {loading ? "Checking" : "Check All"}
      </Button>

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {checked && invalidWords.length === 0 ? (
        <div className="flex items-start gap-2 rounded-md border autokey-accent-surface p-3 text-sm">
          <CheckCircle2
            className="autokey-accent-text mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <span>No invalid words found.</span>
        </div>
      ) : null}

      {invalidWords.length > 0 ? (
        <ScrollArea className="h-72 rounded-md border">
          <div className="space-y-3 p-3">
            {invalidWords.map((item) => (
              <div key={`${item.start}:${item.end}`} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-destructive">
                    {item.word}
                  </span>
                  <Badge variant="outline">
                    {item.start}-{item.end}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.suggestions.length > 0 ? (
                    item.suggestions.map((suggestion) => (
                      <Badge
                        key={suggestion.word}
                        variant="secondary"
                        className="gap-1"
                      >
                        {suggestion.word}
                        <span className="text-muted-foreground">
                          d={suggestion.distance}
                        </span>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No suggestions
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : null}
    </div>
  );
}
