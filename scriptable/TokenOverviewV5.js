// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: chart-area;
/* Token Tracker V5 · Paper & Ink — TokenOverviewV5
 * today, projection, 30-day trend and Top models
 * Generated from src/v5/core.js by tools/build_v5.py — edit the core, then rebuild. */
const WIDGET = "overview";
/*
 * Token Tracker V5 · Paper & Ink (纸与墨) — shared widget core.
 * Ivory paper, ink, one clay accent; serif numbers and titles, pen marks (hand-drawn underline, hatched past days,
 * dashed projections, ink-dot calendar), a ledger layout with dotted leaders, an original pixel paper crane,
 * and per-model icon slots: drop your own images into Scriptable's Documents/TokenTracker/icons/<family>.png.
 * The build step (tools/build_v5.py) prepends `const WIDGET = "<id>";` and a Scriptable header.
 * Data: the /v3 payload (Main Token = prompt + completion; cache separate; requests = Σ request_count;
 * latency = mean of positive use_time samples).
 */

/* ============================== settings ============================== */
const SETTINGS = loadSettings();
const API_URL = String(SETTINGS.apiUrl || "").replace(/\/+$/, "");
const API_KEY = String(SETTINGS.apiKey || "");
const CACHE_FILE = "token-tracker-v5-cache.json";
const ICON_DIR = "TokenTracker/icons";
const REFRESH_MINUTES = 2, STALE_SECONDS = 1800;
const DARK = Device.isUsingDarkAppearance();
const FAMILY = String(config.widgetFamily || args.queryParameters?.family || "large").toLowerCase();
const PARAM = String(args.widgetParameter ?? args.queryParameters?.parameter ?? "").trim();

/* ============================== paper & ink tokens ============================== */
const P = DARK ? {
  paper: "#1E1D1B", ink: "#F0EEE6", sub: "#A6A39B", faint: "#7D7A73", rule: "#F0EEE6",
  clay: "#E08A6A", clayText: "#E8957A", sage: "#8DB99A", indigo: "#9AACEF", amber: "#E6B865", red: "#E58A84",
} : {
  paper: "#FAF9F5", ink: "#141413", sub: "#5E5D59", faint: "#7A7872", rule: "#141413",
  clay: "#D97757", clayText: "#A4492A", sage: "#3F6B4C", indigo: "#34509A", amber: "#B07A22", red: "#B4473F",
};
/* model families: colour of the default stamp and of their lines; initial shown when no icon image is present */
const FAMILY_STYLE = {
  Claude: ["claude", "C", DARK ? "#E08A6A" : "#D97757"], OpenAI: ["openai", "G", DARK ? "#7FB3A8" : "#2F5D57"],
  Gemini: ["gemini", "Ge", DARK ? "#9AACEF" : "#3F5BA9"], Grok: ["grok", "X", DARK ? "#B9B5AD" : "#3A3836"],
  DeepSeek: ["deepseek", "D", DARK ? "#86A2E8" : "#2E4FA0"], Kimi: ["kimi", "K", DARK ? "#B3BBCB" : "#6F7889"],
  Qwen: ["qwen", "Q", DARK ? "#B49AE6" : "#7A5CC2"], GLM: ["glm", "智", DARK ? "#8DB99A" : "#4F7A5C"],
  MiniMax: ["minimax", "M", DARK ? "#E6B865" : "#B07A22"], Doubao: ["doubao", "豆", DARK ? "#E3A7A0" : "#B4473F"],
};
const col = (hex, a = 1) => new Color(hex, a);
/* fonts carry their size because DrawContext cannot report it */
const F = {
  num: s => ({ f: new Font("Georgia", s), s }),
  numB: s => ({ f: new Font("Georgia-Bold", s), s }),
  it: s => ({ f: new Font("Georgia-Italic", s), s }),
  zh: s => ({ f: new Font("STSongti-SC-Bold", s), s }),
  zhR: s => ({ f: new Font("STSongti-SC-Regular", s), s }),
  lab: s => ({ f: Font.mediumSystemFont(s), s }),
  mono: s => ({ f: Font.regularMonospacedSystemFont(s), s }),
};

/* ============================== the paper crane (original pixel mascot, 32 × 22; runs "x:y:width:colour") ============================== */
const CRANE = {
  idle: "19:1:1:0 18:2:2:0 18:3:2:0 26:3:1:1 9:4:1:2 17:4:3:0 26:4:2:1 28:4:1:3 0:5:4:0 17:5:3:0 26:5:1:3 27:5:1:1 28:5:1:4 1:6:4:0 10:6:1:2 16:6:4:0 25:6:2:3 27:6:3:1 2:7:4:0 10:7:2:2 16:7:5:0 25:7:3:3 30:7:1:1 3:8:5:0 11:8:1:2 15:8:6:0 24:8:3:3 4:9:5:0 11:9:2:2 15:9:6:0 24:9:3:3 5:10:5:0 12:10:2:2 14:10:7:0 23:10:3:3 6:11:5:0 12:11:2:2 14:11:7:0 22:11:4:3 7:12:5:0 12:12:1:2 13:12:8:0 22:12:3:3 8:13:5:0 13:13:8:1 21:13:4:3 9:14:12:1 21:14:3:3 24:14:1:1 6:15:18:1 8:16:14:1 11:17:10:1 13:18:6:1 16:19:2:1",
  sleep: "25:0:4:5 27:1:1:5 26:2:1:5 25:3:4:5 29:5:3:5 30:6:1:5 29:7:3:5 19:9:2:0 2:10:4:0 11:10:1:2 18:10:3:0 3:11:5:0 11:11:2:2 17:11:4:0 5:12:4:0 12:12:2:2 16:12:5:0 25:12:1:3 26:12:1:1 27:12:1:3 6:13:5:0 12:13:2:2 14:13:7:0 24:13:3:3 27:13:1:4 8:14:5:0 13:14:8:1 23:14:3:3 27:14:2:1 9:15:13:1 22:15:3:3 29:15:1:1 6:16:18:1 8:17:14:1 11:18:10:1 13:19:6:1 16:20:2:1",
  cheer: "3:0:1:6 29:0:1:6 2:1:1:6 4:1:1:6 23:1:1:0 28:1:1:6 30:1:1:6 3:2:1:6 22:2:2:0 29:2:1:6 21:3:2:0 26:3:1:1 7:4:1:2 20:4:3:0 26:4:2:1 28:4:1:3 8:5:1:2 20:5:3:0 26:5:1:3 27:5:1:1 28:5:1:4 0:6:4:0 8:6:2:2 19:6:4:0 25:6:2:3 27:6:3:1 2:7:3:0 9:7:2:2 18:7:5:0 25:7:3:3 30:7:1:1 3:8:4:0 10:8:2:2 17:8:5:0 24:8:3:3 4:9:4:0 10:9:2:2 16:9:6:0 24:9:3:3 5:10:4:0 11:10:2:2 15:10:7:0 23:10:3:3 6:11:5:0 11:11:3:2 15:11:7:0 22:11:4:3 7:12:5:0 12:12:2:2 14:12:8:0 22:12:3:3 8:13:5:0 13:13:8:1 21:13:4:3 9:14:12:1 21:14:3:3 24:14:1:1 6:15:18:1 8:16:14:1 11:17:10:1 13:18:6:1 16:19:2:1",
};
const CRANE_PAL = DARK ? ["#E08A6A", "#C0623F", "#F0BFA8", "#D47552", "#F0EEE6", "#8C8982", "#E6B865"] : ["#D97757", "#B4532F", "#EBB59C", "#C4613C", "#141413", "#87857E", "#D4A13F"];
function crane(c, x, y, w, pose = "idle") {
  const u = w / 32; for (const t of CRANE[pose].split(" ")) { const [px, py, pw, ci] = t.split(":").map(Number); c.setFillColor(col(CRANE_PAL[ci])); c.fillRect(new Rect(x + px * u, y + py * u, pw * u + .25, u + .25)); }
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
  fill(c, 0, 0, w, h, P.paper);
  for (let y = 22; y < h; y += 22) fill(c, 0, y, w, .5, P.rule, DARK ? .03 : .035);       // faint ruled paper
  draw(c, w, h);
  const wd = new ListWidget(); wd.setPadding(0, 0, 0, 0); wd.backgroundImage = c.getImage(); wd.refreshAfterDate = nextRefresh();
  return wd;
}

