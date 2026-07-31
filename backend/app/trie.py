from __future__ import annotations

from dataclasses import dataclass, field


BYTES_PER_NODE = 64


@dataclass(frozen=True)
class Suggestion:
    word: str
    frequency: int


@dataclass(frozen=True)
class TrieStats:
    word_count: int
    node_count: int
    average_depth: float
    estimated_memory_bytes: int


@dataclass
class TrieNode:
    children: dict[str, "TrieNode"] = field(default_factory=dict)
    is_word: bool = False
    word: str | None = None
    frequency: int = 0


class Trie:
    def __init__(self) -> None:
        self.root = TrieNode()
        self.word_count = 0
        self.node_count = 1
        self.total_word_depth = 0

    def insert(self, word: str, frequency: int) -> None:
        normalized = word.strip().lower()
        if not normalized:
            return

        node = self.root
        for char in normalized:
            if char not in node.children:
                node.children[char] = TrieNode()
                self.node_count += 1
            node = node.children[char]

        if not node.is_word:
            self.word_count += 1
            self.total_word_depth += len(normalized)

        node.is_word = True
        node.word = normalized
        node.frequency = max(1, int(frequency))

    def search(self, word: str) -> bool:
        node = self._find_node(word)
        return node is not None and node.is_word

    def starts_with(self, prefix: str) -> bool:
        return self._find_node(prefix) is not None

    def get_suggestions(self, prefix: str, top_n: int = 5) -> list[Suggestion]:
        normalized = prefix.strip().lower()
        if not normalized:
            return []

        node = self._find_node(normalized)
        if node is None:
            return []

        suggestions: list[Suggestion] = []
        self._collect_words(node, suggestions)
        suggestions.sort(key=lambda item: (-item.frequency, item.word))
        return suggestions[:top_n]

    def stats(self) -> TrieStats:
        average_depth = (
            self.total_word_depth / self.word_count if self.word_count else 0.0
        )
        return TrieStats(
            word_count=self.word_count,
            node_count=self.node_count,
            average_depth=average_depth,
            estimated_memory_bytes=self.node_count * BYTES_PER_NODE,
        )

    def _find_node(self, text: str) -> TrieNode | None:
        node = self.root
        for char in text.strip().lower():
            if char not in node.children:
                return None
            node = node.children[char]
        return node

    def _collect_words(self, node: TrieNode, suggestions: list[Suggestion]) -> None:
        if node.is_word and node.word is not None:
            suggestions.append(Suggestion(node.word, node.frequency))
        for child in node.children.values():
            self._collect_words(child, suggestions)
