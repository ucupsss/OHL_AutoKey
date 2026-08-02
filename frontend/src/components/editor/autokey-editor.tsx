"use client";

import {
  type FormEvent,
  type KeyboardEvent,
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
    <Card className="relative border-[color:color-mix(in_oklch,var(--autokey-accent)_18%,var(--border))]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="autokey-accent-dot h-2 w-2 rounded-full"
              aria-hidden="true"
            />
            <CardTitle>Editor</CardTitle>
          </div>
          <span className="autokey-accent-text text-xs">{status}</span>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div
          ref={editorRef}
          role="textbox"
          aria-label="AutoKey editor"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          className="autokey-editor min-h-72 w-full whitespace-pre-wrap rounded-md border bg-background p-4 text-base leading-7 outline-none"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
        />

        {invalidTokens.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {invalidTokens.map((token) => (
              <button
                key={tokenKey(token)}
                type="button"
                className="autokey-invalid-token rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-sm text-destructive"
                onMouseDown={(event) => {
                  event.preventDefault();
                  void openCorrectionMenu(token);
                }}
              >
                {text.slice(token.start, token.end)}
              </button>
            ))}
          </div>
        ) : null}

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