/* ============================== pen & paper primitives ============================== */
function fill(c, x, y, w, h, color, a = 1) { c.setFillColor(col(color, a)); c.fillRect(new Rect(x, y, w, h)); }
function rr(c, x, y, w, h, r, color, a = 1) { const p = new Path(); p.addRoundedRect(new Rect(x, y, w, h), Math.min(r, w / 2, h / 2), Math.min(r, w / 2, h / 2)); c.addPath(p); c.setFillColor(col(color, a)); c.fillPath(); }
function dot(c, x, y, r, color, a = 1) { c.setFillColor(col(color, a)); c.fillEllipse(new Rect(x - r, y - r, r * 2, r * 2)); }
function hair(c, x, y, w, a = .12) { fill(c, x, y, w, .6, P.rule, a); }
function vhair(c, x, y, h, a = .12) { fill(c, x, y, .6, h, P.rule, a); }
function dashed(c, x, y, w, color, a = .5, on = 3, off = 3) { for (let xx = x; xx < x + w; xx += on + off) fill(c, xx, y, Math.min(on, x + w - xx), .8, color, a); }
function leader(c, x0, x1, y) { for (let x = x0; x < x1; x += 3.2) dot(c, x, y, .45, P.ink, .38); }
function stroke(c, pts, color, t = 1.4, a = 1) { if (pts.length < 2) return; const p = new Path(); pts.forEach((q, i) => i ? p.addLine(new Point(q[0], q[1])) : p.move(new Point(q[0], q[1]))); c.addPath(p); c.setStrokeColor(col(color, a)); c.setLineWidth(t); c.strokePath(); }
/* the hand-drawn clay underline under today's number */
function underline(c, x, y, w, t = 2.2) {
  const p = new Path(); p.move(new Point(x + 2, y + 3)); p.addCurve(new Point(x + w * .52, y + 2), new Point(x + w * .2, y), new Point(x + w * .36, y + 5));
  p.addCurve(new Point(x + w - 2, y), new Point(x + w * .7, y - 1), new Point(x + w * .88, y + 2.5)); c.addPath(p); c.setStrokeColor(col(P.clay)); c.setLineWidth(t); c.strokePath();
  dot(c, x + 2, y + 3, t / 2, P.clay); dot(c, x + w - 2, y, t / 2, P.clay);
}
/* past days: outlined + 45° hatching (computed clipping — DrawContext has no clip) */
function hatchRect(c, x, y, w, h, a = 1) {
  if (h <= 0 || w <= 0) return; const ink = P.ink, step = 3.6;
  for (let d = -h; d < w; d += step) { const t0 = Math.max(0, -d / h), t1 = Math.min(1, (w - d) / h); if (t1 > t0) stroke(c, [[x + d + t0 * h, y + h - t0 * h], [x + d + t1 * h, y + h - t1 * h]], ink, .6, .32 * a); }
  stroke(c, [[x, y + h], [x, y], [x + w, y], [x + w, y + h]], ink, .8, .55 * a);
}
function ring(c, cx, cy, r, t, frac, color, inner = true) {
  arc(c, cx, cy, r, t, 0, Math.PI * 2 * .9999, P.rule, .1); if (frac > .002) arc(c, cx, cy, r, t, 0, Math.PI * 2 * Math.min(1, frac), color, 1, true);
  if (inner) for (let k = 0; k < 64; k++) { const an = k / 64 * Math.PI * 2; dot(c, cx + Math.cos(an) * (r - t - 3.5), cy + Math.sin(an) * (r - t - 3.5), .4, P.rule, .3); }
}
function arc(c, cx, cy, r, t, a0, a1, color, a = 1, caps = false) {
  const s = -Math.PI / 2, n = Math.max(8, Math.ceil((a1 - a0) / .05)), p = new Path();
  for (let i = 0; i <= n; i++) { const an = s + a0 + (a1 - a0) * i / n, pt = new Point(cx + Math.cos(an) * r, cy + Math.sin(an) * r); i ? p.addLine(pt) : p.move(pt); }
  c.addPath(p); c.setStrokeColor(col(color, a)); c.setLineWidth(t); c.strokePath();
  if (caps) { dot(c, cx + Math.cos(s + a0) * r, cy + Math.sin(s + a0) * r, t / 2, color, a); dot(c, cx + Math.cos(s + a1) * r, cy + Math.sin(s + a1) * r, t / 2, color, a); }
}
function text(c, s, x, y, w, font, color, align = "left", a = 1) {
  c.setFont(font.f); c.setTextColor(col(color, a)); align === "right" ? c.setTextAlignedRight() : align === "center" ? c.setTextAlignedCenter() : c.setTextAlignedLeft();
  c.drawTextInRect(String(s), new Rect(x, y, w, font.s * 1.4));
}
function advance(s, size) { let u = 0; for (const ch of String(s)) u += /[　-鿿＀-￯]/.test(ch) ? 1 : /[0-9]/.test(ch) ? .56 : /[A-Z]/.test(ch) ? .68 : /[ .,:·]/.test(ch) ? .28 : .5; return u * size; }
function fitSize(s, maxW, size, min = size * .58) { const a = advance(s, size); return a <= maxW ? size : Math.max(min, size * maxW / a); }
function ellipsize(s, maxW, size) { s = String(s); while (s.length > 2 && advance(s, size) > maxW) s = s.slice(0, -2) + "…"; return s; }
function big(c, s, x, y, w, size, color = P.ink, align = "left") { const z = fitSize(s, w, size); text(c, s, x, y + (size - z) * .75, w, F.num(z), color, align); return advance(s, z); }
function lab(c, s, x, y, w, color = P.faint, align = "left", size = 9) { text(c, s, x, y, w, F.lab(size), color, align); }
function note(c, s, x, y, w, color = P.sub, align = "left", size = 10.5) { text(c, s, x, y, w, F.it(size), color, align); }
function title(c, s, x, y, w, size = 15) { text(c, s, x, y, w, F.zh(size), P.ink); }
function liveDot(c, x, y, status) { const color = { live: P.sage, cache: P.indigo, stale: P.amber, error: P.red }[status.kind] || P.faint; dot(c, x, y, 2.8, color); }
function stamp(c, x, y, size, color, label) {        // round ink stamp with the status word (drawn upright: DrawContext cannot rotate)
  c.setStrokeColor(col(color, .9)); c.setLineWidth(1.4); c.strokeEllipse(new Rect(x, y, size, size));
  c.setStrokeColor(col(color, .35)); c.setLineWidth(.6); c.strokeEllipse(new Rect(x + 3, y + 3, size - 6, size - 6));
  text(c, label, x, y + size / 2 - 7, size, F.zh(10), color, "center");
}
/* ledger strip: three cells between hairlines */
function strip(c, x, y, w, cells, size = 15) {
  hair(c, x, y, w); hair(c, x, y + 40, w); const cw = w / cells.length;
  cells.forEach(([k, v, color], i) => { const cx = x + i * cw + (i ? 11 : 0); if (i) vhair(c, x + i * cw, y + 6, 28); lab(c, k, cx, y + 6, cw - 12); text(c, v, cx, y + 18, cw - 14, F.num(fitSize(v, cw - 14, size)), color || P.ink); });
}

