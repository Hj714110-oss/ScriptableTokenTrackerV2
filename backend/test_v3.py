import tempfile
from pathlib import Path

import analytics
from store import Store
from sources import normalize_model, to_event


with tempfile.TemporaryDirectory() as directory:
    store = Store(Path(directory) / "test.db")
    analytics.SOURCES = {"relay": {"label": "Test Relay"}}
    base = {
        "request_id": "same",
        "created_at": 1785819330,
        "model_name": "claude-opus-4-8",
        "prompt_tokens": 100,
        "completion_tokens": 25,
        "cache_read_tokens": 300,
        "cache_creation_tokens": 11,
        "other": {"cache_tokens": 300},
        "use_time": 2.5,
        "type": 2,
    }
    first = to_event(base, store, "relay")
    second = to_event(base, store, "relay")
    assert first["event_key"] == "relay:same"
    assert first["cache_tokens"] == 300
    assert first["cache_creation_tokens"] == 11
    assert first["prompt_tokens"] + first["completion_tokens"] == 125
    assert first["request_count"] == 1
    assert normalize_model("claude-opus-4-6-A") == "claude-opus-4-6"
    assert normalize_model("claude-opus-4-7-thinking-A") == "claude-opus-4-7-thinking"
    assert normalize_model("demo-model") == "demo-model"
    assert store.upsert_events([first, second]) == 2
    assert store.event_count() == 1
    output = analytics.build_v3(store)
    assert output["version"] == 3
    assert set(output["sources"]) == {"relay"}
    assert output["summary"]["all_time_total"] == 125
    assert output["historical_models"][0]["requests"] == 1
    assert output["historical_models"][0]["avg_latency"] == 2.5
    assert output["historical_models"][0]["model"] == "claude-opus-4-8"
    assert output["historical_models"][0]["source_breakdown"][0]["source"] == "relay"
    assert len(output["historical_models"][0]["history_30d"]) == 30
    print("V3 SYNTHETIC OK")
