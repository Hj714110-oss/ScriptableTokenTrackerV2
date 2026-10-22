// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: bullseye;
/* Token Tracker V4 · Atelier — ModelFocusV4
 * one ranked model in depth · parameter: 1,today,all
 * Generated from src/v4/core.js by tools/build_v4.py — edit the core, then rebuild. */
const WIDGET = "focus";
/*
 * Token Tracker V4 · Atelier — shared widget core.
 * Every widget is composed as one full-bleed DrawContext image per family (small / medium / large),
 * so type, hairlines, rings and charts land exactly where they are designed.
 * The build step (tools/build_v4.py) prepends `const WIDGET = "<id>";` and a Scriptable header.
 * Data: the /v3 payload (Main Token = prompt + completion; cache is separate; requests = Σ request_count;
 * latency = mean of positive use_time samples).
 */

/* ============================== settings & run ============================== */
const SETTINGS = loadSettings();
const API_URL = String(SETTINGS.apiUrl || "").replace(/\/+$/, "");
const API_KEY = String(SETTINGS.apiKey || "");
const CACHE_FILE = "token-tracker-v4-cache.json";
const REFRESH_MINUTES = 2, STALE_SECONDS = 1800;
const DARK = Device.isUsingDarkAppearance();
const FAMILY = String(config.widgetFamily || args.queryParameters?.family || "large").toLowerCase();
const PARAM = String(args.widgetParameter ?? args.queryParameters?.parameter ?? "").trim();

/* ============================== design tokens ============================== */
const P = DARK ? {
  bg: "#141311", bgHi: "#1D1B18", ink: "#F3EFE8", sub: "#A7A097", faint: "#6F6A62", line: "#2B2825", track: "#262320",
  clay: "#E8896A", sage: "#8CBB97", indigo: "#93A3F2", amber: "#E9B661", plum: "#C691BC", red: "#E58A84",
} : {
  bg: "#F6F3EE", bgHi: "#FCFAF7", ink: "#1C1A17", sub: "#6E685F", faint: "#A8A197", line: "#E3DDD3", track: "#ECE7DF",
  clay: "#D2693F", sage: "#5E8F6B", indigo: "#5468C4", amber: "#D8962F", plum: "#9A5D8D", red: "#C4524A",
};
const RANK = [P.clay, P.indigo, P.sage, P.amber, P.plum];
const col = (hex, a = 1) => new Color(hex, a);
/* fonts travel with their size because DrawContext cannot report it */
const F = {
  hero: s => ({ f: Font.boldRoundedSystemFont(s), s }),
  num: s => ({ f: Font.semiboldRoundedSystemFont(s), s }),
  title: s => ({ f: Font.semiboldSystemFont(s), s }),
  text: s => ({ f: Font.mediumSystemFont(s), s }),
  body: s => ({ f: Font.regularSystemFont(s), s }),
  mono: s => ({ f: Font.mediumMonospacedSystemFont(s), s }),
};

function render(id, family, result) {
  const d = result.data || {};
  const status = statusOf(result);
  const ctx = { d, status, family, param: PARAM };
  const hasUsage = Number(d.summary?.all_time_total || 0) > 0;
  if (!hasUsage) return frame(family, (c, w, h) => stateCard(c, w, h, status.kind === "error" ? "error" : "empty",
    status.kind === "error" ? "连接失败" : "还没有用量", status.kind === "error" ? "没有可用缓存，稍后自动重试" : "收到第一条日志后，这里会开始记账"));
  const views = { overview: Overview, ranking: Ranking, focus: Focus, rhythm: Rhythm, activity: Activity, cache: Cache, pulse: Pulse };
  return frame(family, (c, w, h) => views[id][family](c, w, h, ctx));
}

/* ============================== canvas frame ============================== */
function widgetSize(family) {
  const s = Device.screenSize(), W0 = Math.min(s.width, s.height);
  const table = { 320: [141, 292, 311], 375: [155, 329, 345], 390: [158, 338, 354], 393: [158, 338, 354], 402: [162, 346, 362], 414: [169, 360, 379], 428: [170, 364, 382], 430: [170, 364, 382], 440: [174, 372, 390] };
  const key = Object.keys(table).map(Number).reduce((a, b) => Math.abs(b - W0) < Math.abs(a - W0) ? b : a);
  const [sm, md, lg] = table[key];
  return family === "small" ? [sm, sm] : family === "medium" ? [md, sm] : [md, lg];
}
function frame(family, draw) {
  const [w, h] = widgetSize(family);
  const c = new DrawContext(); c.size = new Size(w, h); c.opaque = true; c.respectScreenScale = true;
  fill(c, 0, 0, w, h, P.bg);
  for (let i = 0; i < 18; i++) { const r = (w * .9) * (1 - i / 18); c.setFillColor(col(P.bgHi, .045)); c.fillEllipse(new Rect(-r * .55, -r * .6, r * 1.6, r * 1.3)); }
  draw(c, w, h);
  const wd = new ListWidget(); wd.setPadding(0, 0, 0, 0); wd.backgroundImage = c.getImage(); wd.refreshAfterDate = nextRefresh();
  return wd;
}

