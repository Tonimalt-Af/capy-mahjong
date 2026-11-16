// Pitched voices only — no noise bed. Phone speakers turn a noise layer into buzz,
// so hats, snaps and the shaker are short sine partials.
import type { Kit } from './kit';

export interface VoiceCtx { ctx: AudioContext; dry: AudioNode; wet: AudioNode }

function split(v: VoiceCtx, send: number): GainNode {
  const g = v.ctx.createGain();
  g.connect(v.dry);
  if (send > 0) { const w = v.ctx.createGain(); w.gain.value = send; g.connect(w).connect(v.wet); }
  return g;
}

/** Pan, then the deck fader, with an optional echo send. */
function place(v: VoiceCtx, send: number, pan: number): AudioNode {
  const p = v.ctx.createStereoPanner();
  p.pan.value = Math.max(-1, Math.min(1, pan));
  p.connect(split(v, send));
  return p;
}

/** Attack, then an exponential tail. The oscillator stops once the tail is already quiet. */
function shape(g: GainNode, t: number, attack: number, peak: number, tau: number): number {
  const a = Math.max(0.001, attack);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(Math.max(0.0001, peak), t + a);
  g.gain.setTargetAtTime(0.0001, t + a, tau);
  return t + a + Math.max(0.15, tau * 8);
}

function osc(v: VoiceCtx, type: OscillatorType, f: number, t: number, end: number, dest: AudioNode, slide?: number) {
  const o = v.ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(Math.max(20, f), t);
  if (slide && slide > 0) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), Math.min(end, t + 0.08));
  o.connect(dest);
  o.start(t);
  o.stop(end);
  return o;
}

function ping(v: VoiceCtx, f: number, t: number, vel: number, tau: number) {
  const g = v.ctx.createGain();
  const end = shape(g, t, 0.002, vel, tau);
  g.connect(v.dry);
  osc(v, 'sine', f, t, end, g);
}

