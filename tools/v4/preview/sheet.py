#!/usr/bin/env python3
"""Contact sheet of every rendered layout (review aid): python3 tools/v4/preview/sheet.py light|dark out.png"""
import sys, glob
from pathlib import Path
from PIL import Image, ImageDraw
D = Path(__file__).parent / "out"; theme = sys.argv[1]; names = ["TokenOverviewV4", "ModelRankingV4", "ModelFocusV4", "UsageRhythmV4", "ActivityCacheV4", "CacheHealthV4", "ResponsePulseV4"]
k = 0.5; pad = 20; rowH = int(354 * 3 * k) + pad; S = Image.new("RGB", (int((158 + 338 + 338) * 3 * k) + pad * 4, rowH * len(names) + pad), "#888" if theme == "light" else "#000")
for r, n in enumerate(names):
    x = pad
    for fam in ["small", "medium", "large"]:
        im = Image.open(D / f"{n}-{fam}-{theme}.png"); im = im.resize((int(im.width * k), int(im.height * k)), Image.LANCZOS)
        m = Image.new("L", im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=int(22 * 3 * k), fill=255)
        S.paste(im, (x, pad + r * rowH), m); x += im.width + pad
S.save(sys.argv[2])
