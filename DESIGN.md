# Token Tracker Design

## V4 · Atelier (current)

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
