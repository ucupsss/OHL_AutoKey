"use client";

import { useState } from "react";
import { AlertCircle, Scissors } from "lucide-react";

import { api, type SmartTrimResult } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type SmartTrimPanelProps = {
  text: string;
};

function clampLimit(value: number) {
  if (Number.isNaN(value)) {
    return 1;
  }
  return Math.min(240, Math.max(1, Math.floor(value)));
}

export function SmartTrimPanel({ text }: SmartTrimPanelProps) {
  const [maxCharacters, setMaxCharacters] = useState(48);
  const [result, setResult] = useState<SmartTrimResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sourceText = text.trim();
  const canRun = sourceText.length > 0 && !loading;

  async function handleTrim() {
    if (!sourceText) {
      return;
    }

    const nextLimit = clampLimit(maxCharacters);
    setMaxCharacters(nextLimit);
    setLoading(true);
    setError(null);
    try {
      setResult(await api.smartTrim(sourceText, nextLimit));
    } catch {
      setResult(null);
      setError("Smart Trim service unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="rounded-md border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Source text</p>
          <p className="mt-1 line-clamp-2 text-sm">
            {sourceText || "Tulis teks di editor utama dulu."}
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            max={240}
            value={maxCharacters}
            aria-label="Smart Trim character limit"
            onChange={(event) =>
              setMaxCharacters(clampLimit(Number(event.target.value)))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleTrim();
              }
            }}
          />
          <Button type="button" onClick={() => void handleTrim()} disabled={!canRun}>
            <Scissors aria-hidden="true" />
            {loading ? "Trim" : "Run"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <div className="rounded-md border autokey-accent-surface p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Trimmed result</p>
              <Badge variant={result.success ? "outline" : "secondary"}>
                {result.total_characters}/{maxCharacters} chars
              </Badge>
            </div>
            <p className="mt-1 text-base font-medium">
              {result.trimmed_text || result.message}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              value {result.total_value.toFixed(2)}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">DP table</p>
                <Badge variant="secondary">
                  {result.dp.length} x {result.dp[0]?.length ?? 0}
                </Badge>
              </div>
              <ScrollArea className="h-40 rounded-md border">
                <div className="space-y-2 p-3">
                  {result.dp.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex min-w-max items-center gap-2">
                      <span className="w-10 shrink-0 text-xs text-muted-foreground">
                        i={rowIndex}
                      </span>
                      {row.map((value, columnIndex) => (
                        <span
                          key={`${rowIndex}:${columnIndex}`}
                          className="w-14 rounded border px-1.5 py-1 text-center text-[11px]"
                        >
                          {value.toFixed(1)}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Kept words</p>
              {result.kept_words.length > 0 ? (
                <div className="space-y-2">
                  {result.kept_words.map((item) => (
                    <div
                      key={`${item.index}:${item.word}`}
                      className="flex items-center justify-between gap-3 rounded-md border p-2"
                    >
                      <span className="font-medium">{item.word}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.weight} | {item.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Tidak ada kata yang dipertahankan.
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Trace-back</p>
            {result.traceback.length > 0 ? (
              <div className="space-y-2">
                {result.traceback.map((step) => (
                  <div
                    key={`${step.index}:${step.word}:${step.remaining_capacity}`}
                    className="flex items-center justify-between gap-3 rounded-md border p-2"
                  >
                    <span className="font-medium">{step.word}</span>
                    <span className="text-xs text-muted-foreground">
                      cap {step.remaining_capacity} | {step.value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No trace-back steps yet.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
