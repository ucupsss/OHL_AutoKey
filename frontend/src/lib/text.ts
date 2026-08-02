export type Token = {
  value: string;
  start: number;
  end: number;
};

const WORD_PATTERN = /[^\W\d_]+/gu;

export function getWordTokens(text: string): Token[] {
  return Array.from(text.matchAll(WORD_PATTERN), (match) => ({
    value: match[0].toLowerCase(),
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));
}

export function getCurrentWord(text: string, caretIndex: number): Token | null {
  const tokens = getWordTokens(text);
  return (
    tokens.find((token) => token.start <= caretIndex && caretIndex <= token.end) ??
    null
  );
}

export function isWordBoundary(value: string) {
  return /[\s.,;:!?()[\]{}"'`-]$/.test(value);
}