/* ============================== drawing primitives ============================== */
function fill(c, x, y, w, h, color, a = 1) { c.setFillColor(col(color, a)); c.fillRect(new Rect(x, y, w, h)); }
function rr(c, x, y, w, h, r, color, a = 1) { const p = new Path(); p.addRoundedRect(new Rect(x, y, w, h), Math.min(r, w / 2, h / 2), Math.min(r, w / 2, h / 2)); c.addPath(p); c.setFillColor(col(color, a)); c.fillPath(); }
function dot(c, x, y, r, color, a = 1) { c.setFillColor(col(color, a)); c.fillEllipse(new Rect(x - r, y - r, r * 2, r * 2)); }
function glow(c, x, y, r, color, a = .22) { for (let i = 10; i >= 1; i--) dot(c, x, y, r * i / 10, color, a / 10); }
function hline(c, x, y, w, color = P.line, a = 1, t = .7) { fill(c, x, y, w, t, color, a); }
function dashed(c, x, y, w, color, a = 1, on = 3, off = 3, t = .8) { for (let xx = x; xx < x + w; xx += on + off) fill(c, xx, y, Math.min(on, x + w - xx), t, color, a); }
function text(c, s, x, y, w, font, color, align = "left", a = 1, h) {
  const size = font.s; c.setFont(font.f); c.setTextColor(col(color, a));
  align === "right" ? c.setTextAlignedRight() : align === "center" ? c.setTextAlignedCenter() : c.setTextAlignedLeft();
  c.drawTextInRect(String(s), new Rect(x, y, w, h || size * 1.35));
}
/* rough advance widths so long numbers and names shrink instead of clipping (DrawContext cannot measure text) */
function advance(s, size) { let u = 0; for (const ch of String(s)) u += /[　-鿿＀-￯]/.test(ch) ? 1 : /[0-9]/.test(ch) ? .6 : /[A-Z]/.test(ch) ? .66 : /[ .,:·]/.test(ch) ? .3 : .53; return u * size; }
function fitSize(s, maxW, size, min = size * .6) { const a = advance(s, size); return a <= maxW ? size : Math.max(min, size * maxW / a); }
function ellipsize(s, maxW, size) { s = String(s); while (s.length > 2 && advance(s, size) > maxW) s = s.slice(0, -2) + "…"; return s; }
function arc(c, cx, cy, r, t, a0, a1, color, a = 1) {
  if (a1 <= a0) return; const n = Math.max(6, Math.ceil((a1 - a0) / .05)), p = new Path();
  for (let i = 0; i <= n; i++) { const an = a0 + (a1 - a0) * i / n, pt = new Point(cx + Math.cos(an) * r, cy + Math.sin(an) * r); i ? p.addLine(pt) : p.move(pt); }
  c.addPath(p); c.setStrokeColor(col(color, a)); c.setLineWidth(t); c.strokePath();
  dot(c, cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, t / 2, color, a); dot(c, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, t / 2, color, a);
}
function ring(c, cx, cy, r, t, frac, color, track = P.track) {
  const s = -Math.PI / 2; arc(c, cx, cy, r, t, s, s + Math.PI * 2 * .9999, track); if (frac > .002) arc(c, cx, cy, r, t, s, s + Math.PI * 2 * Math.min(1, frac), color);
}
function line(c, pts, color, t = 1.6, a = 1) { if (pts.length < 2) return; const p = new Path(); pts.forEach((q, i) => i ? p.addLine(new Point(q[0], q[1])) : p.move(new Point(q[0], q[1]))); c.addPath(p); c.setStrokeColor(col(color, a)); c.setLineWidth(t); c.strokePath(); }
function area(c, pts, base, color, a = .14) {
  if (pts.length < 2) return; const steps = 16;
  for (let k = 0; k < steps; k++) {                                  // vertical fade: stacked translucent polygons
    const p = new Path(), f = k / steps; p.move(new Point(pts[0][0], base));
    pts.forEach(q => p.addLine(new Point(q[0], q[1] + (base - q[1]) * f))); p.addLine(new Point(pts[pts.length - 1][0], base)); p.closeSubpath();
    c.addPath(p); c.setFillColor(col(color, a / steps * 1.6)); c.fillPath();
  }
}
function smoothPts(vals, x, y, w, h, max) { const n = vals.length; return vals.map((v, i) => [x + (n === 1 ? w / 2 : i * w / (n - 1)), y + h - (max > 0 ? v / max : 0) * h]); }
function bars(c, vals, x, y, w, h, o = {}) {
  const n = vals.length, gap = o.gap ?? Math.max(3, w / n * .34), bw = (w - gap * (n - 1)) / n, max = Math.max(...vals, o.max || 0, 1);
  vals.forEach((v, i) => {
    const bh = v > 0 ? Math.max(bw > 6 ? 3 : 2, v / max * h) : 0, bx = x + i * (bw + gap), last = i === n - 1;
    rr(c, bx, y, bw, h, Math.min(bw / 2, 4), P.track, o.trackA ?? .55);
    if (bh) rr(c, bx, y + h - bh, bw, bh, Math.min(bw / 2, 4), last ? (o.hi || P.clay) : (o.base || P.faint), last ? 1 : (o.baseA ?? .55));
    if (o.labels) text(c, o.labels[i], bx - 4, y + h + 4, bw + 8, F.text(8), last ? (o.hi || P.clay) : P.faint, "center");
  });
  if (o.avg > 0) dashed(c, x, y + h - o.avg / max * h, w, P.sub, .7);
  if (o.ghost > (vals[n - 1] || 0)) { const bx = x + (n - 1) * (bw + gap), gy = y + h - o.ghost / max * h; for (let yy = gy; yy < y + h - (vals[n - 1] / max * h) - 2; yy += 4) fill(c, bx, yy, bw, 1.6, o.hi || P.clay, .45); }
  return { bw, gap, max };
}
function chip(c, s, x, y, color, align = "left", size = 8.5) {
  const w = advance(s, size) + 14, xx = align === "right" ? x - w : x; rr(c, xx, y, w, size + 8, (size + 8) / 2, color, .14); text(c, s, xx, y + 3.2, w, F.text(size), color, "center"); return w;
}
function statusPill(c, w, y, status, x) {
  const color = { live: P.sage, cache: P.indigo, stale: P.amber, error: P.red, empty: P.faint }[status.kind] || P.faint, s = status.label;
  const right = x ?? w - 14, tw = advance(s, 8.5); dot(c, right - tw - 6, y + 5.6, 2.6, color); if (status.kind === "live") glow(c, right - tw - 6, y + 5.6, 6, color, .35);
  text(c, s, right - tw - 1, y, tw + 4, F.text(8.5), P.sub);
}
function label(c, s, x, y, w, color = P.sub, align = "left", size = 9) { text(c, s, x, y, w, F.text(size), color, align); }
function big(c, s, x, y, w, size, color = P.ink, align = "left") { const z = fitSize(s, w, size); text(c, s, x, y + (size - z) * .8, w, F.hero(z), color, align, 1, z * 1.3); }
function stat(c, k, v, x, y, w, color = P.ink, size = 13) { label(c, k, x, y, w, P.sub, "left", 8.5); text(c, v, x, y + 12, w, F.num(fitSize(v, w, size)), color); }
function tile(c, x, y, w, h) { rr(c, x, y, w, h, 12, P.ink, DARK ? .055 : .04); }
function header(c, w, title, sub, status) {
  text(c, title, 16, 13, w - 120, F.title(13), P.ink); if (sub) label(c, sub, 16, 31, w - 120, P.sub, "left", 9);
  statusPill(c, w, 16, status);
}
function stateCard(c, w, h, kind, title, detail) {
  const color = kind === "error" ? P.red : P.faint; ring(c, w / 2, h * .42, Math.min(w, h) * .14, 5, kind === "error" ? .25 : 0, color);
  text(c, title, 10, h * .42 + Math.min(w, h) * .14 + 12, w - 20, F.title(13), kind === "error" ? P.red : P.ink, "center");
  text(c, detail, 10, h * .42 + Math.min(w, h) * .14 + 31, w - 20, F.body(9.5), P.sub, "center");
}

