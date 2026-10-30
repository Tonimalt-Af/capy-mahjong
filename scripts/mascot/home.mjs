import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const pg = await b.newPage({ viewport: { width: 844, height: 390 } });
await pg.goto('http://localhost:5173/'); await pg.waitForTimeout(1200); await pg.screenshot({ path: '/tmp/home1.png' });
await pg.setViewportSize({ width: 390, height: 844 }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/rot1.png' });
await pg.goto('http://localhost:5173/art.html'); await pg.waitForTimeout(900);
await pg.evaluate(async () => { const t = await import('/src/tiles.ts'); document.body.innerHTML = '<div style="display:flex;gap:10px;background:#E9F3EC">' + ['chat','ours','capydindon'].map(a=>`<div style="width:260px">${t.capySvg(a)}</div>`).join('') + '</div>'; });
await pg.setViewportSize({ width: 820, height: 330 }); await pg.waitForTimeout(200); await pg.screenshot({ path: '/tmp/friends1.png' });
await b.close();
