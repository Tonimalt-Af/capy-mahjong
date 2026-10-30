// Offline audio renderer: drives the game's Sound class on an OfflineAudioContext (headless Chrome),
// writes WAV files and prints peak / RMS / clipping. Needs the dev server on 5173.
// usage: node scripts/audio/render.mjs <module path> <out prefix> [world] [musicVol] [sfxVol] [bg]
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const [mod = '/src/audio.ts', prefix = '/tmp/after', world = '0', mv = '', sv = '', only = ''] = process.argv.slice(2);
// only=bg mutes the pitched instruments (EP, bass, mallet, kick body) to expose any background/noise layer
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const pg = await b.newPage(); pg.on('pageerror', (e) => console.error('pageerror', e.message));
await pg.goto('http://localhost:5173/art.html'); await pg.waitForTimeout(400);
const SFX = [['select', 0.2], ['match', 0.6, 0], ['select', 1.2], ['match', 1.5, 1], ['match', 2.2, 2], ['match', 2.6, 3], ['hint', 3.4], ['shuffle', 4.2], ['invalid', 5.2], ['click', 5.8], ['buy', 6.4], ['unlock', 7.2], ['legend', 8.2], ['star', 9.4, 0], ['star', 9.8, 1], ['star', 10.2, 2], ['win', 10.8], ['lose', 12.5],
  ...[0, 1, 2, 3, 4, 5, 6].map((c, i) => ['match', 14 + i * 0.14, c]), ['star', 15.2, 0], ['star', 15.3, 1], ['star', 15.4, 2], ['win', 15.4]];
async function render(kind, secs) {
  return pg.evaluate(async ({ mod, kind, secs, world, SFX, mv, sv, only }) => {
    const M = await import(mod); const SR = 44100; const off = new OfflineAudioContext(2, SR * secs, SR); let T = 0;
    Object.defineProperty(off, 'currentTime', { get: () => T, configurable: true }); off.resume = () => Promise.resolve(); off.suspend = () => Promise.resolve();
    window.AudioContext = function () { return off; };
    const s = new M.Sound(); if (only === 'bg') for (const k of ['ep', 'bass', 'mallet', 'kick']) s[k] = () => {}; if (mv !== '' && 'musicVol' in s) s.musicVol = +mv; if (sv !== '' && 'sfxVol' in s) s.sfxVol = +sv; s.ensure();
    if (mv !== '' && s.setVolumes) s.setVolumes(+mv, +sv);
    if (kind !== 'sfx') { s.music(+world); clearInterval(s.timer); for (T = 0; T < secs; T += 0.1) s.schedule(); }
    if (kind !== 'music') for (const [n, t, c] of SFX) { T = kind === 'mix' ? t + 3 : t; if (T < secs) s.play(n, c ?? 0); }
    s.stopMusic?.(); clearInterval(s.timer);
    const buf = await off.startRendering(); const L = buf.getChannelData(0), R = buf.getChannelData(1);
    let peak = 0, sum = 0, clip = 0, maxWin = 0; const win = SR * 0.4; let ws = 0;
    for (let i = 0; i < L.length; i++) { const a = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (a > peak) peak = a; if (a >= 1) clip++; const e = (L[i] * L[i] + R[i] * R[i]) / 2; sum += e; ws += e; if (i >= win) { const o = (L[i - win] ** 2 + R[i - win] ** 2) / 2; ws -= o; } if (i >= win && ws / win > maxWin) maxWin = ws / win; }
    const db = (x) => +(20 * Math.log10(x)).toFixed(1);
    // 16-bit WAV (hard-clipped like a real DAC would)
    const n = L.length, ab = new ArrayBuffer(44 + n * 4), v = new DataView(ab); const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, SR, true); v.setUint32(28, SR * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 4, true);
    for (let i = 0; i < n; i++) { v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
    let bin = ''; const u8 = new Uint8Array(ab); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
    return { stats: { peakDb: db(peak), rmsDb: db(Math.sqrt(sum / n)), loudest400msRmsDb: db(Math.sqrt(maxWin)), clippedSamples: clip }, wav: btoa(bin) };
  }, { mod, kind, secs, world: +world, SFX, mv, sv, only });
}
const out = {};
for (const [kind, secs] of [['music', 30], ['sfx', 17], ['mix', 20]]) {
  const r = await render(kind, secs); writeFileSync(`${prefix}-${kind}.wav`, Buffer.from(r.wav, 'base64')); out[kind] = r.stats;
}
console.log(JSON.stringify(out)); await b.close();
