"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type UIEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { SpellSuggestion, Suggestion } from "@/lib/api";
import { api } from "@/lib/api";
import {
  getCurrentWord,
  getWordTokens,
  isWordBoundary,
  type Token,
} from "@/lib/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutocompleteMenu } from "@/components/editor/autocomplete-menu";
import { CorrectionMenu } from "@/components/editor/correction-menu";

type AutokeyEditorProps = {
  text: string;
  onTextChange: (text: string) => void;
};

type CorrectionState = {
  token: Token;
  suggestions: SpellSuggestion[];
};

function tokenKey(token: Token) {
  return `${token.start}:${token.end}:${token.value}`;
}

function renderEditorHighlights(text: string, invalidTokens: Token[]) {
  if (text.length === 0) {
    return null;
  }

  const orderedTokens = [...invalidTokens].sort((first, second) => {
    return first.start - second.start;
  });
  const parts: ReactNode[] = [];
  let cursor = 0;

  orderedTokens.forEach((token) => {
    if (token.start > cursor) {
      parts.push(
        <span key={`text-${cursor}`}>{text.slice(cursor, token.start)}</span>,
      );
    }

    parts.push(
      <span key={tokenKey(token)} className="autokey-inline-invalid">
        {text.slice(token.start, token.end)}
      </span>,
    );
    cursor = token.end;
  });

  if (cursor < text.length) {
    parts.push(<span key={`text-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return parts;
}

function getCaretOffset(container: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return 0;
  }

  const range = selection.getRangeAt(0);
  const prefix = range.cloneRange();
  prefix.selectNodeContents(container);
  prefix.setEnd(range.endContainer, range.endOffset);
  return prefix.toString().length;
}

function setCaretOffset(container: HTMLElement, offset: number) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node = walker.nextNode();

  while (node) {
    const textNode = node as Text;
    const length = textNode.data.length;
    if (remaining <= length) {
      const range = document.createRange();
      range.setStart(textNode, remaining);
      range.collapse(true);

      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }

    remaining -= length;
    node = walker.nextNode();
  }

  const range = document.createRange();
  range.selectNodeContents(container);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export function AutokeyEditor({ text, onTextChange }: AutokeyEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const nextCaretOffset = useRef<number | null>(null);
  const [invalidKeys, setInvalidKeys] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [correction, setCorrection] = useState<CorrectionState | null>(null);
  const [status, setStatus] = useState("Ready");

  const tokens = useMemo(() => getWordTokens(text), [text]);
  const invalidTokens = useMemo(
    () => tokens.filter((token) => invalidKeys.has(tokenKey(token))),
    [invalidKeys, tokens],
  );
  const highlightedText = useMemo(
    () => renderEditorHighlights(text, invalidTokens),
    [invalidTokens, text],
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (editor.innerText.replace(/\r/g, "") !== text) {
      editor.innerText = text;
    }

    const offset = nextCaretOffset.current;
    if (offset === null) {
      return;
    }

    setCaretOffset(editor, offset);
    nextCaretOffset.current = null;
  }, [text]);

  async function updateAutocomplete(nextText: string, caretOffset: number) {
    const currentWord = getCurrentWord(nextText, caretOffset);
    if (!currentWord) {
      setSuggestions([]);
      return;
    }

    const prefix = nextText.slice(currentWord.start, caretOffset).toLowerCase();
    if (prefix.length === 0) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await api.getAutocomplete(prefix, 5);
      setSuggestions(response.suggestions);
      setActiveSuggestion(0);
    } catch {
      setSuggestions([]);
    }
  }

  async function validateCompletedWords(nextText: string) {
    const nextTokens = getWordTokens(nextText);
    const results = await Promise.all(
      nextTokens.map(async (token) => {
        try {
          const response = await api.validateWord(token.value);
          return { token, valid: response.valid };
        } catch {
          return { token, valid: true };
        }
      }),
    );

    setInvalidKeys(
      new Set(
        results
          .filter((result) => !result.valid)
          .map((result) => tokenKey(result.token)),
      ),
    );
  }

  function handleInput(event: FormEvent<HTMLDivElement>) {
    const editor = event.currentTarget;
    const nextText = editor.innerText.replace(/\r/g, "");
    const caretOffset = getCaretOffset(editor);

    nextCaretOffset.current = caretOffset;
    onTextChange(nextText);
    setCorrection(null);
    void updateAutocomplete(nextText, caretOffset);

    if (isWordBoundary(nextText)) {
      void validateCompletedWords(nextText);
    }
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const highlights = highlightRef.current;
    if (!highlights) {
      return;
    }

    highlights.scrollTop = event.currentTarget.scrollTop;
    highlights.scrollLeft = event.currentTarget.scrollLeft;
  }

  function handleClick() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const caretOffset = getCaretOffset(editor);
    const token = invalidTokens.find((item) => {
      return caretOffset >= item.start && caretOffset <= item.end;
    });

    if (token) {
      void openCorrectionMenu(token);
    }
  }

  function replaceToken(token: Token, replacement: string) {
    const nextText = `${text.slice(0, token.start)}${replacement}${text.slice(
      token.end,
    )}`;
    nextCaretOffset.current = token.start + replacement.length;
    onTextChange(nextText);
    setSuggestions([]);
    setCorrection(null);
    void validateCompletedWords(nextText);
  }

  function completeCurrentWord(word: string) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const caretOffset = getCaretOffset(editor);
    const currentWord = getCurrentWord(text, caretOffset);
    if (!currentWord) {
      return;
    }

    replaceToken(currentWord, word);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion(
        (current) => (current - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }

    if (event.key === "Tab" || event.key === "Enter") {
      event.preventDefault();
      completeCurrentWord(suggestions[activeSuggestion].word);
    }
  }

  async function openCorrectionMenu(token: Token) {
    setStatus(`Checking "${token.value}"`);
    try {
      const response = await api.getSpellSuggestions(token.value, 5);
      setCorrection({ token, suggestions: response.suggestions });
      setStatus("Ready");
    } catch {
      setCorrection({ token, suggestions: [] });
      setStatus("Suggestion service unavailable");
    }
  }

  async function addWord(word: string) {
    try {
      await api.addWord(word);
      setInvalidKeys((current) => {
        const next = new Set(current);
        for (const key of current) {
          if (key.endsWith(`:${word}`)) {
            next.delete(key);
          }
        }
        return next;
      });
      setCorrection(null);
      setStatus(`Added "${word}" for this session`);
    } catch {
      setStatus("Could not add word");
    }
  }

  return (
    <Card className="autokey-panel relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="autokey-accent-dot h-2 w-2 rounded-full"
              aria-hidden="true"
            />
            <CardTitle className="text-base">Teks Editor</CardTitle>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            {status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="relative rounded-[22px] border bg-background">
          <div
            ref={highlightRef}
            aria-hidden="true"
            className="autokey-highlight-layer pointer-events-none absolute inset-0 overflow-hidden p-6 text-lg leading-8"
          >
            {highlightedText}
          </div>
          <div
            ref={editorRef}
            role="textbox"
            aria-label="AutoKey editor"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            data-placeholder="Tulis teks di sini..."
            className="autokey-editor relative z-10 min-h-64 w-full overflow-auto whitespace-pre-wrap rounded-[22px] bg-transparent p-6 text-lg leading-8 outline-none"
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            onClick={handleClick}
          />
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Ketik untuk autocomplete. Klik kata bergaris merah untuk koreksi.
        </p>

        <AutocompleteMenu
          suggestions={suggestions}
          activeIndex={activeSuggestion}
          onPick={completeCurrentWord}
        />

        {correction ? (
          <CorrectionMenu
            word={correction.token.value}
            suggestions={correction.suggestions}
            onPick={(word) => replaceToken(correction.token, word)}
            onAdd={addWord}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
