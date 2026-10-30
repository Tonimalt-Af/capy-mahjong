// Renders the PWA manifest screenshots (wide, 1280x720 WebP) from the real game. Needs the dev server on 5173.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const save = { stars: { 0: 3, 1: 3, 2: 2, 3: 3, 4: 3, 5: 3, 6: 3, 7: 2, 8: 3, 9: 1 }, best: {}, carrots: 85, settings: { sfx: false, music: true }, seenHowTo: true, seenUndo: true };
const shots = [['home', '/'], ['jeu-riviere', '/?level=3'], ['jeu-onsen', '/?level=8'], ['carte', '/#map']];
for (const [name, url] of shots) {
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.addInitScript((s) => { if (!sessionStorage.k) { localStorage.setItem('capy-mahjong-v1', JSON.stringify(s)); sessionStorage.k = 1; } }, save);
  await p.goto('http://localhost:5173' + url.replace('#map', '')); await p.waitForTimeout(900);
  if (url === '/#map') { await p.click('#h-levels'); await p.waitForTimeout(700); }
  if (name === 'jeu-onsen') { await p.evaluate(() => window.__game.playPairs(6)); await p.waitForTimeout(900); }
  const png = `/tmp/ss-${name}.png`; await p.screenshot({ path: png });
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', png, '-c:v', 'libwebp', '-quality', '82', `public/screenshots/${name}.webp`]);
  await p.close();
}
await b.close(); console.log('screenshots ok');