export function makeKit(v: VoiceCtx): Kit {
  return {
    ep(f, t, dur, vel, pan) {
      const ctx = v.ctx;
      const dest = place(v, 0.14, pan);
      const car = ctx.createOscillator(); const mod = ctx.createOscillator(); const mg = ctx.createGain(); const g = ctx.createGain();
      car.frequency.value = f; mod.frequency.value = f;
      mg.gain.setValueAtTime(f * 1.05, t); mg.gain.setTargetAtTime(f * 0.2, t, 0.25);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.008); g.gain.setTargetAtTime(vel * 0.38, t + 0.008, 0.55); g.gain.setTargetAtTime(0.0001, t + dur, 0.22);
      mod.connect(mg).connect(car.frequency); car.connect(g).connect(dest);
      const tine = ctx.createOscillator(); const tg = ctx.createGain(); tine.frequency.value = f * 4;
      const tineEnd = shape(tg, t, 0.003, vel * 0.1, 0.05); tine.connect(tg).connect(dest);
      const end = t + dur + 1.3;
      car.start(t); mod.start(t); tine.start(t); car.stop(end); mod.stop(end); tine.stop(tineEnd);
    },
    bass(f, t, dur, vel) {
      const bus = split(v, 0);
      const g = v.ctx.createGain();
      const end = t + dur + 0.35;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.012); g.gain.setTargetAtTime(vel * 0.55, t + 0.012, 0.28); g.gain.setTargetAtTime(0.0001, t + dur, 0.07);
      g.connect(bus);
      const a = v.ctx.createOscillator(); a.frequency.value = f;
      const b = v.ctx.createOscillator(); b.type = 'triangle'; b.frequency.value = f; const bg = v.ctx.createGain(); bg.gain.value = 0.5;
      const h = v.ctx.createOscillator(); h.frequency.value = f * 2; const hg = v.ctx.createGain(); hg.gain.value = 0.32;
      a.connect(g); b.connect(bg).connect(g); h.connect(hg).connect(g);
      for (const o of [a, b, h]) { o.start(t); o.stop(end); }
    },
    kick(t, vel) {
      const o = v.ctx.createOscillator(); const g = v.ctx.createGain();
      o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(58, t + 0.09);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.005); g.gain.setTargetAtTime(0.0001, t + 0.005, 0.07);
      o.connect(g).connect(v.dry); o.start(t); o.stop(t + 0.45);
    },
    snare(t, vel) {
      const o = v.ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(165, t + 0.06);
      const g = v.ctx.createGain(); const end = shape(g, t, 0.004, vel, 0.035); g.connect(v.dry);
      o.connect(g); o.start(t); o.stop(end);
      ping(v, 1180, t, vel * 0.3, 0.016); ping(v, 1730, t, vel * 0.18, 0.012);
    },
    hat(t, vel) { ping(v, 5200, t, vel, 0.008); ping(v, 3600, t, vel * 0.45, 0.006); },
    mallet(f, t, dur, vel, pan) {
      const dest = place(v, 0.08, pan);
      const g = v.ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.012); g.gain.setTargetAtTime(vel * 0.4, t + 0.012, 0.18); g.gain.setTargetAtTime(0.0001, t + dur, 0.1);
      g.connect(dest);
      const end = t + dur + 0.7;
      const o = v.ctx.createOscillator(); o.frequency.value = f; o.connect(g);
      const o2 = v.ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f; const g2 = v.ctx.createGain(); g2.gain.value = 0.22; o2.connect(g2).connect(g);
      o.start(t); o2.start(t); o.stop(end); o2.stop(end);
    },
    guitar(f, t, dur, vel, pan) {
      const dest = place(v, 0.16, pan);
      const g = v.ctx.createGain(); const end = shape(g, t, 0.006, vel, Math.min(0.22, dur / 3)); g.connect(dest);
      osc(v, 'sine', f, t, end, g, f * 0.985);
      const h = v.ctx.createGain(); h.gain.value = 0.28; const o2 = v.ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f; o2.connect(h).connect(g); o2.start(t); o2.stop(end);
      const br = v.ctx.createGain(); const brEnd = shape(br, t, 0.003, vel * 0.12, 0.04); br.connect(dest);
      osc(v, 'sine', f * 2.01, t, brEnd, br);
    },
    pad(f, t, dur, vel) {
      const bus = split(v, 0.2);
      const g = v.ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.45); g.gain.setTargetAtTime(0.0001, t + Math.max(0.5, dur - 0.4), 0.45);
      g.connect(bus);
      const end = t + dur + 1.6;
      for (const det of [0.992, 1.008]) {
        const o = v.ctx.createOscillator(); o.frequency.value = f * det; o.connect(g); o.start(t); o.stop(end);
      }
    },
    bell(f, t, dur, vel, pan) {
      const dest = place(v, 0.1, pan);
      const partials: [number, number, number][] = [[1, 1, 0.45], [2.76, 0.28, 0.28], [5.4, 0.08, 0.12]];
      for (const [ratio, amp, tau] of partials) {
        const g = v.ctx.createGain(); const end = shape(g, t, 0.004, vel * amp, tau); g.connect(dest);
        osc(v, 'sine', f * ratio, t, end, g);
      }
    },
    koto(f, t, dur, vel, pan) {
      const dest = place(v, 0.1, pan);
      const g = v.ctx.createGain(); const end = shape(g, t, 0.004, vel, Math.min(0.09, 0.04 + dur * 0.02)); g.connect(dest);
      osc(v, 'triangle', f, t, end, g, f * 0.97);
      const h = v.ctx.createGain(); const hEnd = shape(h, t, 0.002, vel * 0.18, 0.03); h.connect(dest);
      osc(v, 'sine', f * 3, t, hEnd, h);
    },
    bowl(f, t, dur, vel) {
      const bus = split(v, 0.22);
      const g = v.ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.08); g.gain.setTargetAtTime(0.0001, t + 0.2, 1.1);
      g.connect(bus);
      const end = t + Math.max(dur, 2.5);
      const o = v.ctx.createOscillator(); o.frequency.value = f; o.connect(g); o.start(t); o.stop(end);
      const o2 = v.ctx.createOscillator(); o2.frequency.value = f * 2.99; const g2 = v.ctx.createGain(); g2.gain.value = 0.18; o2.connect(g2).connect(g); o2.start(t); o2.stop(end);
    },
    snap(t, vel) { ping(v, 1900, t, vel, 0.012); ping(v, 2700, t + 0.004, vel * 0.4, 0.008); },
    shaker(t, vel) { ping(v, 6400, t, vel, 0.01); ping(v, 5100, t + 0.012, vel * 0.6, 0.008); ping(v, 7200, t + 0.02, vel * 0.35, 0.007); },
    flute(f, t, dur, vel) {
      const bus = split(v, 0.18);
      const g = v.ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.07); g.gain.setTargetAtTime(vel * 0.7, t + 0.07, 0.2); g.gain.setTargetAtTime(0.0001, t + dur, 0.12);
      g.connect(bus);
      const o = v.ctx.createOscillator(); o.frequency.value = f;
      const lfo = v.ctx.createOscillator(); const lg = v.ctx.createGain();
      lfo.frequency.value = 4.2; lg.gain.value = f * 0.012; lfo.connect(lg).connect(o.frequency);
      const quiet = v.ctx.createGain(); quiet.gain.value = 0.15;
      const o2 = v.ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f; o2.connect(quiet).connect(g);
      o.connect(g);
      const end = t + dur + 0.6;
      o.start(t); o2.start(t); lfo.start(t); o.stop(end); o2.stop(end); lfo.stop(end);
    },
    felt(f, t, dur, vel, pan) {
      const dest = place(v, 0.08, pan);
      const g = v.ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.02); g.gain.setTargetAtTime(vel * 0.45, t + 0.02, 0.4); g.gain.setTargetAtTime(0.0001, t + dur, 0.25);
      g.connect(dest);
      const end = t + dur + 1.1;
      const o = v.ctx.createOscillator(); o.frequency.value = f; o.connect(g);
      const h = v.ctx.createOscillator(); h.frequency.value = f * 2; const hg = v.ctx.createGain(); hg.gain.value = 0.18; h.connect(hg).connect(g);
      o.start(t); h.start(t); o.stop(end); h.stop(end);
    },
  };
}
