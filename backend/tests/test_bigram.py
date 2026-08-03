from app.bigram import BigramModel
from app.trie import Suggestion


def test_bigram_observe_counts_valid_pairs():
    model = BigramModel()

    model.observe("program", "dinamis")
    model.observe("program", "dinamis")
    model.observe("program", "algoritma")

    stats = model.stats()

    assert stats.pair_count == 3
    assert stats.context_count == 1
    assert model.probability("program", "dinamis") == 2 / 3
    assert model.probability("program", "algoritma") == 1 / 3


def test_bigram_reranks_candidates_by_context_score():
    model = BigramModel()
    model.observe("program", "dinamis")
    model.observe("program", "dinamis")
    model.observe("program", "algoritma")
    candidates = [
        Suggestion(word="algoritma", frequency=100),
        Suggestion(word="dinamis", frequency=1),
    ]

    reranked = model.rerank("program", candidates)

    assert [item.word for item in reranked] == ["algoritma", "dinamis"]


def test_bigram_rerank_falls_back_when_context_has_no_candidate_match():
    model = BigramModel()
    model.observe("program", "dinamis")
    candidates = [
        Suggestion(word="proyek", frequency=20),
        Suggestion(word="prosa", frequency=10),
    ]

    reranked = model.rerank("program", candidates)

    assert reranked == candidates
