// All audio is synthesized at runtime with the Web Audio API: original, no samples, no third-party licences.
// SFX stay on their own bus. Music is six lo-fi themes (src/music), each loaded the first time it is needed.
// Two themes can overlap during an equal-power crossfade; a third request waits so nothing stacks louder than that.
// Sub-bass is filtered out: phone speakers cannot reproduce it and turn it into buzz.
import { THEME_IDS, chordAt, isThemeId, themeById, type ThemeId } from './music/catalog';
import type { Kit, Memory, ThemePlay } from './music/kit';
import { themeForWorld } from './music/select';
import { advance, audibleIds, gainsAt, idleMachine, nextBoundary, requestTheme, skipLate, type MusicMachine } from './music/transition';
import type { makeKit } from './music/voices';

export type Sfx = 'legend' | 'buy' | 'unlock' | 'select' | 'match' | 'fuse' | 'invalid' | 'shuffle' | 'hint' | 'win' | 'star' | 'click' | 'lose';
const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);
const rng = (seed: number) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hashId = (id: string) => { let h = 2166136261; for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619); return h >>> 0; };

/** Default volumes (0..1 sliders). Gains follow v^1.5 (perceptual) times a calibrated ceiling. */
const TRIM = 1.8;
export const DEFAULT_MUSIC = 0.45, DEFAULT_SFX = 0.6;
const MUSIC_MAX = 0.38, SFX_MAX = 0.52; // slider 100% = MAX; defaults land where the mix was tuned

const LOADERS: Record<ThemeId, () => Promise<{ play: ThemePlay }>> = {
  riviere: () => import('./music/themes/riviere'),
  onsen: () => import('./music/themes/onsen'),
  foret: () => import('./music/themes/foret'),
  montagne: () => import('./music/themes/montagne'),
  temple: () => import('./music/themes/temple'),
  brume: () => import('./music/themes/brume'),
};

interface Deck {
  id: ThemeId;
  gain: GainNode;
  wet: GainNode;
  delay: DelayNode;
  kit: Kit;
  anchor: number;
  next: number;
  step: number;
  rng: () => number;
  mem: Memory;
  alive: boolean;
  retireAt: number;
  /** Last time a preview ramp was written. Offline renders trace the fade instead of cancelling it. */
  traceT: number | null;
}

export interface MusicSnapshot {
  state: AudioContextState | 'none';
  theme: ThemeId | null;
  pending: ThemeId | null;
  out: ThemeId | null;
  phase: MusicMachine['phase'];
  on: boolean;
  audible: ThemeId[];
}

export class Sound {
  ctx: AudioContext | null = null;
  sfxOn = true; musicOn = true; musicVol = DEFAULT_MUSIC; sfxVol = DEFAULT_SFX;
  /** Offline renders step the clock themselves and call pump(). */
  manual = false;
  private mix!: GainNode; private sfxBus!: GainNode; private sfxVolG!: GainNode; private musicIn!: GainNode; private musicVolG!: GainNode; private musicMute!: GainNode;
  private noise!: AudioBuffer; // noise is only used by short SFX (select, buy, shuffle), never by the music
  private timer = 0;
  private r = rng(1);
  private desired: ThemeId = 'riviere';
  private machine: MusicMachine = idleMachine();
  private appliedRev = -1;
  private token = 0;
  private muteToken = 0;
  private plays = new Map<ThemeId, ThemePlay>();
  private voices: { makeKit: typeof makeKit } | null = null;
  private decks = new Map<ThemeId, Deck>();