/* ============================== data helpers ============================== */
function statusOf(result) {
  const d = result.data || {}, sync = Number(d.meta?.last_sync_at || 0), now = Math.floor(Date.now() / 1000);
  if (!d.summary) return { kind: "error", label: "离线", sync };
  if (!sync || now - sync >= STALE_SECONDS || d.meta?.status === "stale") return { kind: "stale", label: `稍旧 · ${ago(sync)}`, sync };
  if (!result.live) return { kind: "cache", label: `缓存 · ${ago(sync)}`, sync };
  return { kind: "live", label: "实时", sync };
}
function parseParam(defaults) {
  const parts = PARAM ? PARAM.split(",").map(s => s.trim()) : [], out = Object.assign({}, defaults);
  for (const p of parts) { if (/^\d+$/.test(p)) out.rank = Math.max(1, Number(p)); else if (["today", "7d", "month"].includes(p)) out.period = p; else if (p) out.source = p; }
  return out;
}
const PERIOD = { today: "今日", "7d": "近 7 日", month: "本月" };
function periodData(d, period, source) { return source && source !== "all" ? d.source_periods?.[source]?.[period] || {} : d.periods?.[period] || {}; }
function topsFor(d, period, source) { return (source && source !== "all" ? d.source_top_models?.[source]?.[period] : d.top_models?.[period]) || []; }
function sourceLabel(d, s) { return !s || s === "all" ? "全部来源" : d.sources?.[s]?.label || s; }
function vals(list, key = "tokens") { return (list || []).map(x => Number(x[key] ?? x.val) || 0); }
function weekdays(list) { return (list || []).map((x, i, a) => i === a.length - 1 ? "今" : "日一二三四五六"[new Date(`${x.date}T12:00:00`).getDay()]); }
function compact(n) { n = Number(n) || 0; const a = Math.abs(n); const t = v => v.toFixed(Math.abs(v) >= 100 ? 0 : 1).replace(/\.0$/, ""); return a >= 1e12 ? t(n / 1e12) + "T" : a >= 1e9 ? t(n / 1e9) + "B" : a >= 1e6 ? t(n / 1e6) + "M" : a >= 1e3 ? t(n / 1e3) + "K" : String(Math.round(n)); }
function num(n) { return Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function pct(n, d = 1) { return `${(Number(n) || 0).toFixed(d).replace(/\.0$/, "")}%`; }
function signed(n) { n = Number(n) || 0; return `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1).replace(/\.0$/, "")}%`; }
function secs(n) { n = Number(n) || 0; return n >= 100 ? `${Math.round(n)}s` : `${n.toFixed(1)}s`; }
function ago(ts) { if (!ts) return "未同步"; const m = Math.max(0, Math.floor((Date.now() / 1000 - ts) / 60)); return m < 1 ? "刚刚" : m < 60 ? `${m} 分钟前` : m < 1440 ? `${Math.floor(m / 60)} 小时前` : `${Math.floor(m / 1440)} 天前`; }
function shortModel(s) { return String(s || "").trim().replace(/^claude-/i, "Claude ").replace(/^gpt-/i, "GPT-").replace(/^gemini-/i, "Gemini ").replace(/^deepseek-/i, "DeepSeek ").replace(/^kimi-/i, "Kimi ").replace(/^glm-/i, "GLM-").replace(/^qwen/i, "Qwen").replace(/-(\d)/g, " $1").replace(/-/g, " ").replace(/\s+/g, " ").replace(/(\d) (\d)/g, "$1.$2").trim().replace(/(^|\s)([a-z])/g, (_, sp, ch) => sp + ch.toUpperCase()); }
function dateLine() { const d = new Date(); return `${d.getMonth() + 1}月${d.getDate()}日 · 周${"日一二三四五六"[d.getDay()]}`; }

/* ============================== 1 · OVERVIEW ============================== */
const Overview = {
  small(c, w, h, { d, status }) {
    const s = d.summary, h7 = vals(d.history_7d);
    label(c, "今日 TOKENS", 15, 14, 100); statusPill(c, w, 14, { kind: status.kind, label: "" }, w - 8);
    big(c, compact(s.today.tokens), 14, 30, w - 28, 34);
    const vs = s.vs_average_percent; chip(c, `${signed(vs)} 较 7 日均`, 15, 74, vs >= 0 ? P.clay : P.sage);
    bars(c, h7, 15, 100, w - 30, 30, { ghost: s.projection });
    label(c, `累计 ${compact(s.all_time_total)}`, 15, h - 22, 70, P.sub, "left", 8.5); label(c, `预计 ${compact(s.projection)}`, w - 85, h - 22, 70, P.faint, "right", 8.5);
  },
  medium(c, w, h, { d, status }) {
    const s = d.summary, h7 = vals(d.history_7d), split = 146;
    label(c, "今日 TOKENS", 16, 15, 110); big(c, compact(s.today.tokens), 15, 30, split - 22, 36);
    chip(c, `${signed(s.vs_average_percent)} 较均值`, 16, 77, s.vs_average_percent >= 0 ? P.clay : P.sage);
    stat(c, "累计", compact(s.all_time_total), 16, 104, 60, P.ink, 12.5); stat(c, "预计", compact(s.projection), 78, 104, 60, P.clay, 12.5);
    fill(c, split, 18, .7, h - 36, P.line);
    label(c, "近 7 日", split + 16, 15, 80); statusPill(c, w, 15, status);
    bars(c, h7, split + 16, 40, w - split - 32, 76, { avg: s.baseline_7d?.daily_average, ghost: s.projection, labels: weekdays(d.history_7d) });
    label(c, `日均 ${compact(s.baseline_7d?.daily_average)}`, split + 16, h - 22, 120, P.faint, "left", 8.5);
  },
  large(c, w, h, { d, status }) {
    const s = d.summary, h30 = vals(d.history_30d), tops = (d.top_models?.today || []).slice(0, 3);
    header(c, w, "Token 总览", dateLine(), status);
    label(c, "今日", 16, 56, 60); big(c, compact(s.today.tokens), 15, 68, 200, 46);
    const frac = s.projection > 0 ? s.today.tokens / s.projection : 0, rx = w - 58, ry = 96;
    ring(c, rx, ry, 30, 6, frac, P.clay); glow(c, rx, ry, 24, P.clay, .08);
    text(c, pct(frac * 100, 0), rx - 30, ry - 9, 60, F.num(13), P.ink, "center"); text(c, "达成预计", rx - 30, ry + 6, 60, F.text(7.5), P.faint, "center");
    const tw = (w - 32 - 16) / 3;
    [["累计", compact(s.all_time_total), P.ink], ["本月", compact(d.periods?.month?.tokens), P.ink], ["较 7 日均", signed(s.vs_average_percent), s.vs_average_percent >= 0 ? P.clay : P.sage]]
      .forEach(([k, v, cc], i) => { const x = 16 + i * (tw + 8); tile(c, x, 136, tw, 44); stat(c, k, v, x + 10, 143, tw - 16, cc, 14); });
    const cy = 194, ch = 66, max = Math.max(...h30, 1) * 1.08, pts = smoothPts(h30, 16, cy, w - 32, ch, max);
    label(c, "30 天走势", 16, cy - 3, 100, P.faint, "left", 8);
    area(c, pts, cy + ch, P.clay, .22); line(c, pts, P.clay, 1.6); const lp = pts[pts.length - 1]; glow(c, lp[0], lp[1], 10, P.clay, .3); dot(c, lp[0], lp[1], 2.6, P.clay);
    hline(c, 16, cy + ch, w - 32);
    tops.forEach((m, i) => {
      const y = 274 + i * 25, bw = w - 32;
      dot(c, 20, y + 6, 3.2, RANK[i]); text(c, ellipsize(shortModel(m.model), 140, 10.5), 30, y - 1, 150, F.text(10.5), P.ink);
      text(c, `${compact(m.tokens)} · ${pct(m.share)}`, w - 150, y - 1, 134, F.mono(9.5), P.sub, "right");
      rr(c, 30, y + 15, bw - 14, 3, 1.5, P.track); rr(c, 30, y + 15, (bw - 14) * Math.min(1, m.share / 100), 3, 1.5, RANK[i]);
    });
  },
};

/* ============================== 2 · RANKING ============================== */
const Ranking = {
  setup(d) { const p = parseParam({ period: "today", source: "all" }); return { p, tops: topsFor(d, p.period, p.source), total: periodData(d, p.period, p.source) }; },
  small(c, w, h, { d, status }) {
    const { p, tops } = this.setup(d);
    label(c, `排行 · ${PERIOD[p.period]}`, 15, 14, 110); statusPill(c, w, 14, { kind: status.kind, label: "" }, w - 8);
    tops.slice(0, 3).forEach((m, i) => {
      const y = 38 + i * 37; text(c, String(i + 1), 15, y, 12, F.num(11), RANK[i]);
      text(c, ellipsize(shortModel(m.model), w - 46, 11), 30, y, w - 44, F.text(11), P.ink);
      text(c, compact(m.tokens), 30, y + 15, 60, F.mono(9), P.sub); text(c, pct(m.share, 0), w - 60, y + 15, 45, F.mono(9), P.faint, "right");
      rr(c, 30, y + 29, w - 45, 2.5, 1.2, P.track); rr(c, 30, y + 29, (w - 45) * m.share / 100, 2.5, 1.2, RANK[i]);
    });
  },
  medium(c, w, h, { d, status }) {
    const { p, tops, total } = this.setup(d);
    text(c, "模型排行", 16, 13, 100, F.title(13), P.ink); chip(c, PERIOD[p.period], 86, 14, P.clay); label(c, sourceLabel(d, p.source), 86 + advance(PERIOD[p.period], 8.5) + 20, 15, 90, P.faint, "left", 8.5);
    statusPill(c, w, 15, status);
    tops.slice(0, 5).forEach((m, i) => {
      const y = 40 + i * 22.5, nameW = 112, barX = 16 + 18 + nameW, barW = w - barX - 92;
      text(c, String(i + 1), 16, y, 14, F.num(10.5), RANK[i]); text(c, ellipsize(shortModel(m.model), nameW, 10.5), 34, y, nameW, F.text(10.5), P.ink);
      rr(c, barX, y + 5, barW, 5, 2.5, P.track); rr(c, barX, y + 5, Math.max(4, barW * m.share / 100), 5, 2.5, RANK[i]);
      text(c, compact(m.tokens), w - 88, y, 44, F.mono(9.5), P.ink, "right"); text(c, pct(m.share, 0), w - 42, y, 26, F.mono(9.5), P.faint, "right");
    });
  },
  large(c, w, h, { d, status }) {
    const { p, tops, total } = this.setup(d);
    header(c, w, "模型排行", `${PERIOD[p.period]} · ${sourceLabel(d, p.source)}`, status);
    label(c, "总用量", 16, 54, 80); big(c, compact(total.tokens), 15, 66, 170, 36);
    stat(c, "请求", num(total.requests), w - 170, 70, 70); stat(c, "缓存率", pct(total.cache_rate), w - 92, 70, 76, P.sage);
    let x = 16; const sw = w - 32; tops.slice(0, 5).forEach((m, i) => { const ww = sw * m.share / 100; if (ww > 1) rr(c, x, 116, Math.max(2, ww - 2), 8, 3, RANK[i]); x += ww; }); if (x < 16 + sw) rr(c, x, 116, 16 + sw - x, 8, 3, P.track);
    tops.slice(0, 5).forEach((m, i) => {
      const y = 140 + i * 41; if (i) hline(c, 16, y - 7, w - 32);
      text(c, String(i + 1).padStart(2, "0"), 16, y + 1, 22, F.mono(10), RANK[i]);
      text(c, ellipsize(shortModel(m.model), 150, 12), 42, y - 1, 150, F.title(12), P.ink);
      label(c, `${m.family || ""} · ${num(m.requests)} 次 · 缓存 ${pct(m.cache_rate, 0)}`, 42, y + 15, 170, P.faint, "left", 8.5);
      const hv = vals(m.history_7d), sx = w - 150, pts = smoothPts(hv, sx, y + 2, 46, 20, Math.max(...hv, 1)); line(c, pts, RANK[i], 1.3, .9); dot(c, pts[pts.length - 1][0], pts[pts.length - 1][1], 1.8, RANK[i]);
      text(c, compact(m.tokens), w - 96, y - 1, 80, F.num(12), P.ink, "right"); text(c, pct(m.share), w - 96, y + 15, 80, F.mono(8.5), P.faint, "right");
    });
  },
};

/* ============================== 3 · FOCUS ============================== */
const Focus = {
  setup(d) { const p = parseParam({ rank: 1, period: "today", source: "all" }), m = topsFor(d, p.period, p.source)[p.rank - 1]; return { p, m }; },
  small(c, w, h, { d, status }) {
    const { p, m } = this.setup(d); if (!m) return stateCard(c, w, h, "empty", "暂无该排名", `${PERIOD[p.period]}没有第 ${p.rank} 名`);
    const color = RANK[(p.rank - 1) % 5];
    label(c, `#${p.rank} · ${PERIOD[p.period]}`, 15, 14, 100, color); statusPill(c, w, 14, { kind: status.kind, label: "" }, w - 8);
    text(c, ellipsize(shortModel(m.model), w - 30, 13), 15, 30, w - 30, F.title(13), P.ink);
    ring(c, 44, 96, 26, 6, m.share / 100, color); text(c, pct(m.share, 0), 18, 89, 52, F.num(11.5), P.ink, "center");
    text(c, compact(m.tokens), 80, 76, w - 92, F.num(fitSize(compact(m.tokens), w - 92, 18)), P.ink); label(c, "tokens", 80, 98, 60, P.faint, "left", 8);
    label(c, `${num(m.requests)} 次 · ${secs(m.avg_latency)}`, 15, h - 22, w - 30, P.sub, "left", 8.5);
  },
  medium(c, w, h, { d, status }) {
    const { p, m } = this.setup(d); if (!m) return stateCard(c, w, h, "empty", "暂无该排名", `${PERIOD[p.period]}没有第 ${p.rank} 名`);
    const color = RANK[(p.rank - 1) % 5];
    ring(c, 70, h / 2, 46, 9, m.share / 100, color); glow(c, 70, h / 2, 36, color, .08);
    text(c, pct(m.share, 0), 30, h / 2 - 13, 80, F.hero(20), P.ink, "center"); text(c, "占比", 30, h / 2 + 10, 80, F.text(8.5), P.faint, "center");
    const x = 140; label(c, `#${p.rank} · ${m.family || ""} · ${PERIOD[p.period]}`, x, 15, 150, color); statusPill(c, w, 15, status);
    text(c, ellipsize(shortModel(m.model), w - x - 16, 15), x, 31, w - x - 16, F.title(15), P.ink);
    big(c, compact(m.tokens), x - 1, 52, 150, 28);
    const sw = (w - x - 16) / 3; [["请求", num(m.requests)], ["缓存", pct(m.cache_rate, 0)], ["耗时", secs(m.avg_latency)]].forEach(([k, v], i) => stat(c, k, v, x + i * sw, 104, sw - 6, i === 1 ? P.sage : P.ink, 12.5));
  },
  large(c, w, h, { d, status }) {
    const { p, m } = this.setup(d); if (!m) return stateCard(c, w, h, "empty", "暂无该排名", `${PERIOD[p.period]}没有第 ${p.rank} 名`);
    const color = RANK[(p.rank - 1) % 5];
    header(c, w, `#${p.rank} 模型档案`, `${PERIOD[p.period]} · ${sourceLabel(d, p.source)}`, status);
    ring(c, 74, 124, 52, 10, m.share / 100, color); glow(c, 74, 124, 40, color, .1);
    text(c, pct(m.share, 0), 34, 110, 80, F.hero(22), P.ink, "center"); text(c, "占比", 34, 136, 80, F.text(8.5), P.faint, "center");
    text(c, ellipsize(shortModel(m.model), w - 160, 17), 146, 66, w - 160, F.title(17), P.ink); label(c, m.family || "", 146, 88, 120, color);
    big(c, compact(m.tokens), 145, 106, w - 160, 34); label(c, "Main Token = Prompt + Completion", 146, 148, w - 160, P.faint, "left", 8);
    const tw = (w - 32 - 16) / 3;
    [["请求", num(m.requests), P.ink], ["缓存命中", pct(m.cache_rate), P.sage], ["平均耗时", secs(m.avg_latency), P.indigo]].forEach(([k, v, cc], i) => { const x = 16 + i * (tw + 8); tile(c, x, 190, tw, 46); stat(c, k, v, x + 10, 197, tw - 16, cc, 15); });
    label(c, "近 7 日", 16, 252, 80, P.faint, "left", 8);
    bars(c, vals(m.history_7d), 16, 268, w - 32, 58, { hi: color, labels: weekdays(m.history_7d) });
  },
};

/* ============================== 4 · RHYTHM ============================== */
const Rhythm = {
  small(c, w, h, { d, status }) {
    const s = d.summary, h7 = vals(d.history_7d);
    label(c, "用量节奏", 15, 14, 100); statusPill(c, w, 14, { kind: status.kind, label: "" }, w - 8);
    big(c, compact(s.today.tokens), 14, 29, w - 28, 26);
    bars(c, h7, 15, 66, w - 30, 52, { avg: s.baseline_7d?.daily_average, ghost: s.projection, labels: weekdays(d.history_7d) });
    label(c, `均 ${compact(s.baseline_7d?.daily_average)} · 峰 ${compact(Math.max(...h7))}`, 15, h - 20, w - 30, P.faint, "left", 8);
  },
  medium(c, w, h, { d, status }) {
    const s = d.summary, h7 = vals(d.history_7d);
    text(c, "用量节奏", 16, 13, 100, F.title(13), P.ink); statusPill(c, w, 15, status);
    const sx = 16, cw = 92; stat(c, "今日", compact(s.today.tokens), sx, 38, cw, P.clay, 17); stat(c, "日均", compact(s.baseline_7d?.daily_average), sx, 76, cw, P.ink, 12.5); stat(c, "预计", compact(s.projection), sx, 108, cw, P.sub, 12.5);
    bars(c, h7, 118, 40, w - 134, 76, { avg: s.baseline_7d?.daily_average, ghost: s.projection, labels: weekdays(d.history_7d) });
  },
  large(c, w, h, { d, status }) {
    const s = d.summary, h7 = vals(d.history_7d), h30 = vals(d.history_30d);
    header(c, w, "用量节奏", "7 日真实用量 · 30 日轮廓", status);
    const tw = (w - 32 - 16) / 3;
    [["今日", compact(s.today.tokens), P.clay], ["日均", compact(s.baseline_7d?.daily_average), P.ink], ["峰值", compact(Math.max(...h7)), P.ink]].forEach(([k, v, cc], i) => { const x = 16 + i * (tw + 8); tile(c, x, 54, tw, 46); stat(c, k, v, x + 10, 61, tw - 16, cc, 16); });
    label(c, "近 7 日 · 虚线为日均 · 斜纹为今日预计", 16, 114, w - 32, P.faint, "left", 8);
    bars(c, h7, 16, 134, w - 32, 96, { avg: s.baseline_7d?.daily_average, ghost: s.projection, labels: weekdays(d.history_7d), gap: 16 });
    label(c, "30 天", 16, 262, 60, P.faint, "left", 8);
    const max = Math.max(...h30, 1) * 1.1, pts = smoothPts(h30, 16, 278, w - 32, 52, max); area(c, pts, 330, P.indigo, .2); line(c, pts, P.indigo, 1.4);
    hline(c, 16, 330, w - 32); label(c, `${signed(s.vs_average_percent)} 较 7 日均值`, 16, h - 18, 160, s.vs_average_percent >= 0 ? P.clay : P.sage, "left", 8.5);
  },
};

/* ============================== 5 · ACTIVITY ============================== */
const Activity = {
  heat(c, days, x, y, cols, cell, gap) {
    const list = (days || []).slice(-cols * 7), max = Math.max(...list.map(v => Number(v.tokens) || 0), 1);
    const offset = cols * 7 - list.length;
    list.forEach((v, i) => {
      const k = i + offset, cx = x + Math.floor(k / 7) * (cell + gap), cy = y + (k % 7) * (cell + gap), t = Number(v.tokens) || 0, lv = t <= 0 ? 0 : Math.min(4, 1 + Math.floor(t / max * 3.999));
      rr(c, cx, cy, cell, cell, cell * .3, lv ? P.clay : P.track, lv ? [0, .28, .48, .72, 1][lv] : (DARK ? .9 : 1));
      if (i === list.length - 1) { glow(c, cx + cell / 2, cy + cell / 2, cell * 1.4, P.clay, .35); }
    });
  },
  small(c, w, h, { d, status }) {
    const s = d.summary; label(c, "连续使用", 15, 14, 100); statusPill(c, w, 14, { kind: status.kind, label: "" }, w - 8);
    big(c, `${s.current_streak}`, 14, 28, 60, 30); label(c, "天", 15 + advance(String(s.current_streak), 30) + 3, 46, 20, P.sub, "left", 10);
    label(c, `最长 ${s.longest_streak_180}`, w - 85, 47, 70, P.faint, "right", 8.5);
    this.heat(c, d.history_180d, 15, 76, 12, 8, 3);
  },
  medium(c, w, h, { d, status }) {
    const s = d.summary; text(c, "活动", 16, 13, 60, F.title(13), P.ink); label(c, "180 天", 52, 15, 60, P.faint, "left", 9); statusPill(c, w, 15, status);
    stat(c, "连续", `${s.current_streak} 天`, 16, 42, 70, P.clay, 17); stat(c, "最长", `${s.longest_streak_180} 天`, 16, 80, 70, P.ink, 12.5); stat(c, "活跃", `${s.active_days_180} 天`, 16, 110, 70, P.ink, 12.5);
    this.heat(c, d.history_180d, 100, 42, 26, 6.9, 1.75);
  },
  large(c, w, h, { d, status }) {
    const s = d.summary, cache = d.periods?.today || {};
    header(c, w, "活动日历", "180 天 · 每格一天", status);
    const cell = 9.6, gap = 2.6, x0 = 16; this.heat(c, d.history_180d, x0, 72, 26, cell, gap);
    const list = (d.history_180d || []).slice(-182); let lastM = -1;
    let lastCol = -9; list.forEach((v, i) => { const m = new Date(`${v.date}T12:00:00`).getMonth(), colx = Math.floor((i + (182 - list.length)) / 7); if (m !== lastM && colx - lastCol >= 3) { label(c, `${m + 1}月`, x0 + colx * (cell + gap), 56, 30, P.faint, "left", 7.5); lastM = m; lastCol = colx; } });
    label(c, "少", w - 94, 163, 14, P.faint, "left", 7.5); [0, .28, .48, .72, 1].forEach((a, i) => rr(c, w - 80 + i * 12, 165, 9, 9, 3, a ? P.clay : P.track, a || 1)); label(c, "多", w - 16 - 8, 163, 14, P.faint, "left", 7.5);
    label(c, "今日以光点标出", 16, 163, 120, P.faint, "left", 7.5);
    const tw = (w - 32 - 16) / 3;
    [["连续使用", `${s.current_streak} 天`, P.clay], ["最长连续", `${s.longest_streak_180} 天`, P.ink], ["活跃天数", `${s.active_days_180} / 180`, P.ink]].forEach(([k, v, cc], i) => { const x = 16 + i * (tw + 8); tile(c, x, 190, tw, 48); stat(c, k, v, x + 10, 197, tw - 16, cc, 16); });
    const h30 = vals(d.history_30d); label(c, "近 30 天", 16, 254, 80, P.faint, "left", 8);
    bars(c, h30, 16, 270, w - 32, 50, { gap: 2.4, baseA: .45 });
    label(c, `今日缓存 ${pct(cache.cache_rate)} · ${num(cache.requests)} 次请求`, 16, h - 18, w - 32, P.sub, "left", 8.5);
  },
};

/* ============================== 6 · CACHE ============================== */
const Cache = {
  setup(d) { const p = parseParam({ period: "today", source: "all" }); return { p, x: periodData(d, p.period, p.source) }; },
  small(c, w, h, { d, status }) {
    const { p, x } = this.setup(d); label(c, `缓存 · ${PERIOD[p.period]}`, 15, 14, 110); statusPill(c, w, 14, { kind: status.kind, label: "" }, w - 8);
    const cx = w / 2, cy = 84, r = 40; ring(c, cx, cy, r, 9, x.cache_rate / 100, P.sage); glow(c, cx, cy, 30, P.sage, .1);
    text(c, pct(x.cache_rate, 0), cx - 40, cy - 13, 80, F.hero(21), P.ink, "center"); text(c, "命中", cx - 40, cy + 10, 80, F.text(8), P.faint, "center");
    label(c, `读 ${compact(x.cache_tokens)} · 基 ${compact(x.cache_basis)}`, 10, h - 22, w - 20, P.sub, "center", 8.5);
  },
  medium(c, w, h, { d, status }) {
    const { p, x } = this.setup(d), cy = h / 2 + 4; ring(c, 70, cy, 46, 9, x.cache_rate / 100, P.sage); glow(c, 70, cy, 36, P.sage, .1);
    text(c, pct(x.cache_rate, 0), 30, cy - 14, 80, F.hero(21), P.ink, "center"); text(c, "缓存命中", 30, cy + 10, 80, F.text(8), P.faint, "center");
    const X = 140; text(c, "缓存分拣", X, 13, 100, F.title(13), P.ink); label(c, `${PERIOD[p.period]} · ${sourceLabel(d, p.source)}`, X, 31, 150, P.faint, "left", 8.5); statusPill(c, w, 15, status);
    const basis = Math.max(1, x.cache_basis), bw = w - X - 16;
    [["读取", x.cache_tokens, P.sage], ["创建", x.cache_creation_tokens, P.amber], ["计量基数", x.cache_basis, P.faint]].forEach(([k, v, cc], i) => {
      const y = 56 + i * 31; label(c, k, X, y, 60, P.sub, "left", 8.5); text(c, compact(v), X + bw - 70, y - 1, 70, F.num(11), P.ink, "right");
      rr(c, X, y + 15, bw, 5, 2.5, P.track); rr(c, X, y + 15, Math.max(4, bw * Math.min(1, v / basis)), 5, 2.5, cc);
    });
  },
  large(c, w, h, { d, status }) {
    const { p, x } = this.setup(d); header(c, w, "缓存健康", `${PERIOD[p.period]} · ${sourceLabel(d, p.source)}`, status);
    ring(c, 74, 118, 50, 10, x.cache_rate / 100, P.sage); glow(c, 74, 118, 40, P.sage, .12);
    text(c, pct(x.cache_rate), 30, 103, 88, F.hero(21), P.ink, "center"); text(c, "缓存命中", 30, 128, 88, F.text(8.5), P.faint, "center");
    const X = 150, bw = w - X - 16, basis = Math.max(1, x.cache_basis);
    [["读取", x.cache_tokens, P.sage], ["创建", x.cache_creation_tokens, P.amber], ["计量基数", x.cache_basis, P.faint]].forEach(([k, v, cc], i) => {
      const y = 64 + i * 32; label(c, k, X, y, 60, P.sub, "left", 9); text(c, compact(v), X + bw - 80, y - 1, 80, F.num(12), P.ink, "right");
      rr(c, X, y + 16, bw, 5, 2.5, P.track); rr(c, X, y + 16, Math.max(4, bw * Math.min(1, v / basis)), 5, 2.5, cc);
    });
    const h7 = (d.history_7d || []).map(v => Number(v.cache_rate) || 0); label(c, "近 7 日命中率", 16, 190, 100, P.faint, "left", 8);
    const lo = Math.max(0, Math.floor(Math.min(...h7) / 5) * 5 - 5), hi = Math.min(100, Math.ceil(Math.max(...h7) / 5) * 5 + 5), pts = smoothPts(h7.map(v => v - lo), 26, 210, w - 52, 56, hi - lo);
    [lo, (lo + hi) / 2, hi].forEach(g => { const gy = 210 + 56 - (g - lo) / (hi - lo) * 56; dashed(c, 16, gy, w - 32, P.line, 1, 2, 3); text(c, `${Math.round(g)}%`, w - 46, gy - 11, 30, F.mono(7), P.faint, "right"); });
    area(c, pts, 266, P.sage, .25); line(c, pts, P.sage, 1.8); pts.forEach((q, i) => dot(c, q[0], q[1], i === pts.length - 1 ? 3 : 1.8, P.sage));
    weekdays(d.history_7d).forEach((l, i) => text(c, l, pts[i][0] - 10, 272, 20, F.text(8), i === 6 ? P.sage : P.faint, "center"));
    const pr = x.prompt_tokens || 0, cr = x.cache_tokens || 0, tot = Math.max(1, pr + cr), sw = w - 32;
    label(c, "Prompt 与缓存读取（缓存不计入主 Token）", 16, 296, sw, P.faint, "left", 8);
    rr(c, 16, 312, sw * pr / tot - 2, 8, 3, P.ink, .75); rr(c, 16 + sw * pr / tot, 312, sw * cr / tot, 8, 3, P.sage);
    label(c, `Prompt ${compact(pr)}`, 16, h - 20, 140, P.sub, "left", 8.5); label(c, `缓存读取 ${compact(cr)}`, w - 156, h - 20, 140, P.sage, "right", 8.5);
  },
};

/* ============================== 7 · PULSE ============================== */
const Pulse = {
  setup(d) { const p = parseParam({ period: "today", source: "all" }); return { p, x: periodData(d, p.period, p.source) }; },
  wave(c, x, y, w, h, color) { const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40, k = Math.abs(t - .55) < .12 ? Math.sin((t - .43) / .24 * Math.PI * 3) * (1 - Math.abs(t - .55) / .12) : 0; pts.push([x + t * w, y + h / 2 - k * h / 2]); } line(c, pts, color, 1.6); },
  small(c, w, h, { d, status }) {
    const { p, x } = this.setup(d); label(c, `响应 · ${PERIOD[p.period]}`, 15, 14, 110); statusPill(c, w, 14, { kind: status.kind, label: "" }, w - 8);
    big(c, secs(x.avg_latency), 14, 30, w - 28, 32); label(c, "平均耗时", 15, 70, 80, P.faint, "left", 8.5);
    this.wave(c, 15, 88, w - 30, 30, P.indigo); glow(c, 15 + (w - 30) * .55, 103, 14, P.indigo, .15);
    label(c, `${num(x.requests)} 次请求`, 15, h - 22, w - 30, P.sub, "left", 8.5);
  },
  medium(c, w, h, { d, status }) {
    const { p, x } = this.setup(d); text(c, "响应脉搏", 16, 13, 100, F.title(13), P.ink); statusPill(c, w, 15, status);
    stat(c, "平均耗时", secs(x.avg_latency), 16, 40, 100, P.indigo, 20); stat(c, "请求", num(x.requests), 16, 86, 100, P.ink, 13); label(c, PERIOD[p.period], 16, h - 22, 100, P.faint, "left", 8);
    const lat = vals(d.history_7d, "avg_latency"), req = vals(d.history_7d, "requests"), X = 124, cw = w - X - 16;
    bars(c, req, X, 44, cw, 70, { base: P.faint, hi: P.ink, baseA: .35, trackA: 0, labels: weekdays(d.history_7d) });
    const pts = smoothPts(lat, X + cw / 14, 40, cw - cw / 7, 60, Math.max(...lat, 1) * 1.15); line(c, pts, P.indigo, 1.8); pts.forEach((q, i) => dot(c, q[0], q[1], i === 6 ? 3.2 : 2, P.indigo));
  },
  large(c, w, h, { d, status }) {
    const { p, x } = this.setup(d), lat = vals(d.history_7d, "avg_latency"), req = vals(d.history_7d, "requests");
    header(c, w, "响应脉搏", `${PERIOD[p.period]} · ${sourceLabel(d, p.source)}`, status);
    label(c, "平均响应耗时", 16, 56, 120); big(c, secs(x.avg_latency), 15, 68, 170, 40, P.indigo);
    this.wave(c, w - 130, 74, 114, 34, P.indigo); glow(c, w - 130 + 114 * .55, 91, 18, P.indigo, .18);
    const tw = (w - 32 - 8) / 2;
    [["真实请求", `${num(x.requests)} 次`], ["7 日样本均值", secs(lat.filter(v => v > 0).reduce((a, b) => a + b, 0) / Math.max(1, lat.filter(v => v > 0).length))]].forEach(([k, v], i) => { const X = 16 + i * (tw + 8); tile(c, X, 124, tw, 46); stat(c, k, v, X + 10, 131, tw - 16, P.ink, 16); });
    label(c, "每日请求", 16, 184, 100, P.faint, "left", 8); bars(c, req, 16, 200, w - 32, 46, { base: P.faint, hi: P.ink, baseA: .4 });
    label(c, "每日平均耗时", 16, 262, 100, P.faint, "left", 8);
    const pts = smoothPts(lat, 26, 280, w - 52, 44, Math.max(...lat, 1) * 1.1); area(c, pts, 324, P.indigo, .22); line(c, pts, P.indigo, 1.8); pts.forEach((q, i) => dot(c, q[0], q[1], i === 6 ? 3.2 : 1.9, P.indigo));
    weekdays(d.history_7d).forEach((l, i) => text(c, l, pts[i][0] - 10, 328, 20, F.text(8), i === 6 ? P.indigo : P.faint, "center"));
    label(c, "仅计入正数 use_time 样本 · 不展示 P95/P99", 16, h - 18, w - 32, P.faint, "left", 8);
  },
};

