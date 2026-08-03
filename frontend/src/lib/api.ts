const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type HealthResponse = {
  ok: boolean;
  dictionary_loaded: boolean;
  word_count: number;
};

export type TrieStats = {
  word_count: number;
  node_count: number;
  average_depth: number;
  estimated_memory_bytes: number;
};

export type Suggestion = {
  word: string;
  frequency: number;
};

export type SpellSuggestion = Suggestion & {
  distance: number;
};

export type InvalidWord = {
  word: string;
  start: number;
  end: number;
  suggestions: SpellSuggestion[];
};

export type SegmentResult = {
  success: boolean;
  segmented_text: string;
  dp: Array<number | null>;
  traceback: Array<{
    start: number;
    end: number;
    word: string;
    cost: number;
  }>;
  message: string;
};

export type SmartTrimResult = {
  success: boolean;
  trimmed_text: string;
  kept_words: Array<{
    index: number;
    word: string;
    weight: number;
    value: number;
  }>;
  total_characters: number;
  total_value: number;
  dp: number[][];
  traceback: Array<{
    index: number;
    word: string;
    remaining_capacity: number;
    value: number;
  }>;
  message: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getHealth: () => request<HealthResponse>("/health"),
  getStats: () => request<TrieStats>("/stats"),
  getAutocomplete: (prefix: string, limit = 5) =>
    request<{ suggestions: Suggestion[] }>(
      `/autocomplete?prefix=${encodeURIComponent(prefix)}&limit=${limit}`,
    ),
  validateWord: (word: string) =>
    request<{ word: string; valid: boolean }>(
      `/validate?word=${encodeURIComponent(word)}`,
    ),
  getSpellSuggestions: (word: string, limit = 5) =>
    request<{ suggestions: SpellSuggestion[] }>(
      `/spell-suggestions?word=${encodeURIComponent(word)}&limit=${limit}`,
    ),
  checkAll: (text: string) =>
    request<{ invalid_words: InvalidWord[] }>("/check-all", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  segment: (text: string) =>
    request<SegmentResult>("/segment", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  smartTrim: (text: string, maxCharacters: number) =>
    request<SmartTrimResult>("/smart-trim", {
      method: "POST",
      body: JSON.stringify({
        text,
        max_characters: maxCharacters,
      }),
    }),
  addWord: (word: string) =>
    request<{ word: string; added: boolean; valid: boolean }>("/dictionary/add", {
      method: "POST",
      body: JSON.stringify({ word }),
    }),
};
