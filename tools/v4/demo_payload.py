#!/usr/bin/env python3
"""Build a FICTIONAL /v3 payload for previews by running the real analytics on synthetic events.
No real usage, endpoint or account data is involved. python3 tools/v4/demo_payload.py -> tools/v4/demo_payload.json"""
import json, math, random, sys, tempfile
from datetime import datetime, timedelta
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]; sys.path.insert(0, str(ROOT / "backend"))
import analytics
from store import Store
from sources import to_event

MODELS = [("gpt-5.6", .44, 18, .84), ("claude-opus-4-8", .22, 26, .91), ("kimi-k2.5", .11, 9, .72), ("deepseek-v4", .09, 7, .66), ("glm-5", .06, 8, .61), ("qwen3-max", .05, 11, .58), ("gemini-3.1-pro", .03, 14, .49)]
random.seed(51)
with tempfile.TemporaryDirectory() as d:
    store = Store(Path(d) / "demo.db"); analytics.SOURCES = {"relay_a": {"label": "Relay A"}, "relay_b": {"label": "Relay B"}}
    now = datetime(2026, 10, 23, 16, 40, tzinfo=store.tz); events = []; rid = 0
    for back in range(179, -1, -1):
        day = now - timedelta(days=back)
        if back > 2 and random.random() < .2 and back not in range(0, 44): continue        # a 44-day streak, some gaps before it
        trend = 1 + .9 * (1 - back / 180) + .25 * math.sin(back / 6.0); n = int(random.uniform(70, 120) * trend)
        if back == 0: n = int(n * .72)
        for i in range(n):
            m = random.choices(MODELS, weights=[x[1] for x in MODELS])[0]; rid += 1
            ts = int((day.replace(hour=0, minute=0) + timedelta(minutes=random.uniform(0, 990 if back == 0 else 1430))).timestamp())
            prompt = int(random.lognormvariate(11.7, .55) * (1.6 if m[0].startswith(("gpt", "claude")) else 1)); comp = int(prompt * random.uniform(.03, .09))
            item = {"request_id": f"demo-{rid}", "created_at": ts, "model_name": m[0], "prompt_tokens": prompt, "completion_tokens": comp,
                    "cache_read_tokens": int(prompt * m[3] * random.uniform(.9, 1.05)), "cache_creation_tokens": int(prompt * random.uniform(.01, .05)),
                    "use_time": round(max(.4, random.gauss(m[2], m[2] * .25)), 2), "type": 2}
            events.append(to_event(item, store, random.choice(["relay_a", "relay_a", "relay_b"])))
    store.upsert_events(events); store.set_state("last_sync", {"ok": True})
    payload = analytics.build_v3(store, now=now)
    payload["meta"]["last_sync_at"] = int(now.timestamp()) - 95; payload["meta"]["status"] = "live"; payload["meta"]["generated_at"] = int(now.timestamp())
    payload["meta"]["fictional"] = "ALL VALUES ARE FICTIONAL · PUBLIC DEMO ONLY"
out = ROOT / "tools" / "v4" / "demo_payload.json"; out.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
s = payload["summary"]; print("events", len(events), "today", s["today"]["tokens"], "all", s["all_time_total"], "streak", s["current_streak"], "size", out.stat().st_size)
