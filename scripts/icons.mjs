// Renders app icons, favicon and social share image from the game's own SVG art.
import { chromium } from 'playwright';
import { createServer } from 'vite';
const server = await createServer({ server: { port: 5199 }, logLevel: 'silent' }); await server.listen();
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const pg = await b.newPage();
await pg.goto('http://localhost:5199/art.html'); await pg.evaluate(() => document.fonts.ready);
const mod = 'http://localhost:5199/src/tiles.ts';
async function render(out, w, h, html, type = 'png') {
  await pg.setViewportSize({ width: w, height: h });
  await pg.evaluate(async ([html, mod]) => {
    const t = await import(mod);
    // CAPY(acc) = full mascot A; HEAD(acc) = mascot A cropped on head + accessory (for small icons)
    document.body.innerHTML = html.replace(/CAPY\(([a-z]*)\)/g, (_, a) => t.capySvg(a)).replace(/FACE\(([a-z0-9-]*)\)/g, (_, id) => t.faceSvg(id, 100, 130).replace('<svg ', '<svg style="width:100%;height:auto;display:block" ')).replace(/HEAD\(([a-z]*)\)/g, (_, a) => t.capySvg(a).replace(/viewBox="[^"]+"/, 'viewBox="6 4 88 88" style="overflow:visible"'));
    document.body.style.margin = '0'; document.body.style.background = 'transparent';
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  }, [html, mod]);
  await pg.waitForTimeout(200); await pg.screenshot({ path: out, omitBackground: type === 'png', type, ...(type === 'jpeg' ? { quality: 88 } : {}) });
}
const bg = 'radial-gradient(circle at 50% 30%,#D9F4EC 0,#9EDCCB 55%,#3FAFAE 100%)';
const icon = (s, full) => `<div style="width:${s}px;height:${s}px;background:${bg};border-radius:${full ? 0 : s * 0.22}px;display:grid;place-items:center;overflow:hidden"><div style="width:${s * (full ? 0.74 : 0.86)}px;margin-top:${s * 0.04}px">HEAD(agrume)</div></div>`;
await render('public/icons/icon-192.png', 192, 192, icon(192));
await render('public/icons/icon-512.png', 512, 512, icon(512));
await render('public/icons/maskable-512.png', 512, 512, `<div style="width:512px;height:512px;background:${bg};display:grid;place-items:center"><div style="width:330px;margin-top:20px">HEAD(agrume)</div></div>`);
await render('public/icons/apple-touch-icon.png', 180, 180, icon(180, true));
await render('public/icons/favicon-48.png', 48, 48, `<div style="width:48px;height:48px;display:grid;place-items:center"><div style="width:48px">HEAD(agrume)</div></div>`);
await render('public/icons/favicon-32.png', 32, 32, `<div style="width:32px;height:32px;display:grid;place-items:center"><div style="width:32px">HEAD(agrume)</div></div>`);
// Social share image (1200x630, JPEG): AI onsen backdrop + big title + mascot A + a few floating tiles (no tagline)
await render('public/og-image.jpg', 1200, 630, `<div style="position:relative;width:1200px;height:630px;overflow:hidden;font-family:Fredoka,sans-serif;background:#CFEDE3">
 <img src="/home-bg.webp" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 70%">
 <div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 75% at 26% 50%,#EAF7F1e8 0%,#EAF7F1a8 55%,#EAF7F100 100%)"></div>
 <div style="position:absolute;left:600px;top:44px;width:96px;transform:rotate(12deg);border-radius:16.64px;box-shadow:0 9px 0 #E3C79A,0 15px 14px #0000002e;overflow:hidden">FACE(fraise-3)</div>
 <div style="position:absolute;left:1060px;top:36px;width:100px;transform:rotate(-9deg);border-radius:17.92px;box-shadow:0 10px 0 #E3C79A,0 16px 14px #0000002e;overflow:hidden">FACE(canard)</div>
 <div style="position:absolute;left:470px;top:462px;width:92px;transform:rotate(-14deg);border-radius:15.36px;box-shadow:0 9px 0 #E3C79A,0 15px 14px #0000002e;overflow:hidden">FACE(feuille-5)</div>
 <div style="position:absolute;left:60px;top:120px;width:720px">
  <div style="font-weight:700;font-size:96px;line-height:1;color:#FFD27A;-webkit-text-stroke:20px #3B2416;paint-order:stroke fill;text-shadow:0 9px 0 #3B2416">Mahjong</div>
  <div style="font-weight:700;font-size:164px;line-height:1.02;color:#fff;-webkit-text-stroke:22px #3B2416;paint-order:stroke fill;text-shadow:0 11px 0 #3B2416;transform:rotate(-2deg);transform-origin:left">Capybaras</div>
  <div style="display:inline-flex;align-items:center;gap:16px;margin-top:34px;font-size:44px;font-weight:700;color:#fff;background:#2FA4A9;border-radius:26px;padding:16px 46px 16px 38px;box-shadow:0 8px 0 #1F7C80"><svg viewBox="0 0 24 24" width="44" height="44"><path d="M8 5l11 7-11 7z" fill="#fff" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/></svg>Jouer</div>
 </div>
 <div style="position:absolute;right:34px;bottom:-14px;width:410px;filter:drop-shadow(0 10px 0 #0000001f)">CAPY(agrume)</div></div>`, 'jpeg');
await b.close(); await server.close(); console.log('icons ok');
