#!/usr/bin/env python3
"""Compose README imagery from the rendered widgets (tools/v4/preview/out): a light + dark home-screen hero and two full galleries.
All values come from tools/v4/demo_payload.json, which is fictional."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont
ROOT = Path(__file__).resolve().parents[3]; OUT = Path(__file__).parent / "out"; import os
VER = os.environ.get("TT_VERSION", "V4"); A = ROOT / "assets" / VER.lower(); A.mkdir(parents=True, exist_ok=True)
INTER = "/usr/share/fonts/opentype/inter/Inter-{}.otf"; CJK = "/usr/share/fonts/opentype/noto/NotoSansCJK-{}.ttc"
def font(w, s, cjk=False): return ImageFont.truetype(CJK.format(w) if cjk else INTER.format(w), s, index=2 if cjk else 0)
def widget(name, fam, theme, k):
    im = Image.open(OUT / f"{name.replace('V4', VER)}-{fam}-{theme}.png").convert("RGBA"); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    m = Image.new("L", im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=round(23 * 3 * k), fill=255); im.putalpha(m); return im
def shadowed(base, im, xy, k, dark):
    sh = Image.new("RGBA", (im.width + 120, im.height + 120), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle([60, 70, 60 + im.width, 70 + im.height], radius=round(23 * 3 * k), fill=(0, 0, 0, 110 if dark else 46))
    sh = sh.filter(ImageFilter.GaussianBlur(28)); base.alpha_composite(sh, (xy[0] - 60, xy[1] - 60)); base.alpha_composite(im, xy)
def wallpaper(w, h, dark):
    top, bot = ((38, 33, 30), (12, 11, 10)) if dark else ((236, 226, 212), (214, 200, 186))
    if VER == "V5": top, bot = ((22, 21, 20), (10, 10, 9)) if dark else ((231, 222, 206), (220, 208, 190))
    im = Image.new("RGBA", (w, h)); d = ImageDraw.Draw(im)
    for y in range(h): t = y / h; d.line([(0, y), (w, y)], fill=tuple(round(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (255,))
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0)); ImageDraw.Draw(glow).ellipse([-w * .3, -h * .15, w * .9, h * .45], fill=(232, 137, 106, (70 if dark else 60) if VER == "V4" else (26 if dark else 30))); return Image.alpha_composite(im, glow.filter(ImageFilter.GaussianBlur(w * .12)))
def phone(theme, k=2.0):
    dark = theme == "dark"; W, H = round(393 * k), round(852 * k); scr = wallpaper(W, H, dark); d = ImageDraw.Draw(scr)
    d.text((round(46 * k), round(20 * k)), "9:41", font=font("SemiBold", round(16 * k)), fill=(255, 255, 255) if dark else (28, 26, 23))
    d.rounded_rectangle([W / 2 - 62 * k, 11 * k, W / 2 + 62 * k, 47 * k], radius=18 * k, fill=(0, 0, 0))
    m, g, top = 27.5 * k, 22 * k, 64 * k; s3 = k / 3
    layout = [("TokenOverviewV4", "small", m, top), ("CacheHealthV4" if VER == "V4" else "ResponsePulseV4", "small", m + 158 * k + g, top), ("ModelRankingV4", "medium", m, top + 158 * k + g), ("TokenOverviewV4", "large", m, top + 2 * (158 * k + g))]
    for n, fam, x, y in layout: shadowed(scr, widget(n, fam, theme, s3), (round(x), round(y)), s3, dark)
    mask = Image.new("L", scr.size, 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, W - 1, H - 1], radius=round(54 * k), fill=255)
    frame = Image.new("RGBA", (W + round(24 * k), H + round(24 * k)), (0, 0, 0, 0)); fd = ImageDraw.Draw(frame)
    fd.rounded_rectangle([0, 0, frame.width - 1, frame.height - 1], radius=round(66 * k), fill=(22, 21, 20)); fd.rounded_rectangle([3, 3, frame.width - 4, frame.height - 4], radius=round(64 * k), outline=(70, 66, 62), width=3)
    scr.putalpha(mask); frame.alpha_composite(scr, (round(12 * k), round(12 * k))); return frame
# ---------- hero: light + dark phones on a warm canvas ----------
HW, HH = 2400, 1900; hero = Image.new("RGBA", (HW, HH), (246, 243, 238, 255) if VER == "V4" else (250, 249, 245, 255)); hd = ImageDraw.Draw(hero)
for i, th in enumerate(["light", "dark"]):
    ph = phone(th, 1.9); x = 330 + i * 900; sh = Image.new("RGBA", (ph.width + 200, ph.height + 200), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle([100, 130, 100 + ph.width, 100 + ph.height], radius=130, fill=(60, 40, 25, 70)); sh = sh.filter(ImageFilter.GaussianBlur(40))
    hero.alpha_composite(sh, (x - 100, 150 - 100)); hero.alpha_composite(ph, (x, 150))
hd.text((HW / 2, 70), "TOKEN TRACKER V5 · 纸与墨 PAPER & INK" if VER == "V5" else "TOKEN TRACKER V4 · ATELIER", font=font("Medium", 34, cjk=True), fill=(28, 26, 23), anchor="mm")
hd.text((HW / 2, HH - 52), f"Rendered from the real {VER} scripts · all values are fictional demo data", font=font("Regular", 26), fill=(150, 142, 132), anchor="mm")
hero.convert("RGB").save(A / "hero.png", optimize=True)
# ---------- galleries: every layout, one sheet per theme ----------
NAMES = [("TokenOverviewV4", "总览 Overview"), ("ModelRankingV4", "排行 Ranking"), ("ModelFocusV4", "档案 Model Focus"), ("UsageRhythmV4", "节奏 Rhythm"), ("ActivityCacheV4", "活动 Activity"), ("CacheHealthV4", "缓存 Cache"), ("ResponsePulseV4", "响应 Pulse")]
for th in ["light", "dark"]:
    dark = th == "dark"; k = .6; s3 = k; pad = 56; colw = [158, 338, 338]; rowh = 354 * 3 * k + 110
    G = Image.new("RGBA", (round(sum(colw) * 3 * k + pad * 4), round(rowh * len(NAMES) + pad * 2)), (20, 19, 17, 255) if dark else (240, 236, 229, 255)); gd = ImageDraw.Draw(G)
    for r, (n, title) in enumerate(NAMES):
        y = pad + r * rowh; gd.text((pad, y), title, font=font("Medium", 34, cjk=True), fill=(240, 236, 228) if dark else (40, 36, 32)); x = pad
        for fam, cw in zip(["small", "medium", "large"], colw):
            shadowed(G, widget(n, fam, th, s3 / 3 * 3 / 3 * 3), (round(x), round(y + 64)), s3, dark) if False else shadowed(G, widget(n, fam, th, k), (round(x), round(y + 64)), k, dark); x += cw * 3 * k + pad
    G.convert("RGB").save(A / f"gallery-{th}.png", optimize=True)
print("wrote", sorted(p.name for p in A.iterdir()))
