"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { api, type HealthResponse, type TrieStats } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AutokeyEditor } from "@/components/editor/autokey-editor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type LoadState = {
  health: HealthResponse | null;
  stats: TrieStats | null;
  loading: boolean;
  error: string | null;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Home() {
  const [editorText, setEditorText] = useState("");
  const [state, setState] = useState<LoadState>({
    health: null,
    stats: null,
    loading: true,
    error: null,
  });

  async function loadBackendStatus() {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const [health, stats] = await Promise.all([
        api.getHealth(),
        api.getStats(),
      ]);
      setState({ health, stats, loading: false, error: null });
    } catch (error) {
      setState({
        health: null,
        stats: null,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Backend status could not be loaded.",
      });
    }
  }

  useEffect(() => {
    void loadBackendStatus();
  }, []);

  const online = state.health?.ok === true && state.error === null;

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-normal">AutoKey</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Backend and dictionary readiness check for the AutoKey editor.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={online ? "default" : "secondary"}>
              {online ? "Backend ready" : "Backend offline"}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadBackendStatus()}
              disabled={state.loading}
            >
              <RefreshCw
                className={state.loading ? "animate-spin" : ""}
                aria-hidden="true"
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
              <CardDescription>
                Confirms that the FastAPI backend can load the dictionary.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {state.error}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border p-4">
                  <p className="text-xs text-muted-foreground">API</p>
                  <p className="mt-1 text-lg font-medium">
                    {state.loading ? "Checking" : online ? "Ready" : "Offline"}
                  </p>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-xs text-muted-foreground">Dictionary</p>
                  <p className="mt-1 text-lg font-medium">
                    {state.health?.dictionary_loaded ? "Loaded" : "Unknown"}
                  </p>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-xs text-muted-foreground">Words</p>
                  <p className="mt-1 text-lg font-medium">
                    {state.health
                      ? formatNumber(state.health.word_count)
                      : "Unknown"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trie Statistics</CardTitle>
              <CardDescription>
                Values reported by the backend after dictionary load.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Inserted words</span>
                  <span className="font-medium">
                    {state.stats ? formatNumber(state.stats.word_count) : "-"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Nodes</span>
                  <span className="font-medium">
                    {state.stats ? formatNumber(state.stats.node_count) : "-"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Average depth</span>
                  <span className="font-medium">
                    {state.stats ? state.stats.average_depth.toFixed(2) : "-"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Memory estimate</span>
                  <span className="font-medium">
                    {state.stats
                      ? formatBytes(state.stats.estimated_memory_bytes)
                      : "-"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <AutokeyEditor text={editorText} onTextChange={setEditorText} />
      </section>
    </main>
  );
}
