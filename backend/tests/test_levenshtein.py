from app.levenshtein import (
    find_spell_suggestions,
    levenshtein_distance,
    levenshtein_table,
)


def test_levenshtein_distance_known_pairs():
    assert levenshtein_distance("kitten", "sitting") == 3
    assert levenshtein_distance("program", "program") == 0
    assert levenshtein_distance("buku", "buka") == 1


def test_levenshtein_table_contains_basis_values():
    table = levenshtein_table("ab", "abc")

    assert table[0] == [0, 1, 2, 3]
    assert [row[0] for row in table] == [0, 1, 2]
    assert table[-1][-1] == 1


def test_spell_suggestions_filter_and_sort():
    words = {
        "program": 10,
        "progran": 100,
        "diagram": 500,
        "xyz": 999,
    }

    suggestions = find_spell_suggestions("program", words, max_distance=2, limit=3)

    assert [item.word for item in suggestions] == ["program", "progran"]
    assert [item.distance for item in suggestions] == [0, 1]