/* ============================== model icons (your own images) ============================== */
const ICONS = {};
function famStyle(fam) { return FAMILY_STYLE[fam] || [String(fam || "other").toLowerCase(), String(fam || "?").slice(0, 1).toUpperCase(), DARK ? "#C9A0C0" : "#8E5E86"]; }
async function loadIcons(families) {
  const managers = []; try { managers.push(FileManager.iCloud()); } catch (_) { } managers.push(FileManager.local());
  for (const fam of families) {
    const key = famStyle(fam)[0]; if (ICONS[key] !== undefined) continue; ICONS[key] = null;
    for (const fm of managers) for (const ext of ["png", "jpg", "jpeg"]) {
      if (ICONS[key]) break;
      try { const p = fm.joinPath(fm.joinPath(fm.documentsDirectory(), ICON_DIR), `${key}.${ext}`); if (!fm.fileExists(p)) continue; if (fm.isFileStoredIniCloud && fm.isFileStoredIniCloud(p) && !fm.isFileDownloaded(p)) await fm.downloadFileFromiCloud(p); ICONS[key] = fm.readImage(p); } catch (_) { }
    }
  }
}
/* draws your image for the family if present, otherwise an ink stamp with the family's initial */
function icon(c, fam, cx, cy, d) {
  const [key, ini, color] = famStyle(fam), img = ICONS[key];
  if (img) { c.drawImageInRect(img, new Rect(cx - d / 2, cy - d / 2, d, d)); return; }
  dot(c, cx, cy, d / 2, color); const s = ini.length > 1 ? d * .42 : d * .52;
  text(c, ini, cx - d / 2, cy - s * .72, d, /[　-鿿]/.test(ini) ? F.zh(s) : F.numB(s), P.paper, "center");
}
function famColor(fam) { return famStyle(fam)[2]; }

/* ============================== data helpers ============================== */
function statusOf(result) {
  const d = result.data || {}, sync = Number(d.meta?.last_sync_at || 0), now = Math.floor(Date.now() / 1000);
  if (!d.summary) return { kind: "error", label: "离线", sync };
  if (!sync || now - sync >= STALE_SECONDS || d.meta?.status === "stale") return { kind: "stale", label: "稍旧", sync };
  if (!result.live) return { kind: "cache", label: "缓存", sync };
  return { kind: "live", label: "实时", sync };
}
function poseOf(status) { return status.kind === "live" ? "idle" : "sleep"; }
function parseParam(defaults) {
  const out = Object.assign({}, defaults);
  for (const p of (PARAM ? PARAM.split(",").map(s => s.trim()) : [])) { if (/^\d+$/.test(p)) out.rank = Math.max(1, Number(p)); else if (["today", "7d", "month"].includes(p)) out.period = p; else if (p) out.source = p; }
  return out;
}
const PERIOD = { today: "今日", "7d": "近七日", month: "本月" };
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
function shortModel(s) { return String(s || "").trim().replace(/^claude-/i, "Claude ").replace(/^gpt-/i, "GPT-").replace(/^gemini-/i, "Gemini ").replace(/^deepseek-/i, "DeepSeek ").replace(/^kimi-/i, "Kimi ").replace(/^glm-/i, "GLM-").replace(/^qwen/i, "Qwen").replace(/-(\d)/g, " $1").replace(/-/g, " ").replace(/\s+/g, " ").replace(/(\d) (\d)/g, "$1.$2").trim().replace(/(^|\s)([a-z])/g, (_, sp, ch) => sp + ch.toUpperCase()).replace(/^GPT (\d)/, "GPT-$1").replace(/^GLM (\d)/, "GLM-$1"); }
function familyOf(m) {
  if (m?.family) return m.family; const s = String(m?.model || "").toLowerCase();
  return s.startsWith("claude") ? "Claude" : /^(gpt|o\d)/.test(s) ? "OpenAI" : s.startsWith("gemini") ? "Gemini" : s.startsWith("grok") ? "Grok" : s.startsWith("deepseek") ? "DeepSeek" : s.startsWith("kimi") || s.startsWith("moonshot") ? "Kimi" : s.startsWith("qwen") ? "Qwen" : s.startsWith("glm") ? "GLM" : "Other";
}
function dateLine() { const d = new Date(), cn = "〇一二三四五六七八九十"; const n = k => k <= 10 ? cn[k] : k < 20 ? "十" + cn[k - 10] : cn[Math.floor(k / 10)] + "十" + (k % 10 ? cn[k % 10] : ""); return `${n(d.getMonth() + 1)}月${n(d.getDate())}日 · 周${"日一二三四五六"[d.getDay()]}`; }
function shortDate() { const d = new Date(); return `${d.getMonth() + 1}月${d.getDate()}日`; }

