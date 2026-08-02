"use client";

import { useState } from "react";
import { AlertCircle, Split } from "lucide-react";

import { api, type SegmentResult } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function SegmentPanel() {
  const [input, setInput] = useState("programdinamis");
  const [result, setResult] = useState<SegmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSegment() {
    const normalized = input.replace(/\s+/g, "").toLowerCase();
    if (!normalized) {
      return;
    }

    setInput(normalized);
    setLoading(true);
    setError(null);
    try {
      setResult(await api.segment(normalized));
    } catch {
      setResult(null);
      setError("Auto-Space service unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={input}
          aria-label="Auto-Space input"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleSegment();
            }
          }}
        />
        <Button
          type="button"
          onClick={() => void handleSegment()}
          disabled={input.trim().length === 0 || loading}
        >
          <Split aria-hidden="true" />
          {loading ? "Running" : "Run"}
        </Button>
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
            <p className="text-xs text-muted-foreground">Segmented result</p>
            <p className="mt-1 text-base font-medium">
              {result.segmented_text || result.message}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">DP values</p>
              <Badge variant={result.success ? "outline" : "secondary"}>
                {result.success ? "Matched" : "No full match"}
              </Badge>
            </div>
            <ScrollArea className="h-24 rounded-md border">
              <div className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-6">
                {result.dp.map((value, index) => (
                  <div key={index} className="rounded-md border p-2">
                    <p className="text-[11px] text-muted-foreground">
                      dp[{index}]
                    </p>
                    <p className="text-xs font-medium">
                      {value === null ? "null" : value.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Trace-back</p>
            {result.traceback.length > 0 ? (
              <div className="space-y-2">
                {result.traceback.map((step) => (
                  <div
                    key={`${step.start}:${step.end}:${step.word}`}
                    className="flex items-center justify-between gap-3 rounded-md border p-2"
                  >
                    <span className="font-medium">{step.word}</span>
                    <span className="text-xs text-muted-foreground">
                      {step.start}-{step.end} | {step.cost.toFixed(2)}
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
