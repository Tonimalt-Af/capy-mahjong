// Theme-to-theme transition. At most two themes are audible.
// A steady theme waits for its next bar (or the next beat, when the bar is far) and then
// equal-power crossfades for XFADE_SEC. A third request during that fade is queued:
// it replaces the pending target and starts only once the current pair has finished,
// so rapid switching never stacks a third voice.
import type { ThemeId } from './catalog';

export const XFADE_SEC = 3;
export const FADE_IN_SEC = 2.4;
/** Don't hold a switch longer than this waiting for a downbeat; fall back to the beat. */
export const MAX_BAR_WAIT = 2.8;

export type Phase = 'idle' | 'fadein' | 'hold' | 'wait' | 'xfade';

export interface MusicMachine {
  rev: number;
  phase: Phase;
  /** Theme we are heading toward (the incoming one during a crossfade). */
  lead: ThemeId | null;
  /** Theme fading out. Null unless phase is 'xfade'. */
  out: ThemeId | null;
  /** Queued target. Does not add a voice until the current fade ends. */
  pending: ThemeId | null;
  t0: number;
  dur: number;
  armAt: number | null;
  /** Outgoing and incoming gains captured when a crossfade starts. */
  out0: number;
  in0: number;
}

export function idleMachine(): MusicMachine {
  return { rev: 0, phase: 'idle', lead: null, out: null, pending: null, t0: 0, dur: 0, armAt: null, out0: 0, in0: 0 };
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

function bump(s: MusicMachine, patch: Partial<MusicMachine>): MusicMachine {
  return { ...s, ...patch, rev: s.rev + 1 };
}

/**
 * Equal-power pair.
 * Fresh crossfade (out0 = 1, in0 = 0): out = cos, inn = sin, sum of squares = 1.
 * A reverse starts from the gains already in the air (in0 / out0), so the handoff doesn't jump.
 */
export function fadeGains(p: number, out0: number, in0: number): { out: number; inn: number } {
  const x = clamp01(p);
  const s = Math.sin(x * Math.PI / 2);
  const c = Math.cos(x * Math.PI / 2);
  return { out: out0 * c, inn: in0 + (1 - in0) * s };
}

export function gainsAt(s: MusicMachine, now: number): { lead: number; out: number } {
  if (s.phase === 'idle' || !s.lead) return { lead: 0, out: 0 };
  if (s.phase === 'hold' || s.phase === 'wait') return { lead: 1, out: 0 };
  const p = s.dur <= 0 ? 1 : clamp01((now - s.t0) / s.dur);
  if (s.phase === 'fadein') return { lead: Math.sin(p * Math.PI / 2), out: 0 };
  const g = fadeGains(p, s.out0, s.in0);
  return { lead: g.inn, out: g.out };
}

export function audibleIds(s: MusicMachine): ThemeId[] {
  const ids = [s.lead, s.out].filter((x): x is ThemeId => x != null);
  return [...new Set(ids)];
}

function beginFadeIn(s: MusicMachine, theme: ThemeId, now: number): MusicMachine {
  return bump(s, { phase: 'fadein', lead: theme, out: null, pending: null, t0: now, dur: FADE_IN_SEC, armAt: null, out0: 0, in0: 0 });
}

function beginXfade(s: MusicMachine, theme: ThemeId, now: number): MusicMachine {
  const g = gainsAt(s, now);
  return bump(s, { phase: 'xfade', out: s.lead, lead: theme, pending: null, t0: now, dur: XFADE_SEC, armAt: null, out0: g.lead, in0: 0 });
}

function beginReverse(s: MusicMachine, now: number): MusicMachine {
  const g = gainsAt(s, now);
  return bump(s, { phase: 'xfade', lead: s.out, out: s.lead, pending: null, t0: now, dur: XFADE_SEC, armAt: null, out0: g.lead, in0: g.out });
}

function shouldWait(now: number, boundary: number | null): boundary is number {
  return boundary != null && boundary - now > 0.03 && boundary - now <= MAX_BAR_WAIT;
}

/**
 * Ask for `theme` at audio-clock `now`.
 * `boundary` is the next bar (or beat) of the theme that is currently steady, or null to fade now.
 */
export function requestTheme(s: MusicMachine, theme: ThemeId, now: number, boundary: number | null): MusicMachine {
  if (s.phase === 'idle' || s.lead == null) return beginFadeIn(s, theme, now);

  if (s.phase === 'fadein') {
    if (theme === s.lead && !s.pending) return s;
    if (theme === s.lead) return bump(s, { pending: null, armAt: null });
    // The entrance hasn't settled; fading now keeps the switch inside the same 2–4 s window.
    return beginXfade(s, theme, now);
  }

  if (s.phase === 'hold') {
    if (theme === s.lead) return s;
    if (shouldWait(now, boundary)) return bump(s, { phase: 'wait', pending: theme, armAt: boundary, out: null });
    return beginXfade(s, theme, now);
  }

  if (s.phase === 'wait') {
    if (theme === s.lead) return bump(s, { phase: 'hold', pending: null, armAt: null });
    if (theme === s.pending) return s;
    return { ...s, pending: theme };
  }

  if (theme === s.lead) return s.pending ? { ...s, pending: null } : s;
  if (theme === s.out) return beginReverse(s, now);
  if (theme === s.pending) return s;
  return { ...s, pending: theme };
}

/**
 * Move waits and finished fades forward. Call once per audio tick.
 * `boundary` is the next boundary of the lead theme, used when a queued theme is released.
 */
export function advance(s: MusicMachine, now: number, boundary: number | null): MusicMachine {
  if (s.phase === 'fadein' && now >= s.t0 + s.dur) {
    return bump(s, { phase: 'hold', t0: now, dur: 0, out: null, pending: null, armAt: null });
  }
  if (s.phase === 'wait' && s.pending && s.armAt != null && now >= s.armAt) return beginXfade(s, s.pending, now);
  if (s.phase === 'xfade' && now >= s.t0 + s.dur) {
    const held = bump(s, { phase: 'hold', out: null, pending: null, armAt: null, t0: now, dur: 0, out0: 0, in0: 0 });
    if (s.pending && s.pending !== s.lead) return requestTheme(held, s.pending, now, boundary);
    return held;
  }
  return s;
}

/** Next musical boundary of a theme whose downbeat grid starts at `anchor`. Prefers the bar. */
export function nextBoundary(anchor: number, bpm: number, now: number, maxWait = MAX_BAR_WAIT): number {
  if (!(bpm > 0)) return now;
  const eighth = 60 / bpm / 2;
  const bar = eighth * 8;
  const beat = eighth * 2;
  let elapsed = now - anchor;
  if (elapsed < 0) elapsed = 0;
  const intoBar = elapsed % bar;
  const toBar = intoBar <= 0.02 ? 0 : bar - intoBar;
  if (toBar === 0) return now;
  if (toBar <= maxWait) return now + toBar;
  const intoBeat = elapsed % beat;
  const toBeat = intoBeat <= 0.02 ? 0 : beat - intoBeat;
  return now + toBeat;
}

/**
 * After a suspended audio clock jumps, drop the eighths that are already late
 * instead of scheduling them in a lump.
 */
export function skipLate(next: number, step: number, now: number, eighth: number): { next: number; step: number } {
  if (!(eighth > 0) || next >= now - 0.05) return { next, step };
  const skip = Math.ceil((now - next) / eighth);
  return { next: next + skip * eighth, step: step + skip };
}