/* ============================== shared drawings ============================== */
function weekBars(c, v, x, y, w, h, o = {}) {
  const n = v.length, gap = o.gap ?? Math.max(4, w / n * .32), bw = (w - gap * (n - 1)) / n, max = Math.max(...v, o.ghost || 0, 1) * 1.04;
  v.forEach((val, i) => {
    const bh = val > 0 ? Math.max(2, val / max * h) : 0, bx = x + i * (bw + gap), last = i === n - 1 && !o.noToday;
    if (last) { if (o.ghost > val) { const gh = o.ghost / max * h; dashedBox(c, bx, y + h - gh, bw, gh - bh, o.hi || P.clay); } if (bh) rr(c, bx, y + h - bh, bw, bh, 1.5, o.hi || P.clay); }
    else hatchRect(c, bx, y + h - bh, bw, bh, o.hatchA ?? 1);
    if (o.labels) text(c, o.labels[i], bx - 6, y + h + 3, bw + 12, F.it(o.labelSize || 9.5), last ? (o.hi === P.indigo ? P.indigo : P.clayText) : P.faint, "center");
  });
  if (o.avg > 0) { const ay = y + h - o.avg / max * h; dashed(c, x, ay, w, P.ink, .45); if (o.avgLabel !== false) note(c, "均", x + w - 12, ay - 13, 12, P.faint, "right", 9); }
  return { bw, gap, max };
}
function dashedBox(c, x, y, w, h, color) { if (h <= 1) return; for (let yy = y; yy < y + h; yy += 4) { fill(c, x, yy, .9, Math.min(2.2, y + h - yy), color, .9); fill(c, x + w - .9, yy, .9, Math.min(2.2, y + h - yy), color, .9); } for (let xx = x; xx < x + w; xx += 4) fill(c, xx, y, Math.min(2.2, x + w - xx), .9, color, .9); }
function penLine(c, v, x, y, w, h, color = P.ink, t = 1.3, max) {
  const m = max || Math.max(...v, 1) * 1.08, n = v.length, pts = v.map((val, i) => [x + (n === 1 ? w / 2 : i * w / (n - 1)), y + h - val / m * h]);
  stroke(c, pts, color, t); return pts;
}
function ruled(c, x, y, w, h, step = 16) { for (let yy = y + step; yy < y + h; yy += step) hair(c, x, yy, w, .06); }
function inkDots(c, days, x, y, cols, cell, gap) {
  const list = (days || []).slice(-cols * 7), max = Math.max(...list.map(v => Number(v.tokens) || 0), 1), off = cols * 7 - list.length;
  list.forEach((v, i) => {
    const k = i + off, cx = x + Math.floor(k / 7) * (cell + gap) + cell / 2, cy = y + (k % 7) * (cell + gap) + cell / 2, t = Number(v.tokens) || 0, lv = t <= 0 ? 0 : Math.min(4, 1 + Math.floor(t / max * 3.999));
    if (!lv) dot(c, cx, cy, cell * .14, P.ink, .22); else dot(c, cx, cy, cell / 2 * [0, .52, .68, .84, 1][lv], P.clay, [0, .45, .62, .8, 1][lv]);
    if (i === list.length - 1) { c.setStrokeColor(col(P.clay, .9)); c.setLineWidth(1); c.strokeEllipse(new Rect(cx - cell * .85, cy - cell * .85, cell * 1.7, cell * 1.7)); }
  });
}
function stateCard(c, w, h, kind, head, detail) {
  const cw = Math.min(w * .42, 96); crane(c, (w - cw) / 2, h * .2, cw, "sleep");
  text(c, head, 10, h * .2 + cw * 22 / 32 + 8, w - 20, F.zh(14), kind === "error" ? P.red : P.ink, "center");
  note(c, detail, 10, h * .2 + cw * 22 / 32 + 28, w - 20, P.sub, "center", 10);
}
function hdrSmall(c, w, s, status) { lab(c, s, 14, 13, w - 40); liveDot(c, w - 16, 18.5, status); }

/* ============================== 1 · OVERVIEW ============================== */
const Overview = {
  small(c, w, h, { d, status }) {
    const s = d.summary; hdrSmall(c, w, `今日 · ${shortDate()}`, status);
    const nw = big(c, compact(s.today.tokens), 13, 28, w - 26, 36); underline(c, 14, 70, Math.min(w - 28, Math.max(60, nw + 4)));
    note(c, `较 7 日均 ${signed(s.vs_average_percent)}`, 14, 78, w - 28, s.vs_average_percent >= 0 ? P.clayText : P.sage, "left", 11);
    weekBars(c, vals(d.history_7d), 14, h - 40, w - 28, 28, { ghost: s.projection, gap: 4.5 });
  },
  medium(c, w, h, { d, status }) {
    const s = d.summary, split = 150;
    lab(c, `今日 · ${shortDate()}`, 16, 14, 120); const nw = big(c, compact(s.today.tokens), 15, 29, split - 26, 38); underline(c, 16, 73, Math.min(split - 30, nw + 4));
    note(c, `较 7 日均 ${signed(s.vs_average_percent)}`, 16, 82, split - 20, s.vs_average_percent >= 0 ? P.clayText : P.sage, "left", 11);
    text(c, `累计 ${compact(s.all_time_total)}`, 16, 112, 70, F.num(12.5), P.ink); text(c, `预计 ${compact(s.projection)}`, 16, 130, 120, F.num(12.5), P.sub);
    vhair(c, split, 18, h - 36); lab(c, "近七日", split + 16, 14, 80); liveDot(c, w - 16, 19.5, status);
    weekBars(c, vals(d.history_7d), split + 16, 38, w - split - 32, 82, { avg: s.baseline_7d?.daily_average, ghost: s.projection, labels: weekdays(d.history_7d) });
  },
  large(c, w, h, { d, status }) {
    const s = d.summary, tops = (d.top_models?.today || []).slice(0, 3), X = 18, IW = w - 36;
    title(c, "Token 日记", X, 14, 160, 18); note(c, `${dateLine()} · ${status.label}`, X, 38, 220, P.sub, "left", 11);
    crane(c, w - X - 62, 12, 62, poseOf(status));
    lab(c, "TODAY · 今日用量", X, 66, 140); const nw = big(c, compact(s.today.tokens), X - 1, 78, 210, 50); underline(c, X, 133, Math.min(200, nw + 6), 2.6);
    const frac = s.projection > 0 ? s.today.tokens / s.projection : 0; ring(c, w - X - 96, 112, 16, 4, frac, P.clay, false);
    text(c, pct(frac * 100, 0), w - X - 74, 98, 74, F.num(17), P.ink); note(c, `达成预计 ${compact(s.projection)}`, w - X - 74, 118, 80, P.sub, "left", 9.5);
    strip(c, X, 150, IW, [["累计", compact(s.all_time_total)], ["本月", compact(d.periods?.month?.tokens)], ["较 7 日均", signed(s.vs_average_percent), s.vs_average_percent >= 0 ? P.clayText : P.sage]]);
    const cy = 202, ch = 58; ruled(c, X, cy - 4, IW, ch + 4, 16); const pts = penLine(c, vals(d.history_30d), X, cy, IW - 6, ch, P.ink, 1.3);
    const lp = pts[pts.length - 1]; dot(c, lp[0], lp[1], 6.5, P.clay, .18); dot(c, lp[0], lp[1], 3.4, P.clay); note(c, "三十日", w - X - 50, cy - 8, 50, P.sub, "right", 9.5);
    tops.forEach((m, i) => {
      const y = 274 + i * 24, fam = familyOf(m); icon(c, fam, X + 8, y + 8, 16);
      const name = ellipsize(shortModel(m.model), 150, 13); text(c, name, X + 24, y, 160, F.num(13), P.ink);
      const valS = `${compact(m.tokens)} · ${pct(m.share)}`; text(c, valS, w - X - 120, y + 2, 120, F.mono(10), P.ink, "right");
      leader(c, X + 30 + advance(name, 13), w - X - advance(valS, 10) * 1.12 - 8, y + 12);
    });
  },
};

