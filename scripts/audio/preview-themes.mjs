// Render original theme previews with the game's Sound engine on an OfflineAudioContext.
// Needs the dev server: npm run dev  (http://localhost:5173)
//   node scripts/audio/preview-themes.mjs [out dir]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const outDir = process.argv[2] ?? '/tmp/capy-themes';
mkdirSync(outDir, { recursive: true });
const THEMES = ['riviere', 'onsen', 'foret', 'montagne', 'temple', 'brume'];
const THEME_SECS = 24;
const DEMO_SECS = 28;

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('pageerror', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('console', m.text()); });
await page.goto('http://localhost:5173/art.html');
await page.waitForTimeout(300);

async function render(job) {
  return page.evaluate(async (job) => {
    const M = await import('/src/audio.ts');
    const SR = 44100;
    const frames = Math.floor(SR * job.secs);
    const off = new OfflineAudioContext(2, frames, SR);
    let T = 0;
    Object.defineProperty(off, 'currentTime', { get: () => T, configurable: true });
    off.resume = () => Promise.resolve();
    off.suspend = () => Promise.resolve();
    const Real = window.AudioContext;
    window.AudioContext = function AudioContext() { return off; };
    try {
      const s = new M.Sound();
      s.manual = true;
      s.musicOn = true;
      await s.preload();
      s.ensure();
      s.setVolumes(0.45, 0.6);
      await s.playTheme(job.theme);
      const marks = [...(job.marks ?? [])];
      for (T = 0; T <= job.secs; T += 0.04) {
        while (marks.length && T >= marks[0].at) await s.playTheme(marks.shift().theme);
        s.pump();
      }
      if (job.sfx) for (const [n, t] of job.sfx) { T = t; s.play(n, 2); }
    } finally {
      delete off.currentTime;
      window.AudioContext = Real;
    }
    const buf = await off.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    let peak = 0, sum = 0, clip = 0, maxStep = 0;
    const hop = Math.floor(SR * 0.5);
    const windows = [];
    for (let i = 0; i < L.length; i++) {
      const a = Math.max(Math.abs(L[i]), Math.abs(R[i]));
      if (a > peak) peak = a;
      if (a >= 0.999) clip++;
      const e = (L[i] * L[i] + R[i] * R[i]) / 2;
      sum += e;
      if (i > 0) maxStep = Math.max(maxStep, Math.abs(L[i] - L[i - 1]), Math.abs(R[i] - R[i - 1]));
      if (i % hop === hop - 1) {
        let w = 0; for (let k = i - hop + 1; k <= i; k++) w += (L[k] * L[k] + R[k] * R[k]) / 2;
        windows.push(+(10 * Math.log10(w / hop + 1e-12)).toFixed(1));
      }
    }
    const db = (x) => +(20 * Math.log10(Math.max(x, 1e-9))).toFixed(1);
    const n = L.length;
    const ab = new ArrayBuffer(44 + n * 4), v = new DataView(ab);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
    v.setUint32(24, SR, true); v.setUint32(28, SR * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, n * 4, true);
    for (let i = 0; i < n; i++) {
      v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true);
      v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true);
    }
    let bin = ''; const u8 = new Uint8Array(ab);
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
    return {
      stats: { peakDb: db(peak), rmsDb: db(Math.sqrt(sum / n)), clipped: clip, maxStep: +maxStep.toFixed(4), windows },
      wav: btoa(bin),
    };
  }, job);
}

function mp3(wavPath, mp3Path, secs) {
  const fade = Math.max(0, secs - 0.6);
  const r = spawnSync('ffmpeg', ['-y', '-i', wavPath, '-af', `afade=t=out:st=${fade}:d=0.45`, '-codec:a', 'libmp3lame', '-qscale:a', '5', mp3Path], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr.slice(-500));
  return statSync(mp3Path).size;
}

const report = {};
for (const theme of THEMES) {
  process.stdout.write(`render ${theme}...\n`);
  const r = await render({ theme, secs: THEME_SECS });
  const wav = `${outDir}/${theme}.wav`;
  writeFileSync(wav, Buffer.from(r.wav, 'base64'));
  const bytes = mp3(wav, `${outDir}/${theme}.mp3`, THEME_SECS);
  report[theme] = { ...r.stats, mp3Bytes: bytes };
  console.log(theme, JSON.stringify({ peakDb: r.stats.peakDb, rmsDb: r.stats.rmsDb, clipped: r.stats.clipped, maxStep: r.stats.maxStep, mp3Bytes: bytes }));
}

process.stdout.write('render transition...\n');
const demo = await render({
  theme: 'riviere', secs: DEMO_SECS,
  marks: [{ at: 8, theme: 'onsen' }, { at: 18, theme: 'foret' }],
});
writeFileSync(`${outDir}/transition-riviere-onsen-foret.wav`, Buffer.from(demo.wav, 'base64'));
const demoBytes = mp3(`${outDir}/transition-riviere-onsen-foret.wav`, `${outDir}/transition-riviere-onsen-foret.mp3`, DEMO_SECS);
report.transition = { ...demo.stats, mp3Bytes: demoBytes };
console.log('transition', JSON.stringify({ peakDb: demo.stats.peakDb, rmsDb: demo.stats.rmsDb, clipped: demo.stats.clipped, windows: demo.stats.windows }));

const mix = await render({ theme: 'riviere', secs: 8, sfx: [['fuse', 3], ['match', 4.2], ['fuse', 5], ['win', 6.2]] });
report.mix = { peakDb: mix.stats.peakDb, rmsDb: mix.stats.rmsDb, clipped: mix.stats.clipped, windows: mix.stats.windows };
console.log('mix', JSON.stringify(report.mix));
writeFileSync(`${outDir}/stats.json`, JSON.stringify(report, null, 2));
await browser.close();
