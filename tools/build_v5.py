#!/usr/bin/env python3
"""Build the seven standalone V5 Scriptable widgets from src/v5/core.js.
Each output is self-contained (Scriptable widgets cannot share code without extra files): header + WIDGET id + core."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
CORE = (ROOT / "src" / "v5" / "core.js").read_text()
WIDGETS = [  # file, id, icon colour, glyph, one-line purpose
    ("TokenOverviewV5", "overview", "orange", "chart-area", "today, projection, 30-day trend and Top models"),
    ("ModelRankingV5", "ranking", "orange", "list-ol", "model ranking by period and source · parameter: 7d,all"),
    ("ModelFocusV5", "focus", "orange", "bullseye", "one ranked model in depth · parameter: 1,today,all"),
    ("UsageRhythmV5", "rhythm", "orange", "chart-bar", "seven-day rhythm, average, peak and projection"),
    ("ActivityCacheV5", "activity", "orange", "calendar-alt", "180-day activity calendar and streaks"),
    ("CacheHealthV5", "cache", "orange", "database", "cache read / create / basis and hit rate · parameter: today,all"),
    ("ResponsePulseV5", "pulse", "orange", "heartbeat", "requests and mean positive use_time · parameter: 7d,all"),
]
for name, wid, color, glyph, purpose in WIDGETS:
    head = ("// Variables used by Scriptable.\n// These must be at the very top of the file. Do not edit.\n"
            f"// icon-color: {color}; icon-glyph: {glyph};\n"
            f"/* Token Tracker V5 · Paper & Ink — {name}\n * {purpose}\n * Generated from src/v5/core.js by tools/build_v5.py — edit the core, then rebuild. */\n")
    (ROOT / "scriptable" / f"{name}.js").write_text(head + f'const WIDGET = "{wid}";\n' + CORE)
    print("built", name)