/* ============================== 2 · RANKING (the ledger) ============================== */
const Ranking = {
  setup(d) { const p = parseParam({ period: "today", source: "all" }); return { p, tops: topsFor(d, p.period, p.source), total: periodData(d, p.period, p.source) }; },
  row(c, m, x, y, w, nameSize, iconD) {
    const fam = familyOf(m); icon(c, fam, x + iconD / 2, y + nameSize * .62, iconD);
    const name = ellipsize(shortModel(m.model), w * .5, nameSize), nx = x + iconD + 7; text(c, name, nx, y, w * .55, F.num(nameSize), P.ink);
    const v = compact(m.tokens), sh = pct(m.share); text(c, sh, x + w - 34, y + 2, 34, F.mono(9.5), P.faint, "right"); text(c, v, x + w - 92, y + 2, 54, F.mono(10.5), P.ink, "right");
    leader(c, nx + advance(name, nameSize) + 6, x + w - 40 - advance(v, 10.5) * 1.15 - 6, y + nameSize + 1);
  },
  small(c, w, h, { d, status }) {
    const { p, tops } = this.setup(d); hdrSmall(c, w, `排行 · ${PERIOD[p.period]}`, status);
    tops.slice(0, 4).forEach((m, i) => { const y = 34 + i * 29, fam = familyOf(m); icon(c, fam, 22, y + 8, 15); const name = ellipsize(shortModel(m.model), w - 40, 11.5); text(c, name, 35, y, w - 46, F.num(11.5), P.ink); text(c, `${compact(m.tokens)} · ${pct(m.share, 0)}`, 35, y + 14, w - 46, F.mono(8.5), P.faint); hair(c, 14, y + 26, w - 28, .07); });
  },
  medium(c, w, h, { d, status }) {
    const { p, tops } = this.setup(d); title(c, "模型排行", 16, 12, 90, 15); note(c, PERIOD[p.period], 90, 15, 60, P.clayText, "left", 12);
    lab(c, sourceLabel(d, p.source), w - 128, 15, 100, P.faint, "right"); liveDot(c, w - 16, 20, status);
    tops.slice(0, 5).forEach((m, i) => { const y = 37 + i * 23.5; this.row(c, m, 16, y, w - 32, 13, 16); hair(c, 16, y + 21, w - 32, .07); });
  },
  large(c, w, h, { d, status }) {
    const { p, tops, total } = this.setup(d), X = 18, IW = w - 36;
    title(c, "排行簿", X, 14, 120, 18); note(c, `${PERIOD[p.period]} · ${sourceLabel(d, p.source)}`, w - X - 180, 19, 160, P.sub, "right", 11); liveDot(c, w - X - 4, 25, status);
    lab(c, `${PERIOD[p.period]}合计`, X, 50, 100); big(c, compact(total.tokens), X - 1, 62, 180, 42);
    text(c, `${num(total.requests)} 次请求`, w - X - 140, 74, 140, F.mono(10.5), P.sub, "right"); text(c, `缓存 ${pct(total.cache_rate)}`, w - X - 140, 90, 140, F.mono(10.5), P.sage, "right");
    let x = X; tops.slice(0, 5).forEach(m => { const ww = IW * (m.share || 0) / 100; if (ww > 2) rr(c, x, 114, ww - 2, 6, 3, famColor(familyOf(m))); x += ww; }); if (x < X + IW - 2) rr(c, x, 114, X + IW - x, 6, 3, P.rule, .12);
    tops.slice(0, 5).forEach((m, i) => {
      const y = 132 + i * 42, fam = familyOf(m), color = famColor(fam); hair(c, X, y - 6, IW, .08);
      icon(c, fam, X + 14, y + 14, 28);
      text(c, ellipsize(shortModel(m.model), 150, 14.5), X + 38, y, 160, F.num(14.5), P.ink);
      lab(c, `${fam} · ${num(m.requests)} 次 · 缓存 ${pct(m.cache_rate, 0)}`, X + 38, y + 19, 170, P.faint, "left", 8.5);
      penLine(c, vals(m.history_7d), w - X - 118, y + 6, 46, 18, color, 1.3);
      text(c, compact(m.tokens), w - X - 64, y, 64, F.num(14.5), P.ink, "right"); text(c, pct(m.share), w - X - 64, y + 19, 64, F.mono(9), P.faint, "right");
    });
  },
};

