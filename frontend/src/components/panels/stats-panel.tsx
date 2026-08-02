"use client";

import type { TrieStats } from "@/lib/api";
import { Separator } from "@/components/ui/separator";

type StatsPanelProps = {
  stats: TrieStats | null;
  loading: boolean;
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

function statValue(
  stats: TrieStats | null,
  loading: boolean,
  getValue: (stats: TrieStats) => string,
) {
  if (loading) {
    return "Loading";
  }
  return stats ? getValue(stats) : "-";
}

export function StatsPanel({ stats, loading }: StatsPanelProps) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Inserted words</span>
        <span className="font-medium">
          {statValue(stats, loading, (value) => formatNumber(value.word_count))}
        </span>
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Nodes</span>
        <span className="font-medium">
          {statValue(stats, loading, (value) => formatNumber(value.node_count))}
        </span>
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Average depth</span>
        <span className="font-medium">
          {statValue(stats, loading, (value) => value.average_depth.toFixed(2))}
        </span>
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Memory estimate</span>
        <span className="font-medium">
          {statValue(stats, loading, (value) =>
            formatBytes(value.estimated_memory_bytes),
          )}
        </span>
      </div>
    </div>
  );
}
