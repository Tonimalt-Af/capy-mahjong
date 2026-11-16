import { describe, expect, test } from 'vitest';
import { THEME_IDS, THEMES, chordAt, themeById, type ThemeId } from '../src/music/catalog';
import type { Kit, ThemePlay } from '../src/music/kit';
import { ENDLESS_EVERY, MENU_THEME, WORLD_THEMES, ZEN_THEME, themeForContext, themeForPlay, themeForWorld } from '../src/music/select';
import { FADE_IN_SEC, MAX_BAR_WAIT, XFADE_SEC, advance, audibleIds, fadeGains, gainsAt, idleMachine, nextBoundary, requestTheme, skipLate } from '../src/music/transition';
import { play as brume } from '../src/music/themes/brume';
import { play as foret } from '../src/music/themes/foret';
import { play as montagne } from '../src/music/themes/montagne';
import { play as onsen } from '../src/music/themes/onsen';
import { play as riviere } from '../src/music/themes/riviere';
import { play as temple } from '../src/music/themes/temple';

const PLAY: Record<ThemeId, ThemePlay> = { riviere, onsen, foret, montagne, temple, brume };
const rng = (seed: number) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

function drive(id: ThemeId) {
  const counts: Record<string, number> = {};
  const kit = new Proxy({} as Kit, {
    get(_t, key) {
      const name = String(key);
      return () => { counts[name] = (counts[name] ?? 0) + 1; };
    },
  });
  const spec = themeById(id);
  const mem = { mel: 64 + spec.keyPc };
  const rand = rng(3);
  const eighth = 60 / spec.bpm / 2;
  for (let step = 0; step < spec.bars * 8; step++) {
    const absBar = Math.floor(step / 8);
    const { chord, next, sec } = chordAt(spec, absBar);
    PLAY[id](kit, {
      time: step * eighth, eighth, step, beat: step % 8, bar: absBar % spec.bars, absBar,
      cycle: Math.floor(absBar / spec.bars), sec, chord, next, spec, rng: rand, mem,
    });
  }
  return counts;
}

describe('themes', () => {
  test('six distinct cozy themes, one lead voice each, chords in a playable range', () => {
    expect(THEMES.map((t) => t.id)).toEqual([...THEME_IDS]);
    expect(new Set(THEMES.map((t) => t.lead)).size).toBe(THEMES.length);
    expect(new Set(THEMES.map((t) => t.key)).size).toBe(THEMES.length);
    for (const s of THEMES) {
      expect(s.bpm).toBeGreaterThanOrEqual(60); expect(s.bpm).toBeLessThanOrEqual(90);
      expect(s.level).toBeGreaterThan(0); expect(s.level).toBeLessThanOrEqual(8);
      expect(s.A).toHaveLength(4); expect(s.B).toHaveLength(4); expect(s.bars).toBe(16);
      for (const c of [...s.A, ...s.B]) {
        expect(c.notes.length).toBeGreaterThanOrEqual(3);
        for (const n of c.notes) { expect(n).toBeGreaterThanOrEqual(53); expect(n).toBeLessThanOrEqual(72); }
      }
      // the loop's last chord falls a fourth or a fifth onto the first, so the repeat doesn't lurch
      const last = s.B[s.B.length - 1].root; const first = s.A[0].root;
      expect([5, 7]).toContain((first - last + 12) % 12);
    }
  });

  test('the harmonic loop joins bar 0 to bar 16', () => {
    for (const s of THEMES) {
      expect(chordAt(s, 0).chord).toEqual(chordAt(s, s.bars).chord);
      expect(chordAt(s, 0).sec).toBe(0);
      expect(chordAt(s, 4).chord).toEqual(s.B[0]);
      expect(chordAt(s, 8).chord).toEqual(s.A[0]);
    }
  });

  test('each arrangement uses its own instruments', () => {
    const heard = Object.fromEntries(THEME_IDS.map((id) => [id, drive(id)])) as Record<ThemeId, Record<string, number>>;
    expect(heard.riviere.guitar).toBeGreaterThan(20);
    expect(heard.riviere.flute).toBeGreaterThan(0);
    expect(heard.riviere.koto ?? 0).toBe(0);
    expect(heard.onsen.ep).toBeGreaterThan(10);
    expect(heard.onsen.pad).toBeGreaterThan(10);
    expect(heard.onsen.snap).toBeGreaterThan(4);
    expect(heard.onsen.shaker ?? 0).toBe(0);
    expect(heard.foret.mallet).toBeGreaterThan(20);
    expect(heard.foret.shaker).toBeGreaterThan(8);
    expect(heard.foret.guitar ?? 0).toBe(0);
    expect(heard.montagne.bell).toBeGreaterThan(8);
    expect(heard.montagne.felt).toBeGreaterThan(4);
    expect(heard.montagne.hat ?? 0).toBe(0);
    expect(heard.temple.koto).toBeGreaterThan(16);
    expect(heard.temple.bowl).toBeGreaterThan(0);
    expect(heard.temple.hat ?? 0).toBe(0);
    expect(heard.brume.felt).toBeGreaterThan(8);
    expect(heard.brume.bowl).toBeGreaterThan(0);
    expect(heard.brume.kick ?? 0).toBe(0);
    expect(heard.brume.hat ?? 0).toBe(0);
    expect(heard.brume.snare ?? 0).toBe(0);
    const signature = (c: Record<string, number>) => Object.keys(c).sort().join(',');
    expect(new Set(THEME_IDS.map((id) => signature(heard[id]))).size).toBe(THEME_IDS.length);
    for (const id of THEME_IDS) expect(heard[id][themeById(id).lead]).toBeGreaterThan(0);
  });
});