/* ============================== 3 · MODEL FOCUS ============================== */
const Focus = {
  setup(d) { const p = parseParam({ rank: 1, period: "today", source: "all" }); return { p, m: topsFor(d, p.period, p.source)[p.rank - 1] }; },
  none(c, w, h, p) { stateCard(c, w, h, "empty", "暂无该排名", `${PERIOD[p.period]}没有第 ${p.rank} 名`); },
  small(c, w, h, { d, status }) {
    const { p, m } = this.setup(d); if (!m) return this.none(c, w, h, p); const fam = familyOf(m);
    hdrSmall(c, w, `№ ${p.rank} · ${PERIOD[p.period]}`, status);
    icon(c, fam, 25, 41, 20); text(c, ellipsize(shortModel(m.model), w - 52, 14), 40, 32, w - 50, F.num(14), P.ink);
    ring(c, 42, 92, 24, 5, m.share / 100, famColor(fam), false); text(c, pct(m.share, 0), 18, 85, 48, F.num(13), P.ink, "center");
    big(c, compact(m.tokens), 76, 74, w - 88, 22); note(c, `${num(m.requests)} 次`, 77, 99, 60, P.sub, "left", 10);
    text(c, `缓存 ${pct(m.cache_rate, 0)} · ${secs(m.avg_latency)}`, 14, h - 22, w - 28, F.mono(9), P.faint);
  },
  medium(c, w, h, { d, status }) {
    const { p, m } = this.setup(d); if (!m) return this.none(c, w, h, p); const fam = familyOf(m), color = famColor(fam), X = 136;
    ring(c, 68, h / 2, 48, 8, m.share / 100, color); text(c, pct(m.share, 0), 28, h / 2 - 15, 80, F.num(25), P.ink, "center"); note(c, "占比", 28, h / 2 + 12, 80, P.sub, "center", 10);
    icon(c, fam, X + 15, 32, 30); lab(c, `№ ${p.rank} · ${fam.toUpperCase()} · ${PERIOD[p.period]}`, X + 38, 17, w - X - 56); liveDot(c, w - 16, 21.5, status);
    text(c, ellipsize(shortModel(m.model), w - X - 54, 18), X + 38, 29, w - X - 54, F.num(18), P.ink);
    big(c, compact(m.tokens), X - 1, 54, w - X - 16, 30);
    const cw = (w - X - 16) / 3; hair(c, X, 98, w - X - 16);
    [["请求", num(m.requests), P.ink], ["缓存", pct(m.cache_rate), P.sage], ["耗时", secs(m.avg_latency), P.indigo]].forEach(([k, v, cc], i) => { lab(c, k, X + i * cw, 104, cw); text(c, v, X + i * cw, 116, cw - 4, F.num(14), cc); });
  },
  large(c, w, h, { d, status }) {
    const { p, m } = this.setup(d); if (!m) return this.none(c, w, h, p); const fam = familyOf(m), color = famColor(fam), X = 18, IW = w - 36;
    title(c, `№ ${p.rank} · 模型档案`, X, 14, 200, 18); note(c, `${PERIOD[p.period]} · ${sourceLabel(d, p.source)}`, w - X - 160, 19, 140, P.sub, "right", 11); liveDot(c, w - X - 4, 25, status);
    ring(c, X + 58, 112, 54, 9, m.share / 100, color); text(c, pct(m.share, 0), X + 18, 96, 80, F.num(28), P.ink, "center"); note(c, "占比", X + 18, 126, 80, P.sub, "center", 10);
    const R = X + 132; icon(c, fam, R + 14, 70, 28); text(c, ellipsize(shortModel(m.model), w - R - 52, 20), R + 34, 58, w - R - 52, F.num(20), P.ink); note(c, `${fam} 一家`, R + 34, 81, 120, P.clayText, "left", 11);
    const nw = big(c, compact(m.tokens), R - 1, 100, w - R - X, 38); underline(c, R, 142, Math.min(w - R - X, nw + 4));
    note(c, "主 Token = Prompt + Completion；缓存另记，不计入。", X, 178, IW, P.sub, "left", 10);
    strip(c, X, 198, IW, [["请求", num(m.requests)], ["缓存命中", pct(m.cache_rate), P.sage], ["平均耗时", secs(m.avg_latency), P.indigo]], 17);
    weekBars(c, vals(m.history_7d), X, 258, IW, 62, { labels: weekdays(m.history_7d), gap: 12, hi: color === P.clay ? P.clay : color });
  },
};

/* ============================== 4 · RHYTHM ============================== */
const Rhythm = {
  small(c, w, h, { d, status }) {
    const s = d.summary, h7 = vals(d.history_7d); hdrSmall(c, w, "用量节奏", status);
    big(c, compact(s.today.tokens), 13, 28, w - 26, 26, P.clayText);
    weekBars(c, h7, 14, 66, w - 28, 50, { avg: s.baseline_7d?.daily_average, ghost: s.projection, labels: weekdays(d.history_7d), avgLabel: false, gap: 4.5, labelSize: 8.5 });
    note(c, `均 ${compact(s.baseline_7d?.daily_average)} · 峰 ${compact(Math.max(...h7))}`, 14, h - 18, w - 28, P.sub, "left", 9.5);
  },
  medium(c, w, h, { d, status }) {
    const s = d.summary, X = 18; title(c, "用量节奏", X, 13, 100, 15); liveDot(c, w - 16, 20, status);
    lab(c, "今日", X, 42, 80); big(c, compact(s.today.tokens), X - 1, 53, 92, 23, P.clayText);
    lab(c, "日均 · 预计", X, 90, 90); text(c, `${compact(s.baseline_7d?.daily_average)} · ${compact(s.projection)}`, X, 102, 100, F.num(12.5), P.ink);
    weekBars(c, vals(d.history_7d), 124, 26, w - 140, 92, { avg: s.baseline_7d?.daily_average, ghost: s.projection, labels: weekdays(d.history_7d), gap: 8 });
  },
  large(c, w, h, { d, status }) {
    const s = d.summary, h7 = vals(d.history_7d), X = 18, IW = w - 36;
    title(c, "用量节奏", X, 14, 120, 18); note(c, "七日真实用量 · 三十日轮廓", w - X - 190, 19, 172, P.sub, "right", 11); liveDot(c, w - X - 4, 25, status);
    strip(c, X, 50, IW, [["今日", compact(s.today.tokens), P.clayText], ["日均", compact(s.baseline_7d?.daily_average)], ["峰值", compact(Math.max(...h7))]], 18);
    weekBars(c, h7, X, 106, IW, 120, { avg: s.baseline_7d?.daily_average, ghost: s.projection, labels: weekdays(d.history_7d), gap: 14 });
    ruled(c, X, 254, IW, 64, 16); penLine(c, vals(d.history_30d), X, 258, IW, 58, P.indigo, 1.3); note(c, "三十日", X, 318, 60, P.sub, "left", 9.5);
    note(c, `较 7 日均 ${signed(s.vs_average_percent)}`, w - X - 140, 318, 140, s.vs_average_percent >= 0 ? P.clayText : P.sage, "right", 10);
  },
};

