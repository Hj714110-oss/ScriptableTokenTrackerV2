# Token Tracker V3 Design

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