describe('where a theme plays', () => {
  test('worlds, menus, zen, daily and endless', () => {
    expect(WORLD_THEMES).toEqual(['riviere', 'onsen', 'foret', 'montagne', 'temple']);
    for (let w = 0; w < 5; w++) expect(themeForWorld(w)).toBe(WORLD_THEMES[w]);
    expect(themeForWorld(-1)).toBe('temple');
    expect(themeForWorld(5)).toBe('riviere');
    expect(MENU_THEME).toBe('riviere');
    for (const screen of ['home', 'modes', 'coll'] as const) expect(themeForContext({ screen })).toBe('riviere');
    expect(themeForContext({ screen: 'map', world: 3 })).toBe('montagne');
    expect(themeForPlay({ mode: 'level', world: 2 })).toBe('foret');
    expect(themeForPlay({ mode: 'daily', world: 4 })).toBe('temple');
    expect(themeForPlay({ mode: 'zen', world: 0 })).toBe(ZEN_THEME);
    expect(themeForPlay({ mode: 'zen', world: 4 })).toBe('brume');
    expect(ENDLESS_EVERY).toBeGreaterThanOrEqual(2);
    for (let round = 0; round < THEME_IDS.length * ENDLESS_EVERY; round++) {
      expect(themeForPlay({ mode: 'endless', world: round % 5, round })).toBe(THEME_IDS[Math.floor(round / ENDLESS_EVERY)]);
    }
    expect(themeForPlay({ mode: 'endless', world: 0 })).toBe('riviere');
    expect(themeForPlay({ mode: 'endless', world: 0, round: -3 })).toBe('riviere');
    expect(themeForContext({ screen: 'game', mode: 'endless', world: 1, round: 3 })).toBe('onsen');
    expect(themeForContext({ screen: 'game', mode: 'zen', world: 1 })).toBe('brume');
  });
});