/* ============================== 5 · ACTIVITY ============================== */
const Activity = {
  small(c, w, h, { d, status }) {
    const s = d.summary; hdrSmall(c, w, "连续使用", status);
    const nw = big(c, String(s.current_streak), 13, 26, 70, 32, P.clayText); text(c, "天", 16 + nw, 40, 20, F.zh(13), P.clayText);
    note(c, `最长 ${s.longest_streak_180}`, w - 84, 42, 70, P.sub, "right", 10);
    inkDots(c, d.history_180d, 15, 74, 12, 8.4, 2.4);
  },
  medium(c, w, h, { d, status }) {
    const s = d.summary, X = 18; title(c, "活动", X, 12, 50, 15); note(c, "一百八十日", X + 38, 15, 90, P.clayText, "left", 12); liveDot(c, w - 16, 20, status);
    lab(c, "连续", X, 44, 60); const nw = big(c, String(s.current_streak), X - 1, 55, 50, 25, P.clayText); text(c, "天", X + nw + 1, 64, 20, F.zh(12), P.clayText);
    lab(c, "最长 · 活跃", X, 92, 80); text(c, `${s.longest_streak_180} · ${s.active_days_180} 天`, X, 104, 90, F.num(13), P.ink);
    inkDots(c, d.history_180d, 112, 42, 22, 7, 2.2);
  },
  large(c, w, h, { d, status }) {
    const s = d.summary, X = 18, IW = w - 36, record = s.current_streak > 0 && s.current_streak >= s.longest_streak_180;
    title(c, "活动日历", X, 14, 120, 18); note(c, "一百八十日 · 每一点是一天", X, 38, 200, P.sub, "left", 11);
    crane(c, w - X - 58, 10, 58, status.kind !== "live" ? "sleep" : record ? "cheer" : "idle");
    const cols = 26, cell = (IW - 25 * 2.6) / cols, list = (d.history_180d || []).slice(-cols * 7), off = cols * 7 - list.length;
    const MN = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]; let last = -1, lastCol = -9;
    list.forEach((v, i) => { const m = new Date(`${v.date}T12:00:00`).getMonth(), colx = Math.floor((i + off) / 7); if (m !== last && colx - lastCol >= 3) { note(c, MN[m], X + colx * (cell + 2.6), 62, 44, P.sub, "left", 9.5); last = m; lastCol = colx; } });
    inkDots(c, d.history_180d, X, 80, cols, cell, 2.6);
    strip(c, X, 178, IW, [["连续使用", `${s.current_streak} 天`, P.clayText], ["最长连续", `${s.longest_streak_180} 天`], ["活跃天数", `${s.active_days_180} / 180`]], 17);
    weekBars(c, vals(d.history_30d), X, 234, IW, 64, { gap: 2.2 });
    note(c, record ? "连续天数追平了最长纪录，纸鹤展翅。" : "今天的那一点，圈在最后一列。", X, h - 22, IW, P.sub, "left", 10);
  },
};

/* ============================== 6 · CACHE ============================== */
const Cache = {
  setup(d) { const p = parseParam({ period: "today", source: "all" }); return { p, x: periodData(d, p.period, p.source) }; },
  rows(c, x, X, y0, w, gapY, size = 12) {
    const basis = Math.max(1, x.cache_basis || 0);
    [["读取", x.cache_tokens, P.sage, false], ["创建", x.cache_creation_tokens, P.amber, false], ["计量基数", x.cache_basis, P.ink, true]].forEach(([k, v, cc, hatch], i) => {
      const y = y0 + i * gapY, val = compact(v); lab(c, k, X, y, 60, P.sub, "left", 9.5); text(c, val, X + w - 70, y - 1, 70, F.num(size), P.ink, "right");
      leader(c, X + advance(k, 9.5) + 8, X + w - advance(val, size) * 1.05 - 6, y + 9);
      const bw = Math.max(3, w * Math.min(1, (v || 0) / basis)); if (hatch) hatchRect(c, X, y + 15, bw, 5, .8); else rr(c, X, y + 15, bw, 5, 1.5, cc);
    });
  },
  small(c, w, h, { d, status }) {
    const { p, x } = this.setup(d); hdrSmall(c, w, `缓存 · ${PERIOD[p.period]}`, status);
    const cx = w / 2, cy = 84; ring(c, cx, cy, 40, 7, (x.cache_rate || 0) / 100, P.sage); text(c, pct(x.cache_rate, 0), cx - 40, cy - 15, 80, F.num(26), P.ink, "center"); note(c, "命中", cx - 30, cy + 12, 60, P.sub, "center", 10);
    text(c, `读 ${compact(x.cache_tokens)} · 基 ${compact(x.cache_basis)}`, 10, h - 20, w - 20, F.mono(9), P.faint, "center");
  },
  medium(c, w, h, { d, status }) {
    const { p, x } = this.setup(d), cy = h / 2 + 2, X = 140; ring(c, 68, cy, 46, 8, (x.cache_rate || 0) / 100, P.sage); text(c, pct(x.cache_rate, 0), 28, cy - 15, 80, F.num(26), P.ink, "center"); note(c, "缓存命中", 28, cy + 12, 80, P.sub, "center", 10);
    title(c, "缓存分拣", X, 12, 90, 15); note(c, `${PERIOD[p.period]} · ${sourceLabel(d, p.source)}`, X, 32, 160, P.sub, "left", 10.5); liveDot(c, w - 16, 20, status);
    this.rows(c, x, X, 56, w - X - 16, 31);
  },
  large(c, w, h, { d, status }) {
    const { p, x } = this.setup(d), X = 18, IW = w - 36;
    title(c, "缓存健康", X, 14, 120, 18); note(c, `${PERIOD[p.period]} · ${sourceLabel(d, p.source)}`, w - X - 160, 19, 140, P.sub, "right", 11); liveDot(c, w - X - 4, 25, status);
    ring(c, X + 54, 108, 50, 9, (x.cache_rate || 0) / 100, P.sage); text(c, pct(x.cache_rate), X + 8, 92, 92, F.num(24), P.ink, "center"); note(c, "缓存命中", X + 14, 120, 80, P.sub, "center", 10);
    this.rows(c, x, X + 132, 58, IW - 132, 34, 13);
    const h7 = vals(d.history_7d, "cache_rate"), lo = Math.max(0, Math.floor(Math.min(...h7) / 5) * 5 - 5), hi = Math.min(100, Math.ceil(Math.max(...h7) / 5) * 5 + 5);
    note(c, "近七日命中率", X, 180, 100, P.sub, "left", 10); ruled(c, X, 196, IW, 60, 20);
    [lo, hi].forEach((g, i) => text(c, `${g}%`, w - X - 40, i ? 194 : 250, 40, F.mono(8), P.faint, "right"));
    const pts = penLine(c, h7.map(v => v - lo), X + 6, 202, IW - 52, 50, P.sage, 1.6, hi - lo); pts.forEach((q, i) => dot(c, q[0], q[1], i === pts.length - 1 ? 3.4 : 1.8, P.sage));
    weekdays(d.history_7d).forEach((l, i) => note(c, l, pts[i][0] - 10, 258, 20, i === 6 ? P.sage : P.faint, "center", 9.5));
    const pr = x.prompt_tokens || 0, cr = x.cache_tokens || 0, tot = Math.max(1, pr + cr);
    note(c, "Prompt 与缓存读取 · 缓存不计入主 Token", X, 284, IW, P.sub, "left", 10);
    hatchRect(c, X, 304, IW * pr / tot - 2, 8, .8); rr(c, X + IW * pr / tot, 304, IW * cr / tot, 8, 2, P.sage);
    text(c, `Prompt ${compact(pr)}`, X, h - 24, 140, F.mono(9.5), P.sub); text(c, `缓存读取 ${compact(cr)}`, w - X - 160, h - 24, 160, F.mono(9.5), P.sage, "right");
  },
};

