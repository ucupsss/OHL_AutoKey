"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { api, type HealthResponse, type TrieStats } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AutokeyEditor } from "@/components/editor/autokey-editor";
import { CheckAllPanel } from "@/components/panels/check-all-panel";
import { LevenshteinPanel } from "@/components/panels/levenshtein-panel";
import { SegmentPanel } from "@/components/panels/segment-panel";
import { SmartTrimPanel } from "@/components/panels/smart-trim-panel";
import {
  Card,
  CardContent,
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
  const [issueCount, setIssueCount] = useState<number | null>(null);
  const [state, setState] = useState<LoadState>({
    health: null,
    stats: null,
    loading: true,
    error: null,
  });

  function handleEditorTextChange(nextText: string) {
    setEditorText(nextText);
    setIssueCount(null);
  }

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
  const metrics = [
    {
      label: "kata",
      value: state.health ? formatNumber(state.health.word_count) : "-",
    },
    {
      label: "node trie",
      value: state.stats ? formatNumber(state.stats.node_count) : "-",
    },
    {
      label: "depth",
      value: state.stats ? state.stats.average_depth.toFixed(1) : "-",
    },
    {
      label: "memori",
      value: state.stats ? formatBytes(state.stats.estimated_memory_bytes) : "-",
    },
    {
      label: "status",
      value: online ? "online" : "offline",
    },
  ];

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--autokey-accent-strong)] text-lg font-semibold text-white shadow-sm">
              A
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-normal">AutoKey</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {metrics.map((item) => (
                  <span key={item.label}>
                    <span className="font-medium text-foreground">
                      {item.value}
                    </span>{" "}
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
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
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {state.error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_344px]">
          <div className="space-y-4">
            <AutokeyEditor
              text={editorText}
              onTextChange={handleEditorTextChange}
            />
          </div>

          <Card className="autokey-panel h-fit min-h-[292px]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Ringkasan</CardTitle>
                <Badge variant="secondary">
                  {online
                    ? `${issueCount ?? 0} isu`
                    : "offline"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CheckAllPanel
                text={editorText}
                disabled={!online}
                onIssueCountChange={setIssueCount}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="autokey-panel">
          <CardContent className="p-5">
            <Tabs defaultValue="space">
              <TabsList className="grid h-10 w-full grid-cols-3 rounded-full">
                <TabsTrigger value="space" className="rounded-full">
                  Auto-Space
                </TabsTrigger>
                <TabsTrigger value="levenshtein" className="rounded-full">
                  Levenshtein
                </TabsTrigger>
                <TabsTrigger value="smart-trim" className="rounded-full">
                  Smart Trim
                </TabsTrigger>
              </TabsList>
              <TabsContent value="space" className="mt-5">
                <SegmentPanel />
              </TabsContent>
              <TabsContent value="levenshtein" className="mt-5">
                <LevenshteinPanel />
              </TabsContent>
              <TabsContent value="smart-trim" className="mt-5">
                <SmartTrimPanel text={editorText} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