describe('transition state machine', () => {
  test('crossfade length is a few seconds and a fresh fade is equal-power', () => {
    expect(XFADE_SEC).toBeGreaterThanOrEqual(2); expect(XFADE_SEC).toBeLessThanOrEqual(4);
    expect(FADE_IN_SEC).toBeGreaterThanOrEqual(2); expect(FADE_IN_SEC).toBeLessThanOrEqual(4);
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      const g = fadeGains(p, 1, 0);
      expect(g.out ** 2 + g.inn ** 2).toBeCloseTo(1, 5);
      expect(g.out).toBeGreaterThanOrEqual(0); expect(g.inn).toBeGreaterThanOrEqual(0);
      expect(g.out).toBeLessThanOrEqual(1); expect(g.inn).toBeLessThanOrEqual(1);
    }
    expect(fadeGains(0, 1, 0)).toEqual({ out: 1, inn: 0 });
    expect(fadeGains(1, 1, 0).inn).toBeCloseTo(1);
    expect(fadeGains(1, 1, 0).out).toBeCloseTo(0);
  });

  test('first theme fades in, the same theme does not restart, a new one waits for the bar', () => {
    let s = idleMachine();
    s = requestTheme(s, 'riviere', 0, null);
    expect(s.phase).toBe('fadein'); expect(s.lead).toBe('riviere'); expect(s.dur).toBe(FADE_IN_SEC);
    const again = requestTheme(s, 'riviere', 0.2, null);
    expect(again).toBe(s);
    s = advance(s, FADE_IN_SEC, null);
    expect(s.phase).toBe('hold'); expect(gainsAt(s, FADE_IN_SEC).lead).toBe(1);
    const armed = requestTheme(s, 'onsen', 10, 11.2);
    expect(armed.phase).toBe('wait'); expect(armed.pending).toBe('onsen'); expect(armed.armAt).toBe(11.2);
    expect(audibleIds(armed)).toEqual(['riviere']);
    const started = advance(armed, 11.2, null);
    expect(started.phase).toBe('xfade'); expect(started.lead).toBe('onsen'); expect(started.out).toBe('riviere');
    expect(started.dur).toBe(XFADE_SEC);
    expect(gainsAt(started, 11.2)).toEqual({ lead: 0, out: 1 });
    for (let i = 0; i <= 8; i++) {
      const g = gainsAt(started, 11.2 + (XFADE_SEC * i) / 8);
      expect(g.lead ** 2 + g.out ** 2).toBeCloseTo(1, 5);
    }
    const done = advance(started, 11.2 + XFADE_SEC, null);
    expect(done.phase).toBe('hold'); expect(done.lead).toBe('onsen'); expect(done.out).toBeNull();
  });

  test('a far bar falls back to the beat, and an on-grid switch starts immediately', () => {
    // 60 bpm → eighth = 0.5s, beat = 1s, bar = 4s
    expect(nextBoundary(0, 60, 0.5)).toBeCloseTo(1); // 3.5s left in the bar, past the wait → next beat
    expect(nextBoundary(0, 60, 2)).toBeCloseTo(4); // 2s left, still worth waiting for the bar
    expect(nextBoundary(0, 60, 4)).toBeCloseTo(4); // already on the bar
    expect(MAX_BAR_WAIT).toBeLessThan(4);
    let s = requestTheme(idleMachine(), 'montagne', 0, null);
    s = advance(s, FADE_IN_SEC, null);
    const now = requestTheme(s, 'temple', 20, 20);
    expect(now.phase).toBe('xfade'); expect(now.t0).toBe(20);
  });

  test('reversing a crossfade keeps both gains continuous and never adds a third voice', () => {
    let s = requestTheme(idleMachine(), 'riviere', 0, null);
    s = advance(s, FADE_IN_SEC, null);
    s = requestTheme(s, 'onsen', 10, null);
    const mid = 10 + XFADE_SEC / 2;
    const before = gainsAt(s, mid);
    expect(before.lead).toBeCloseTo(Math.SQRT1_2, 5);
    s = requestTheme(s, 'riviere', mid, null);
    const after = gainsAt(s, mid);
    expect(s.lead).toBe('riviere'); expect(s.out).toBe('onsen');
    expect(after.lead).toBeCloseTo(before.out, 5);
    expect(after.out).toBeCloseTo(before.lead, 5);
    expect(audibleIds(s)).toHaveLength(2);
    s = requestTheme(s, 'foret', mid + 0.1, null);
    expect(s.pending).toBe('foret');
    expect(audibleIds(s)).toEqual(['riviere', 'onsen']);
    const released = advance(s, s.t0 + s.dur, null);
    expect(released.lead).toBe('foret'); expect(released.out).toBe('riviere');
    expect(audibleIds(released)).toEqual(['foret', 'riviere']);
  });

  test('rapid retargets keep only the latest pending theme', () => {
    let s = requestTheme(idleMachine(), 'riviere', 0, null);
    s = advance(s, FADE_IN_SEC, null);
    s = requestTheme(s, 'onsen', 5, 7);
    expect(s.phase).toBe('wait');
    s = requestTheme(s, 'foret', 5.1, 7);
    s = requestTheme(s, 'temple', 5.2, 7);
    expect(s.phase).toBe('wait'); expect(s.lead).toBe('riviere'); expect(s.pending).toBe('temple'); expect(s.armAt).toBe(7);
    s = requestTheme(s, 'riviere', 5.3, 7);
    expect(s.phase).toBe('hold'); expect(s.pending).toBeNull();
  });

  test('asking again for the theme that is arriving cancels a queued third', () => {
    let s = requestTheme(idleMachine(), 'onsen', 0, null);
    s = advance(s, FADE_IN_SEC, null);
    s = requestTheme(s, 'foret', 3, null);
    s = requestTheme(s, 'brume', 3.2, null);
    expect(s.pending).toBe('brume'); expect(s.lead).toBe('foret');
    s = requestTheme(s, 'foret', 3.3, null);
    expect(s.pending).toBeNull(); expect(s.lead).toBe('foret'); expect(s.phase).toBe('xfade');
  });

  test('a suspended clock skips late eighths instead of dumping them', () => {
    expect(skipLate(10, 4, 10.04, 0.4)).toEqual({ next: 10, step: 4 });
    const jumped = skipLate(10, 4, 12, 0.4);
    expect(jumped.step).toBe(4 + 5);
    expect(jumped.next).toBeCloseTo(12);
    expect(jumped.next).toBeGreaterThanOrEqual(12);
  });
});
