"use client";

import { useState } from "react";
import { AlertCircle, WandSparkles } from "lucide-react";

import { api, type SpellSuggestion } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function LevenshteinPanel() {
  const [word, setWord] = useState("kalimt");
  const [suggestions, setSuggestions] = useState<SpellSuggestion[]>([]);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSuggest() {
    const normalized = word.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    setWord(normalized);
    setLoading(true);
    setError(null);
    try {
      const response = await api.getSpellSuggestions(normalized, 5);
      setSuggestions(response.suggestions);
      setChecked(true);
    } catch {
      setSuggestions([]);
      setChecked(false);
      setError("Levenshtein service unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={word}
            aria-label="Levenshtein input"
            onChange={(event) => setWord(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSuggest();
              }
            }}
          />
          <Button
            type="button"
            onClick={() => void handleSuggest()}
            disabled={word.trim().length === 0 || loading}
          >
            <WandSparkles aria-hidden="true" />
            {loading ? "Mencari" : "Saran"}
          </Button>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border bg-muted/30 p-3">
        {suggestions.length > 0 ? (
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div key={suggestion.word}>
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <span className="font-medium">{suggestion.word}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">d={suggestion.distance}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {suggestion.frequency}
                    </span>
                  </div>
                </div>
                {index < suggestions.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid min-h-28 place-items-center text-center text-sm text-muted-foreground">
            {checked ? "Tidak ada saran." : "Belum ada hasil."}
          </div>
        )}
      </div>
    </div>
  );
}
