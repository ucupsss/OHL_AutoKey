from app.trie import Trie


def test_trie_insert_search_and_prefix():
    trie = Trie()

    trie.insert("program", 100)
    trie.insert("programmer", 50)

    assert trie.search("program") is True
    assert trie.search("prog") is False
    assert trie.starts_with("prog") is True
    assert trie.starts_with("xyz") is False


def test_trie_suggestions_sorted_by_frequency_then_word():
    trie = Trie()
    trie.insert("prosa", 10)
    trie.insert("program", 100)
    trie.insert("proyek", 100)
    trie.insert("prima", 300)

    suggestions = trie.get_suggestions("pro", 3)

    assert [item.word for item in suggestions] == ["program", "proyek", "prosa"]
    assert [item.frequency for item in suggestions] == [100, 100, 10]


def test_trie_stats_for_known_words():
    trie = Trie()
    trie.insert("a", 1)
    trie.insert("ab", 1)

    stats = trie.stats()

    assert stats.word_count == 2
    assert stats.node_count == 3
    assert stats.average_depth == 1.5
    assert stats.estimated_memory_bytes == stats.node_count * 64
