# Token Tracker Design

## V5 · 纸与墨 Paper & Ink (current)

**Direction.** A token ledger kept on paper. Serif numbers, a pen that marks *today*, hatched past days, ink dots for activity, dotted leaders in a ranking that reads like an account book, and an original pixel paper crane that shows the sync state.

| Role | Day | Night |
|---|---|---|
| Paper | `#FAF9F5` + 22 pt ruled lines at 3.5 % ink | `#1E1D1B` + lines at 3 % |
| Ink / sub / faint | `#141413` / `#5E5D59` / `#7A7872` | `#F0EEE6` / `#A6A39B` / `#7D7A73` |
| Today (marks / text) | clay `#D97757` / `#A4492A` | `#E08A6A` / `#E8957A` |
| Cache · latency · projection | sage `#3F6B4C` · indigo `#34509A` · amber `#B07A22` | `#8DB99A` · `#9AACEF` · `#E6B865` |

**Type.**
- Georgia for numbers and italic notes; Songti SC for Chinese titles.
- The system sans for labels, and system mono for ledger digits.

**Model icons.**
- **Slot:** a round slot per model family that shows the user's own image from `TokenTracker/icons/`.
- **Default:** without an image, an initial stamp in the family colour.
- **Public images:** they only ever show the stamps.

**Public imagery.** Everything under `assets/v5/` is rendered from the real scripts on fictional data.

---

## V4 · Atelier

**Direction.** A quiet ledger: warm paper, deep ink and one accent. The numbers are the hero. Ornament exists only where it carries data: a ring for a ratio, a glow on *today*, a hatched bar for a projection.

**Tokens**

| Role | Light | Dark |
|---|---|---|
| Canvas | `#F6F3EE` (+ soft top-left light) | `#141311` |
| Ink / sub / faint | `#1C1A17` / `#6E685F` / `#A8A197` | `#F3EFE8` / `#A7A097` / `#6F6A62` |
| Hairline / track | `#E3DDD3` / `#ECE7DF` | `#2B2825` / `#262320` |
| Accent: today, primary | clay `#D2693F` | `#E8896A` |
| Cache | sage `#5E8F6B` | `#8CBB97` |
| Requests / latency | indigo `#5468C4` | `#93A3F2` |
| Projection | amber `#D8962F` | `#E9B661` |
| Rank order | clay → indigo → sage → amber → plum | same order, lifted |

**Type.**
- Main numbers use SF Pro Rounded Bold (24–46 pt) and shrink, never clip.
- Titles use SF Pro Semibold 13 pt.
- Labels use SF Pro Medium 8–9 pt in the sub colour.
- Tabular figures use SF Mono Medium.

**Grid.**
- 14–16 pt outer margin.
- Tiles have a 12 pt radius at 4–5.5 % ink.
- Hairlines are 0.7 pt.

**Charts.**
- Bars are rounded; only today's bar is accented, the rest are faint.
- The average is a dashed line, and the projection is hatched above today's bar.
- Areas fade vertically.
- Rings have round caps.
- The activity calendar uses five steps of clay.

**States.** The header always shows one of: live (sage dot with glow), cached (indigo), stale (amber), offline (red). Empty and error states get their own centered composition.

**Public imagery.** Every image under `assets/v4/` is rendered from the real scripts on fictional data (`tools/v4/demo_payload.json`). Never replace it with a production screenshot.

---

## V3 · Pixel Edition (kept for compatibility)

## Direction

V3 is a practical iOS Scriptable dashboard, not a marketing illustration. The public preview should make the installed experience immediately recognizable: black iOS canvas, warm off-white widget cards, compact status markers, restrained terracotta accents and small pixel motifs.

The reference composition is four Small widgets followed by the three larger V3 views:

1. Overview
2. Model Focus
3. Cache Health
4. Response Pulse
5. Model Ranking
6. Activity Cache
7. Usage Rhythm

The preview is a presentation aid only. It must never be treated as a runtime screenshot or as evidence of real usage.

## Visual contract

- Use warm off-white cards on a dark iOS background.
- Keep the card radius, spacing and information density close to the installed widgets.
- Use solid fills and clear typographic hierarchy; avoid glass, gradients and decorative UI that does not exist in the scripts.
- Keep pixel characters and geometric marks subordinate to the data.
- Show status explicitly: live, cached, stale, empty or error.
- Keep long model names inside their allocated text boxes.
- Use only synthetic values in public images and label them as fictional.

## Data contract

- Main Token = Prompt + Completion.
- Cache Read, Cache Create and Cache Basis are separate fields.
- Requests = sum of `request_count`.
- Latency = arithmetic average of positive `use_time` samples.
- No P95/P99 claim is rendered by V3.

## Public asset rule

The checked-in iPhone mockup is generated from `tools/v3-sanitized-screen.svg` and `tools/v3-iphone-frame.svg`. It intentionally uses fictional model families and values. Do not replace it with a production screenshot or a screenshot containing private account data.
