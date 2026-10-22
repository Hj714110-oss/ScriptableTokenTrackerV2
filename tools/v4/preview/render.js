// node tools/v4/preview/render.js  -> tools/v4/preview/out/<widget>-<family>-<theme>.png   (renders the real built scripts on fictional data)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../../..'), OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const W = [['TokenOverviewV4', ''], ['ModelRankingV4', '7d,all'], ['ModelFocusV4', '1,today,all'], ['UsageRhythmV4', ''], ['ActivityCacheV4', ''], ['CacheHealthV4', 'today,all'], ['ResponsePulseV4', 'today,all']];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', e => console.log('PAGEERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  const font = f => `@font-face{font-family:"JetBrains Mono";src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format("woff2");font-weight:100 900}`;
  const jb = require.resolve('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2');
  await p.setContent(`<html><head><style>${font(jb)}</style></head><body></body></html>`);
  await p.addScriptTag({ path: path.join(__dirname, 'shim.js') });
  await p.evaluate(d => { window.__DEMO = d; }, JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/v4/demo_payload.json'), 'utf8')));
  await p.evaluate(async () => { for (const f of ['400 30px Inter', '500 30px Inter', '600 30px Inter', '700 30px Inter', '700 30px "Inter Display"', '600 30px "Inter Display"', '500 30px "JetBrains Mono"', '500 30px "Noto Sans CJK SC"', '600 30px "Noto Sans CJK SC"']) await document.fonts.load(f); });
  const only = process.argv[2];
  for (const [name, param] of W) { if (only && !name.includes(only)) continue; const code = fs.readFileSync(path.join(ROOT, 'scriptable', name + '.js'), 'utf8');
    for (const fam of ['small', 'medium', 'large']) for (const dark of [false, true]) {
      const url = await p.evaluate(([c, f, pr, dk]) => window.renderWidget(c, f, pr, dk), [code, fam, param, dark]);
      fs.writeFileSync(path.join(OUT, `${name}-${fam}-${dark ? 'dark' : 'light'}.png`), Buffer.from(url.split(',')[1], 'base64')); } console.log('rendered', name); }
  await b.close();
})();
