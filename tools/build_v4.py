#!/usr/bin/env python3
"""Build the seven standalone V4 Scriptable widgets from src/v4/core.js.
Each output is self-contained (Scriptable widgets cannot share code without extra files): header + WIDGET id + core."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
CORE = (ROOT / "src" / "v4" / "core.js").read_text()
WIDGETS = [  # file, id, icon colour, glyph, one-line purpose
    ("TokenOverviewV4", "overview", "deep-brown", "chart-area", "today, projection, 30-day trend and Top models"),
    ("ModelRankingV4", "ranking", "deep-brown", "list-ol", "model ranking by period and source · parameter: 7d,all"),
    ("ModelFocusV4", "focus", "deep-brown", "bullseye", "one ranked model in depth · parameter: 1,today,all"),
    ("UsageRhythmV4", "rhythm", "deep-brown", "chart-bar", "seven-day rhythm, average, peak and projection"),
    ("ActivityCacheV4", "activity", "deep-brown", "calendar-alt", "180-day activity calendar and streaks"),
    ("CacheHealthV4", "cache", "deep-green", "database", "cache read / create / basis and hit rate · parameter: today,all"),
    ("ResponsePulseV4", "pulse", "deep-blue", "heartbeat", "requests and mean positive use_time · parameter: 7d,all"),
]
for name, wid, color, glyph, purpose in WIDGETS:
    head = ("// Variables used by Scriptable.\n// These must be at the very top of the file. Do not edit.\n"
            f"// icon-color: {color}; icon-glyph: {glyph};\n"
            f"/* Token Tracker V4 · Atelier — {name}\n * {purpose}\n * Generated from src/v4/core.js by tools/build_v4.py — edit the core, then rebuild. */\n")
    (ROOT / "scriptable" / f"{name}.js").write_text(head + f'const WIDGET = "{wid}";\n' + CORE)
    print("built", name)