  ensure() {
    // iOS: the context can be 'suspended' (no gesture yet / page hidden) or 'interrupted' (call, Siri, other app took audio):
    // every user gesture calls ensure(), which resumes it.
    if (this.ctx) { if (this.ctx.state !== 'running' && this.ctx.state !== 'closed' && !document.hidden) this.ctx.resume().catch(() => {}); return this.ctx; }
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    const ctx = (this.ctx = new C());
    // master: clean gain staging + a safety limiter that only touches rare peaks (no glue compressor: the Web Audio
    // compressor adds automatic make-up gain, which lifted the quiet tails and pumped the floor up)
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -6; lim.knee.value = 2; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.25;
    const trim = ctx.createGain(); trim.gain.value = TRIM;
    this.mix = ctx.createGain(); this.mix.connect(trim).connect(lim).connect(ctx.destination);
    document.addEventListener('visibilitychange', () => { if (document.hidden) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {}); });
    // iOS unlock: a silent one-sample buffer started inside the gesture fully opens the audio session
    try { const b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050); b.connect(ctx.destination); b.start(0); } catch { /* ignore */ }
    // SFX: soften transients (low-pass), user volume
    this.sfxVolG = ctx.createGain(); this.sfxVolG.connect(this.mix);
    const sLp = ctx.createBiquadFilter(); sLp.type = 'lowpass'; sLp.frequency.value = 6500; sLp.Q.value = 0.5; sLp.connect(this.sfxVolG);
    this.sfxBus = ctx.createGain(); this.sfxBus.connect(sLp);
    // music: per-theme decks sum here → 2x high-pass (no sub-bass) → warm low-pass → mute → user volume
    this.musicVolG = ctx.createGain(); this.musicVolG.connect(this.mix);
    this.musicMute = ctx.createGain(); this.musicMute.gain.value = this.musicOn ? 1 : 0; this.musicMute.connect(this.musicVolG);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000; lp.Q.value = 0.5; lp.connect(this.musicMute);
    const hp2 = ctx.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = 90; hp2.Q.value = 0.6; hp2.connect(lp);
    const hp1 = ctx.createBiquadFilter(); hp1.type = 'highpass'; hp1.frequency.value = 90; hp1.Q.value = 0.6; hp1.connect(hp2);
    this.musicIn = ctx.createGain(); this.musicIn.connect(hp1);
    const R = rng(7); const n = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, n, ctx.sampleRate); const d = this.noise.getChannelData(0); for (let i = 0; i < n; i++) d[i] = R() * 2 - 1;
    this.setVolumes(this.musicVol, this.sfxVol);
    return ctx;
  }
  setVolumes(music: number, sfx: number) {
    this.musicVol = music; this.sfxVol = sfx; if (!this.ctx) return; const t = this.ctx.currentTime;
    this.musicVolG.gain.setTargetAtTime(music ** 1.5 * MUSIC_MAX, t, 0.05); this.sfxVolG.gain.setTargetAtTime(sfx ** 1.5 * SFX_MAX, t, 0.02);
  }
  // ---------- primitives
  private env(g: GainNode, t: number, a: number, peak: number, tau: number, end: number) {
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(0, t + a, tau); g.gain.setValueAtTime(0, end);
  }
  private tone(bus: AudioNode, f: number, t: number, dur: number, vol: number, type: OscillatorType = 'sine', attack = 0.006, slideTo?: number) {
    const ctx = this.ctx!; const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    this.env(g, t, attack, vol, dur / 4, t + dur + 0.3); o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.3);
  }
  private burst(bus: AudioNode, t: number, dur: number, vol: number, freq: number, type: BiquadFilterType = 'highpass', q = 0.7, a = 0.002) {
    const ctx = this.ctx!; const s = ctx.createBufferSource(); s.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain();
    this.env(g, t, a, vol, dur / 3, t + dur + 0.1); s.connect(f).connect(g).connect(bus); s.start(t, this.r() * 1.5); s.stop(t + dur + 0.1);
  }
  // ---------- SFX (soft attacks, rounded timbres). Unaffected by the music crossfade.
  play(n: Sfx, combo = 0) {
    if (!this.sfxOn || !this.ensure()) return; const t = this.ctx!.currentTime + 0.005; const b = this.sfxBus;
    switch (n) {
      case 'select': this.tone(b, 720, t, 0.09, 0.2, 'sine', 0.004, 540); this.burst(b, t, 0.025, 0.025, 1800, 'bandpass', 1); break;
      case 'click': this.tone(b, 620, t, 0.06, 0.13, 'sine', 0.004, 470); break;
      case 'match': { const base = 72 + Math.min(combo, 6) * 2; [0, 7, 12].forEach((iv, i) => { this.tone(b, mtof(base + iv), t + i * 0.06, 0.45, 0.11); this.tone(b, mtof(base + iv) * 2, t + i * 0.06, 0.2, 0.02); }); break; }
      case 'fuse': { const base = 76 + Math.min(combo, 6) * 2; this.tone(b, mtof(base), t, 0.16, 0.12, 'sine', 0.004, mtof(base + 7)); this.tone(b, mtof(base + 12), t + 0.07, 0.18, 0.07); break; }
      case 'invalid': this.tone(b, 210, t, 0.16, 0.2, 'sine', 0.008, 150); this.tone(b, 420, t, 0.08, 0.04, 'sine', 0.008, 300); break;
      case 'shuffle': { const ctx = this.ctx!; const s = ctx.createBufferSource(); s.buffer = this.noise; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(2200, t + 0.35);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.14, t + 0.12); g.gain.linearRampToValueAtTime(0, t + 0.42); s.connect(f).connect(g).connect(b); s.start(t); s.stop(t + 0.45);
        for (let i = 0; i < 5; i++) this.tone(b, 880 + i * 90, t + 0.05 + i * 0.07, 0.04, 0.04, 'sine', 0.003); break; }
      case 'hint': [79, 84, 88, 91].forEach((m, i) => this.tone(b, mtof(m), t + i * 0.07, 0.32, 0.08)); break;
      case 'win': [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => { this.tone(b, mtof(m), t + i * 0.09, 0.6, 0.11); this.tone(b, mtof(m), t + i * 0.09, 0.4, 0.03, 'triangle', 0.01); }); break;
      case 'star': this.tone(b, mtof(79 + combo * 4), t, 0.7, 0.14); this.tone(b, mtof(91 + combo * 4), t, 0.3, 0.025); break;
      case 'unlock': [79, 84, 88, 91].forEach((m, i) => { this.tone(b, mtof(m), t + i * 0.1, 0.5, 0.1); this.tone(b, mtof(m) * 2, t + i * 0.1, 0.25, 0.015); }); break;
      case 'legend': for (let i = 0; i < 6; i++) this.tone(b, mtof(70 + (i % 2) * 5), t + i * 0.055, 0.07, 0.06, 'triangle', 0.006, mtof(64)); [79, 83, 86, 91, 95].forEach((m, i) => { this.tone(b, mtof(m), t + 0.36 + i * 0.08, 0.7, 0.09); this.tone(b, mtof(m) * 2, t + 0.36 + i * 0.08, 0.35, 0.015); }); break;
      case 'buy': [76, 83].forEach((m, i) => this.tone(b, mtof(m), t + i * 0.08, 0.35, 0.12)); this.burst(b, t, 0.04, 0.03, 3000, 'bandpass', 1); break;
      case 'lose': [67, 63, 60].forEach((m, i) => this.tone(b, mtof(m), t + i * 0.18, 0.5, 0.12, 'triangle', 0.012)); break;
    }
  }

  // ---------- music
  /** Campaign world index → that world's theme. Menus and modes use playTheme() with their own choice. */
  music(world: number) { void this.playTheme(themeForWorld(world)); }

  /** Load theme modules (and the shared voices) without starting them. Safe to call more than once. */
  preload(ids: readonly ThemeId[] = THEME_IDS): Promise<void> {
    return Promise.all(ids.map(async (id) => {
      if (this.plays.has(id)) return;
      const m = await LOADERS[id]();
      this.plays.set(id, m.play);
    })).then(async () => {
      if (!this.voices) this.voices = await import('./music/voices');
    }).then(() => undefined);
  }

  /**
   * Crossfade to `id` (or fade it in, if nothing is playing). Same theme is a no-op.
   * Resolves once the request has been applied. A gesture is still required before sound
   * actually leaves a suspended context.
   */
  playTheme(id: ThemeId): Promise<void> {
    if (!isThemeId(id)) return Promise.resolve();
    this.desired = id;
    if (!this.musicOn) return Promise.resolve();
    const token = ++this.token;
    const job = this.preload([id]).then(() => {
      if (token !== this.token || !this.musicOn || this.desired !== id) return;
      if (!this.ensure()) return;
      this.commit(id);
    }).catch(() => { /* a missing chunk leaves the previous theme playing */ });
    return job;
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    if (!on) {
      this.token++; // drop a theme load that hasn't started yet
      if (this.ctx) this.rampMute(0, 0.4);
      const token = ++this.muteToken;
      window.setTimeout(() => { if (token !== this.muteToken || this.musicOn) return; this.hardStop(); }, 460);
      return;
    }
    this.muteToken++;
    if (this.ctx) this.rampMute(1, 0.45);
    const steady = this.machine.phase !== 'idle' && this.machine.lead === this.desired && !this.machine.pending && !this.machine.out;
    if (steady) { this.startTimer(); return; }
    void this.playTheme(this.desired);
  }

  /** One scheduler tick. The interval calls this; offline renders call it as they advance the clock. */
  pump() {
    if (!this.ctx || this.ctx.state === 'closed') return;
    const now = this.ctx.currentTime;
    const boundary = this.leadBoundary(now);
    const next = advance(this.machine, now, boundary);
    if (next !== this.machine) this.machine = next;
    if (this.manual) this.traceGains(now);
    else this.apply(now);
    if (this.musicOn) {
      for (const id of audibleIds(this.machine)) {
        const play = this.plays.get(id);
        const deck = this.decks.get(id);
        if (play && deck?.alive) this.scheduleDeck(deck, play, now);
      }
    }
    this.retire(now);
  }

  snapshot(): MusicSnapshot {
    return {
      state: this.ctx?.state ?? 'none', theme: this.machine.lead, pending: this.machine.pending, out: this.machine.out,
      phase: this.machine.phase, on: this.musicOn, audible: audibleIds(this.machine),
    };
  }

  private rampMute(to: number, dur: number) {
    const t = this.ctx!.currentTime; const g = this.musicMute.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(to, t + dur);
  }

  private leadBoundary(now: number): number | null {
    const id = this.machine.lead;
    const deck = id ? this.decks.get(id) : undefined;
    if (!id || !deck) return null;
    return nextBoundary(deck.anchor, themeById(id).bpm, now);
  }

  private commit(id: ThemeId) {
    const now = this.ctx!.currentTime;
    const next = requestTheme(this.machine, id, now, this.leadBoundary(now));
    if (next !== this.machine) this.machine = next;
    this.apply(now);
    this.startTimer();
  }

  private startTimer() {
    if (this.manual || this.timer) return;
    this.timer = window.setInterval(() => this.pump(), 40);
  }

  /**
   * Offline preview: write the equal-power curve as a chain of ramps and never cancel earlier ones.
   * cancelScheduledValues() before startRendering() would erase the fade that hasn't been played yet.
   */
  private traceGains(now: number) {
    if (!this.ctx) return;
    const m = this.machine;
    const live = new Set(audibleIds(m));
    const g = gainsAt(m, now);
    for (const id of live) {
      const d = this.ensureDeck(id, now);
      const n = (id === m.lead ? g.lead : g.out) * themeById(id).level;
      this.traceParam(d, n, now);
    }
    for (const [id, d] of this.decks) {
      if (live.has(id)) continue;
      this.traceParam(d, 0, now);
      d.alive = false;
    }
  }

  private traceParam(d: Deck, gain: number, now: number) {
    const p = d.gain.gain;
    const v = Math.max(0, gain);
    if (d.traceT == null) {
      p.setValueAtTime(v, Math.max(0, now));
      d.traceT = now;
      return;
    }
    if (now <= d.traceT + 0.0005) return;
    p.linearRampToValueAtTime(v, now);
    d.traceT = now;
  }

  private apply(now: number) {
    if (this.manual) { this.traceGains(now); this.appliedRev = this.machine.rev; return; }
    if (!this.ctx || this.machine.rev === this.appliedRev) return;
    this.appliedRev = this.machine.rev;
    const m = this.machine;
    const live = new Set(audibleIds(m));
    for (const id of this.decks.keys()) if (!live.has(id)) this.silenceDeck(id, now);
    const gNow = gainsAt(m, now);
    const fading = m.phase === 'fadein' || m.phase === 'xfade';
    const endAt = fading ? Math.max(now, m.t0 + m.dur) : now;
    const gEnd = gainsAt(m, endAt);
    const dur = Math.max(0.02, endAt - now);
    if (m.lead) this.envDeck(m.lead, gNow.lead * themeById(m.lead).level, gEnd.lead * themeById(m.lead).level, now, dur, !fading);
    if (m.out) this.envDeck(m.out, gNow.out * themeById(m.out).level, gEnd.out * themeById(m.out).level, now, dur, false);
  }

  private envDeck(id: ThemeId, from: number, to: number, now: number, dur: number, hold: boolean) {
    const d = this.ensureDeck(id, now);
    const p = d.gain.gain;
    p.cancelScheduledValues(now);
    const cur = Number.isFinite(p.value) ? p.value : from;
    if (hold || dur < 0.03 || Math.abs(cur - to) < 0.0008) {
      p.setValueAtTime(cur, now);
      p.linearRampToValueAtTime(to, now + 0.03);
      return;
    }
    const N = 32; const curve = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      curve[i] = cur + (to - cur) * Math.sin(u * Math.PI / 2);
    }
    try {
      p.setValueAtTime(curve[0], now);
      p.setValueCurveAtTime(curve, now + 0.005, Math.max(0.02, dur - 0.005));
    } catch {
      p.cancelScheduledValues(now);
      p.setValueAtTime(cur, now);
      p.linearRampToValueAtTime(to, now + dur);
    }
  }

  private ensureDeck(id: ThemeId, now: number): Deck {
    const found = this.decks.get(id);
    if (found) { found.alive = true; found.retireAt = Infinity; return found; }
    if (!this.voices || !this.ctx) throw new Error('music voices not loaded');
    const ctx = this.ctx;
    const spec = themeById(id);
    const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(this.musicIn);
    const wet = ctx.createGain();
    const delay = ctx.createDelay(1.2);
    delay.delayTime.value = Math.min(1.1, (60 / spec.bpm / 2) * 3);
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2000; lp.Q.value = 0.4;
    wet.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(gain);
    const deck: Deck = {
      id, gain, wet, delay, kit: this.voices.makeKit({ ctx, dry: gain, wet }),
      anchor: now, next: now + 0.05, step: 0, rng: rng(hashId(id)), mem: { mel: 64 + spec.keyPc }, alive: true, retireAt: Infinity, traceT: null,
    };
    this.decks.set(id, deck);
    return deck;
  }

  private silenceDeck(id: ThemeId, now: number) {
    const d = this.decks.get(id);
    if (!d || !d.alive) return;
    d.alive = false; d.retireAt = now + 0.7;
    const p = d.gain.gain;
    try { p.cancelScheduledValues(now); p.setValueAtTime(p.value, now); p.linearRampToValueAtTime(0, now + 0.06); } catch { /* context closing */ }
  }

  private retire(now: number) {
    if (this.manual) return;
    for (const [id, d] of this.decks) {
      if (d.alive || now < d.retireAt) continue;
      try { d.gain.disconnect(); d.wet.disconnect(); } catch { /* already gone */ }
      this.decks.delete(id);
    }
  }

  private scheduleDeck(deck: Deck, play: ThemePlay, now: number) {
    const spec = themeById(deck.id);
    const eighth = 60 / spec.bpm / 2;
    const skipped = skipLate(deck.next, deck.step, now, eighth);
    deck.next = skipped.next; deck.step = skipped.step;
    while (deck.next < now + 0.28) {
      const step = deck.step;
      const beat = step % 8;
      const absBar = Math.floor(step / 8);
      const bar = absBar % spec.bars;
      const swing = spec.swing && beat % 2 ? eighth * spec.swing : 0;
      const t = Math.max(now - 0.02, deck.next + swing + (deck.rng() - 0.5) * 0.004);
      const { chord, next, sec } = chordAt(spec, absBar);
      play(deck.kit, {
        time: t, eighth, step, beat, bar, absBar, cycle: Math.floor(absBar / spec.bars), sec, chord, next, spec,
        rng: deck.rng, mem: deck.mem,
      });
      deck.next += eighth; deck.step++;
    }
  }

  private hardStop() {
    clearInterval(this.timer); this.timer = 0;
    for (const d of this.decks.values()) { try { d.gain.disconnect(); d.wet.disconnect(); } catch { /* closing */ } }
    this.decks.clear();
    this.machine = idleMachine();
    this.appliedRev = -1;
  }
}
