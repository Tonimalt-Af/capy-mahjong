import { chromium } from 'playwright';
import { capyA, capyB, capyC } from './mascots.mjs';
const out = process.argv[2] || '/workspace/capy-mahjong/previews/mascot-proposals.png';
const svg = (inner, w) => `<svg viewBox="-6 18 112 104" width="${w}" height="${w * 104 / 112}">${inner}</svg>`;
const props = [['A · Onsen zen', 'Assis de face, tête « brique », yeux mi-clos', capyA], ['B · Profil', 'Silhouette iconique de profil, museau plat', capyB], ['C · Mochi', 'Chibi tout en tête, yeux brillants, yuzu dans les pattes', capyC]];
const tile = (inner) => `<div class="tile"><svg viewBox="-4 14 108 108" width="40" height="40">${inner}</svg></div>`;
const html = `<html><head><style>body{margin:0;background:#E9F3EC;font-family:system-ui;color:#3b2416}
.wrap{display:flex;gap:24px;padding:24px}.col{background:#fff8ec;border-radius:28px;padding:16px;width:540px;text-align:center}
h2{margin:6px 0 0;font-size:28px}p{margin:4px 0 8px;font-size:17px;opacity:.8}.small{display:flex;gap:18px;justify-content:center;align-items:end;margin-top:6px}
.tile{width:48px;height:62px;background:#FFFDF6;border-radius:8px;box-shadow:0 4px 0 #d9b98c,0 0 0 1px #e8d3b0;display:grid;place-items:center}
.lbl{font-size:13px;opacity:.7}.dark{background:#2c3a4f;padding:6px;border-radius:10px}</style></head><body><div class="wrap">
${props.map(([n, d, f]) => `<div class="col"><h2>${n}</h2><p>${d}</p>${svg(f(true), 512)}
<div class="small"><div>${tile(f(true))}<div class="lbl">tuile 48px</div></div><div>${tile(f(false))}<div class="lbl">sans yuzu</div></div>
<div><div class="dark">${svg(f(true), 48)}</div><div class="lbl">48px fond sombre</div></div><div>${svg(f(true), 96)}<div class="lbl">96px</div></div></div></div>`).join('')}
</div></body></html>`;
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const pg = await b.newPage({ viewport: { width: 1700, height: 760 }, deviceScaleFactor: 1 });
await pg.setContent(html); await pg.waitForTimeout(200);
await pg.screenshot({ path: out, fullPage: true }); await b.close(); console.log(out);