/* ============================== IO ============================== */
async function loadPayload() {
  const fm = FileManager.local(), path = fm.joinPath(fm.documentsDirectory(), CACHE_FILE);
  try {
    if (!API_URL || !API_KEY) throw new Error("未配置 API：请先运行 SetupTokenTrackerV4");
    const q = new Request(API_URL); q.headers = { "X-N8N-API-KEY": API_KEY, Accept: "application/json" }; q.timeoutInterval = 15;
    const data = await q.loadJSON(); if (!data || !data.summary || !data.meta) throw new Error("Invalid payload");
    try { fm.writeString(path, JSON.stringify({ data, ts: Date.now() })); } catch (_) { }
    return { data, ts: Date.now(), live: true };
  } catch (error) {
    console.warn(String(error));
    try { if (fm.fileExists(path)) { const x = JSON.parse(fm.readString(path)); if (x?.data?.summary) return { ...x, live: false }; } } catch (_) { }
    return { data: {}, ts: 0, live: false };
  }
}
function loadSettings() {
  const fm = FileManager.local();
  for (const name of ["token-tracker-v4-settings.json", "token-tracker-v3-settings.json", "token-tracker-v2-settings.json"]) {
    const p = fm.joinPath(fm.documentsDirectory(), name); if (!fm.fileExists(p)) continue;
    try { const v = JSON.parse(fm.readString(p)); if (/^https?:\/\//.test(v?.apiUrl || "") && v?.apiKey) return v; } catch (_) { }
  }
  return { apiUrl: "", apiKey: "" };
}
function nextRefresh() { const step = REFRESH_MINUTES * 60000; return new Date(Math.ceil((Date.now() + 1000) / step) * step); }

/* ============================== entry (last: the views above are const) ============================== */
let widget;
try {
  if (!["small", "medium", "large"].includes(FAMILY)) throw new Error(`Unsupported widget family: ${FAMILY}`);
  const result = await loadPayload();
  widget = render(WIDGET, FAMILY, result);
} catch (error) {
  console.error(String(error));
  widget = frame(FAMILY, (c, w, h) => stateCard(c, w, h, "error", "组件暂时无法显示", "稍后会自动重试"));
}
widget.url = `scriptable:///run?scriptName=${encodeURIComponent(Script.name())}&family=${FAMILY}`;
if (config.runsInWidget) Script.setWidget(widget);
else if (FAMILY === "small") await widget.presentSmall();
else if (FAMILY === "medium") await widget.presentMedium();
else await widget.presentLarge();
Script.complete();
