# V3 Release Notes

## Token Tracker V3 · Pixel Edition

This release adds the Cloud Parcel Ledger family while retaining the V2 scripts and API compatibility.

### Added

- Seven V3 Scriptable widgets.
- Independent Small / Medium / Large composition for every V3 widget.
- Source-aware model ranking and model focus.
- Separate cache-read and cache-creation reporting.
- Request totals based on `request_count`.
- Arithmetic average latency over positive `use_time` samples only.
- Deterministic Nano Banana model-family mapping.
- V3 setup script with V2 settings fallback.
- Sanitized iPhone mockup using fictional cross-model demo data.

### Preserved

- V2 scripts and existing API routes.
- Main Token formula: `prompt_tokens + completion_tokens`.
- `source + request_id` idempotent storage.
- SQLite persistence, incremental sync and health checks.

### Privacy boundary

The public tree contains no production endpoint, server address, API key, cookie, access token, user ID, database, or real usage fixture. The preview uses invented values for generic model families such as GPT, Cloud, Kimi, MiniMax and DeepSeek.
