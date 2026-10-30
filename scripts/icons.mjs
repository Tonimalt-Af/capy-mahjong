// Renders app icons, favicon and social share image from the game's own SVG art.
import { chromium } from 'playwright';
import { createServer } from 'vite';
const server = await createServer({ server: { port: 5199 }, logLevel: 'silent' }); await server.listen();
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const pg = await b.newPage();
await pg.goto('http://localhost:5199/art.html'); await pg.evaluate(() => document.fonts.ready);
const mod = 'http://localhost:5199/src/tiles.ts';
async function render(out, w, h, html) {
  await pg.setViewportSize({ width: w, height: h });
  await pg.evaluate(async ([html, mod]) => { const t = await import(mod); document.body.innerHTML = html.replace(/CAPY\(([a-z]+)\)/g, (_, a) => t.capySvg(a)); document.body.style.margin = '0'; }, [html, mod]);
  await pg.waitForTimeout(150); await pg.screenshot({ path: out, omitBackground: true });
}
const icon = (s, pad) => `<div style="width:${s}px;height:${s}px;background:linear-gradient(160deg,#7FD3C8,#2FA4A9);border-radius:${pad ? 0 : s * 0.22}px;display:grid;place-items:center"><div style="width:${s * (pad ? 0.58 : 0.7)}px">CAPY(agrume)</div></div>`;
await render('public/icons/icon-192.png', 192, 192, icon(192));
await render('public/icons/icon-512.png', 512, 512, icon(512));
await render('public/icons/maskable-512.png', 512, 512, icon(512, true));
await render('public/icons/apple-touch-icon.png', 180, 180, icon(180, true));
await render('public/icons/favicon-48.png', 48, 48, icon(48));
await render('public/og-image.png', 1200, 630, `<div style="width:1200px;height:630px;background:linear-gradient(180deg,#D7F1E8,#7FC8B4);display:flex;align-items:center;gap:40px;padding:60px;box-sizing:border-box;font-family:Fredoka">
 <div style="flex:1"><div style="font-weight:700;font-size:64px;color:#FFD27A;-webkit-text-stroke:12px #3B2416;paint-order:stroke fill">Mahjong</div><div style="font-weight:700;font-size:120px;line-height:1;color:#fff;-webkit-text-stroke:14px #3B2416;paint-order:stroke fill">Capybaras</div><div style="font-size:32px;color:#3B2416;margin-top:24px">Le mahjong solitaire le plus doux du web</div></div>
 <div style="width:380px">CAPY(serviette)</div></div>`);
await b.close(); await server.close(); console.log('icons ok');
