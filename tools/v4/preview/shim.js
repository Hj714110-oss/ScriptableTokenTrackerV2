/* Minimal Scriptable runtime for previews: enough of DrawContext / ListWidget / Font / Color to render the real V4 scripts in Chromium.
   Font substitutions: SF Pro → Inter, SF Pro Rounded → Inter Display, SF Mono → JetBrains Mono, PingFang SC → Noto Sans CJK SC. */
const SCALE = 3;
class Color { constructor(hex, a = 1) { hex = String(hex).replace("#", ""); if (hex.length === 3) hex = hex.split("").map(x => x + x).join(""); this.hex = hex; this.alpha = a; const n = parseInt(hex.slice(0, 6), 16); this.css = `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; } static dynamic(l, d) { return window.__DARK ? d : l; } }
const W8 = { regular: 400, medium: 500, semibold: 600, bold: 700, heavy: 800 };
class Font { constructor(name, size) { this.size = size; this.css = `400 ${size * SCALE}px ${/Menlo|Mono/i.test(name) ? '"JetBrains Mono"' : '"Inter", "Noto Sans CJK SC"'}`; } }
for (const [k, w] of Object.entries(W8)) {
  const cap = k[0].toUpperCase() + k.slice(1);
  Font[`${k}SystemFont`] = s => Object.assign(new Font("SF", s), { css: `${w} ${s * SCALE}px "Inter", "Noto Sans CJK SC"` });
  Font[`${k}RoundedSystemFont`] = s => Object.assign(new Font("SF", s), { css: `${w} ${s * SCALE}px "Inter Display", "Inter", "Noto Sans CJK SC"` });
  Font[`${k}MonospacedSystemFont`] = s => Object.assign(new Font("Mono", s), { css: `${Math.min(w, 600)} ${s * SCALE}px "JetBrains Mono", "Noto Sans CJK SC"` });
}
Font.systemFont = s => Font.regularSystemFont(s); Font.boldSystemFont = s => Font.boldSystemFont ? Object.assign(new Font("SF", s), { css: `700 ${s * SCALE}px "Inter"` }) : null;
class Size { constructor(w, h) { this.width = w; this.height = h; } }
class Point { constructor(x, y) { this.x = x; this.y = y; } }
class Rect { constructor(x, y, w, h) { this.x = x; this.y = y; this.width = w; this.height = h; } }
class Path { constructor() { this.ops = []; } move(p) { this.ops.push(g => g.moveTo(p.x * SCALE, p.y * SCALE)); } addLine(p) { this.ops.push(g => g.lineTo(p.x * SCALE, p.y * SCALE)); }
  addCurve(p, c1, c2) { this.ops.push(g => g.bezierCurveTo(c1.x * SCALE, c1.y * SCALE, c2.x * SCALE, c2.y * SCALE, p.x * SCALE, p.y * SCALE)); }
  addQuadCurve(p, c) { this.ops.push(g => g.quadraticCurveTo(c.x * SCALE, c.y * SCALE, p.x * SCALE, p.y * SCALE)); }
  addRect(r) { this.ops.push(g => g.rect(r.x * SCALE, r.y * SCALE, r.width * SCALE, r.height * SCALE)); }
  addRoundedRect(r, cw) { this.ops.push(g => g.roundRect(r.x * SCALE, r.y * SCALE, r.width * SCALE, r.height * SCALE, cw * SCALE)); }
  addEllipse(r) { this.ops.push(g => g.ellipse((r.x + r.width / 2) * SCALE, (r.y + r.height / 2) * SCALE, r.width / 2 * SCALE, r.height / 2 * SCALE, 0, 0, 7)); }
  closeSubpath() { this.ops.push(g => g.closePath()); } }
class DrawContext {
  constructor() { this.cv = document.createElement("canvas"); this.g = this.cv.getContext("2d"); this.align = "left"; this.fc = "#000"; this.sc = "#000"; this.lw = 1; this.font = new Font("SF", 12); this.tc = "#000"; this.paths = []; }
  set size(s) { this._size = s; this.cv.width = Math.round(s.width * SCALE); this.cv.height = Math.round(s.height * SCALE); } get size() { return this._size; }
  setFillColor(c) { this.fc = c.css; } setStrokeColor(c) { this.sc = c.css; } setLineWidth(w) { this.lw = w; } setFont(f) { this.font = f; } setTextColor(c) { this.tc = c.css; }
  setTextAlignedLeft() { this.align = "left"; } setTextAlignedCenter() { this.align = "center"; } setTextAlignedRight() { this.align = "right"; }
  fillRect(r) { this.g.fillStyle = this.fc; this.g.fillRect(r.x * SCALE, r.y * SCALE, r.width * SCALE, r.height * SCALE); }
  fillEllipse(r) { this.g.fillStyle = this.fc; this.g.beginPath(); this.g.ellipse((r.x + r.width / 2) * SCALE, (r.y + r.height / 2) * SCALE, Math.abs(r.width / 2 * SCALE), Math.abs(r.height / 2 * SCALE), 0, 0, 7); this.g.fill(); }
  strokeEllipse(r) { this.g.strokeStyle = this.sc; this.g.lineWidth = this.lw * SCALE; this.g.beginPath(); this.g.ellipse((r.x + r.width / 2) * SCALE, (r.y + r.height / 2) * SCALE, r.width / 2 * SCALE, r.height / 2 * SCALE, 0, 0, 7); this.g.stroke(); }
  strokeRect(r) { this.g.strokeStyle = this.sc; this.g.lineWidth = this.lw * SCALE; this.g.strokeRect(r.x * SCALE, r.y * SCALE, r.width * SCALE, r.height * SCALE); }
  addPath(p) { this.path = p; } fillPath() { this.g.beginPath(); this.path.ops.forEach(o => o(this.g)); this.g.fillStyle = this.fc; this.g.fill(); }
  strokePath() { this.g.beginPath(); this.path.ops.forEach(o => o(this.g)); this.g.strokeStyle = this.sc; this.g.lineWidth = this.lw * SCALE; this.g.lineJoin = "round"; this.g.stroke(); }
  drawTextInRect(s, r) { const g = this.g; g.save(); g.beginPath(); g.rect(r.x * SCALE, r.y * SCALE, r.width * SCALE, r.height * SCALE); g.clip(); g.font = this.font.css; g.fillStyle = this.tc; g.textBaseline = "top"; g.textAlign = this.align;
    const x = this.align === "center" ? (r.x + r.width / 2) : this.align === "right" ? r.x + r.width : r.x; g.fillText(s, x * SCALE, r.y * SCALE + this.font.size * SCALE * .12); g.restore(); }
  drawText(s, p) { this.drawTextInRect(s, new Rect(p.x, p.y, 1000, 1000)); }
  drawImageInRect(img, r) { this.g.drawImage(img.cv, r.x * SCALE, r.y * SCALE, r.width * SCALE, r.height * SCALE); }
  getImage() { return { cv: this.cv, size: this._size }; }
}
class ListWidget { setPadding() { } addSpacer() { } addText() { return {}; } addStack() { return new ListWidget(); } async presentSmall() { } async presentMedium() { } async presentLarge() { } }
const Device = { isUsingDarkAppearance: () => window.__DARK, screenSize: () => ({ width: 393, height: 852 }) };
const FileManager = { local: () => ({ documentsDirectory: () => "/docs", joinPath: (a, b) => `${a}/${b}`, fileExists: p => p.endsWith("token-tracker-v4-settings.json"),
  readString: p => JSON.stringify({ apiUrl: "https://example.com/token-tracker/v3", apiKey: "demo-preview" }), writeString() { } }) };
class Request { constructor(u) { this.url = u; } async loadJSON() { return JSON.parse(JSON.stringify(window.__DEMO)); } }
window.renderWidget = async (code, family, param, dark) => {
  window.__DARK = dark; let out = null;
  const config = { widgetFamily: family, runsInWidget: true }, args = { widgetParameter: param || null, queryParameters: {} }, Script = { setWidget: w => out = w, name: () => "TokenTrackerV4", complete() { } };
  const AF = Object.getPrototypeOf(async function () { }).constructor;
  await new AF("config", "args", "Script", "Color", "Font", "Size", "Point", "Rect", "Path", "DrawContext", "ListWidget", "Device", "FileManager", "Request", code)(config, args, Script, Color, Font, Size, Point, Rect, Path, DrawContext, ListWidget, Device, FileManager, Request);
  return out.backgroundImage.cv.toDataURL("image/png");
};