/* ============================== 7 · PULSE ============================== */
const Pulse = {
  setup(d) { const p = parseParam({ period: "today", source: "all" }); return { p, x: periodData(d, p.period, p.source) }; },
  ecg(c, x, y, w, h) { const k = [[0, .6], [.4, .6], [.45, .6], [.48, .25], [.52, 1], [.56, 0], [.6, .8], [.63, .6], [1, .6]]; stroke(c, k.map(([a, b]) => [x + a * w, y + b * h]), P.indigo, 1.5); dot(c, x + .56 * w, y, 2.4, P.indigo); },
  secsBig(c, v, x, y, w, size, color) { const s = secs(v), n = s.slice(0, -1), nw = big(c, n, x, y, w - size * .4, size, color); text(c, "s", x + nw + 1, y + size * .42, size * .6, F.it(size * .55), color); },
  small(c, w, h, { d, status }) {
    const { p, x } = this.setup(d); hdrSmall(c, w, `响应 · ${PERIOD[p.period]}`, status);
    this.secsBig(c, x.avg_latency, 13, 28, w - 26, 36, P.ink); note(c, "平均响应耗时", 14, 72, w - 28, P.sub, "left", 10.5);
    this.ecg(c, 14, 94, w - 28, 26); text(c, `${num(x.requests)} 次请求`, 14, h - 20, w - 28, F.mono(9), P.faint);
  },
  medium(c, w, h, { d, status }) {
    const { p, x } = this.setup(d), X = 18; title(c, "响应脉搏", X, 13, 100, 15); liveDot(c, w - 16, 20, status);
    lab(c, "平均耗时", X, 44, 80); this.secsBig(c, x.avg_latency, X - 1, 55, 100, 26, P.indigo);
    lab(c, "请求", X, 94, 80); text(c, `${num(x.requests)} 次`, X, 106, 90, F.num(13), P.ink);
    const lat = vals(d.history_7d, "avg_latency"), req = vals(d.history_7d, "requests"), CX = 130, CW = w - CX - 16;
    const r = weekBars(c, req, CX, 44, CW, 74, { noToday: true, labels: weekdays(d.history_7d), hatchA: .55, gap: 8, hi: P.indigo });
    const pts = lat.map((v, i) => [CX + i * (r.bw + r.gap) + r.bw / 2, 30 + (1 - v / (Math.max(...lat, 1) * 1.1)) * 46]); stroke(c, pts, P.indigo, 1.6); dot(c, pts[6][0], pts[6][1], 3.4, P.indigo);
  },
  large(c, w, h, { d, status }) {
    const { p, x } = this.setup(d), X = 18, IW = w - 36, lat = vals(d.history_7d, "avg_latency"), req = vals(d.history_7d, "requests");
    title(c, "响应脉搏", X, 14, 120, 18); note(c, `${PERIOD[p.period]} · ${sourceLabel(d, p.source)}`, w - X - 160, 19, 140, P.sub, "right", 11); liveDot(c, w - X - 4, 25, status);
    lab(c, "平均响应耗时", X, 54, 120); this.secsBig(c, x.avg_latency, X - 1, 66, 170, 44, P.indigo); this.ecg(c, w - X - 128, 80, 128, 34);
    const sample = lat.filter(v => v > 0); strip(c, X, 128, IW, [["真实请求", `${num(x.requests)} 次`], ["七日样本均值", secs(sample.reduce((a, b) => a + b, 0) / Math.max(1, sample.length))], ["较七日", signed(lat.length && sample.length ? (lat[6] - sample.reduce((a, b) => a + b, 0) / sample.length) / (sample.reduce((a, b) => a + b, 0) / sample.length) * 100 : 0)]], 16);
    note(c, "每日请求", X, 182, 100, P.sub, "left", 10); weekBars(c, req, X, 198, IW, 46, { noToday: true, hatchA: .7, gap: 12 });
    note(c, "每日平均耗时", X, 254, 100, P.sub, "left", 10); ruled(c, X, 266, IW, 48, 16);
    const pts = penLine(c, lat, X + 10, 272, IW - 20, 40, P.indigo, 1.6, Math.max(...lat, 1) * 1.1); pts.forEach((q, i) => dot(c, q[0], q[1], i === 6 ? 3.4 : 1.8, P.indigo));
    weekdays(d.history_7d).forEach((l, i) => note(c, l, pts[i][0] - 10, 314, 20, i === 6 ? P.indigo : P.faint, "center", 9.5));
    note(c, "仅计入正数 use_time 样本 · 不展示 P95/P99", X, h - 20, IW, P.faint, "left", 9);
  },
};

/* ============================== IO ============================== */
async function loadPayload() {
  const fm = FileManager.local(), path = fm.joinPath(fm.documentsDirectory(), CACHE_FILE);
  try {
    if (!API_URL || !API_KEY) throw new Error("未配置 API：请先运行 SetupTokenTrackerV5");
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
  for (const name of ["token-tracker-v5-settings.json", "token-tracker-v4-settings.json", "token-tracker-v3-settings.json", "token-tracker-v2-settings.json"]) {
    const p = fm.joinPath(fm.documentsDirectory(), name); if (!fm.fileExists(p)) continue;
    try { const v = JSON.parse(fm.readString(p)); if (/^https?:\/\//.test(v?.apiUrl || "") && v?.apiKey) return v; } catch (_) { }
  }
  return { apiUrl: "", apiKey: "" };
}
function nextRefresh() { const step = REFRESH_MINUTES * 60000; return new Date(Math.ceil((Date.now() + 1000) / step) * step); }
function familiesIn(d) {
  const out = new Set(); const add = list => (list || []).forEach(m => out.add(familyOf(m)));
  for (const k of ["today", "7d", "month"]) add(d.top_models?.[k]); for (const s of Object.values(d.source_top_models || {})) for (const k of ["today", "7d", "month"]) add(s?.[k]);
  return [...out];
}

/* ============================== entry (last: the views above are const) ============================== */
let widget;
try {
  if (!["small", "medium", "large"].includes(FAMILY)) throw new Error(`Unsupported widget family: ${FAMILY}`);
  const result = await loadPayload(), d = result.data || {}, status = statusOf(result);
  await loadIcons(familiesIn(d));
  const views = { overview: Overview, ranking: Ranking, focus: Focus, rhythm: Rhythm, activity: Activity, cache: Cache, pulse: Pulse };
  widget = Number(d.summary?.all_time_total || 0) > 0
    ? frame(FAMILY, (c, w, h) => views[WIDGET][FAMILY](c, w, h, { d, status }))
    : frame(FAMILY, (c, w, h) => stateCard(c, w, h, status.kind === "error" ? "error" : "empty", status.kind === "error" ? "连接失败" : "还没有用量", status.kind === "error" ? "没有可用缓存，稍后自动重试" : "收到第一条日志后，纸鹤开始记账"));
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
