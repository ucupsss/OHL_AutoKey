"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { api, type HealthResponse, type TrieStats } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AutokeyEditor } from "@/components/editor/autokey-editor";
import { CheckAllPanel } from "@/components/panels/check-all-panel";
import { SegmentPanel } from "@/components/panels/segment-panel";
import { StatsPanel } from "@/components/panels/stats-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LoadState = {
  health: HealthResponse | null;
  stats: TrieStats | null;
  loading: boolean;
  error: string | null;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function Home() {
  const [editorText, setEditorText] = useState("");
  const [state, setState] = useState<LoadState>({
    health: null,
    stats: null,
    loading: true,
    error: null,
  });

  async function fetchBackendStatus() {
    const [health, stats] = await Promise.all([
      api.getHealth(),
      api.getStats(),
    ]);
    return { health, stats };
  }

  function getBackendErrorState(error: unknown): LoadState {
    return {
      health: null,
      stats: null,
      loading: false,
      error:
        error instanceof Error
          ? error.message
          : "Backend status could not be loaded.",
    };
  }

  async function refreshBackendStatus() {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const { health, stats } = await fetchBackendStatus();
      setState({ health, stats, loading: false, error: null });
    } catch (error) {
      setState(getBackendErrorState(error));
    }
  }

  useEffect(() => {
    let active = true;

    async function loadInitialBackendStatus() {
      try {
        const { health, stats } = await fetchBackendStatus();
        if (active) {
          setState({ health, stats, loading: false, error: null });
        }
      } catch (error) {
        if (active) {
          setState(getBackendErrorState(error));
        }
      }
    }

    void loadInitialBackendStatus();

    return () => {
      active = false;
    };
  }, []);

  const online = state.health?.ok === true && state.error === null;

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-[color:color-mix(in_oklch,var(--autokey-accent)_24%,var(--border))] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span
                className="autokey-accent-dot h-2.5 w-2.5 rounded-full"
                aria-hidden="true"
              />
              <h1 className="text-2xl font-semibold tracking-normal">
                AutoKey
              </h1>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Backend and dictionary readiness check for the AutoKey editor.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={online ? "outline" : "secondary"}
              className={
                online
                  ? "autokey-accent-surface autokey-accent-text"
                  : undefined
              }
            >
              {online ? "Backend ready" : "Backend offline"}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refreshBackendStatus()}
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

        {state.error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {state.error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div
                className={`rounded-md border p-4 ${
                  online ? "autokey-accent-surface" : ""
                }`}
              >
                <p className="text-xs text-muted-foreground">API</p>
                <p
                  className={`mt-1 text-lg font-medium ${
                    online ? "autokey-accent-text" : ""
                  }`}
                >
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

            <AutokeyEditor text={editorText} onTextChange={setEditorText} />
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Tools</CardTitle>
              <CardDescription>
                Trie stats, full text spell check, and Auto-Space.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="stats">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                  <TabsTrigger value="check">Check</TabsTrigger>
                  <TabsTrigger value="space">Space</TabsTrigger>
                </TabsList>
                <TabsContent value="stats" className="mt-4">
                  <StatsPanel stats={state.stats} loading={state.loading} />
                </TabsContent>
                <TabsContent value="check" className="mt-4">
                  <CheckAllPanel text={editorText} disabled={!online} />
                </TabsContent>
                <TabsContent value="space" className="mt-4">
                  <SegmentPanel />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
