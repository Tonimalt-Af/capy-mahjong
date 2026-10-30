// Regression tests for the 2026-10-30 audit (P0/security): shuffle soft-lock, corrupted saves, deep links, XSS via save data.
import { describe, it, expect, beforeEach } from 'vitest';
import { deal, reshuffle, clearable, findHint, solve, rng, type Tile } from '../src/engine';
import { LAYOUTS, LEVELS } from '../src/levels';
import { sanitize, loadSave, save, KEY, BACKUP_KEY, CORRUPT_KEY, defaults } from '../src/storage';
import { parseDeep } from '../src/deeplink';
import { isDay } from '../src/dates';

const L8_PAIRS: [number, number][] = [[16, 46], [31, 62], [7, 17], [39, 51], [8, 23], [22, 63], [15, 40], [0, 24], [52, 58], [38, 53], [6, 37], [1, 25], [36, 59], [35, 57], [5, 45], [4, 44], [32, 34], [14, 43], [26, 54], [33, 42], [9, 55], [13, 47], [41, 60], [18, 48], [30, 49], [12, 56], [10, 11], [3, 29], [19, 28], [20, 27]];

describe('shuffle soft-lock (audit P0-1)', () => {
  it('level 8 repro: the 4 stacked leftovers are reported dead, faces untouched, no throw', () => {
    const lv = LEVELS[7]; expect(lv.seed).toBe(70859);
    const { tiles } = deal(LAYOUTS[lv.layout].make(), lv.seed, 0.2);
    for (const [a, b] of L8_PAIRS) { tiles[a].removed = true; tiles[b].removed = true; }
    const live = tiles.filter((t) => !t.removed); expect(live).toHaveLength(4);
    expect(clearable(live)).toBe(false);
    const before = tiles.map((t) => t.kind);
    for (let s = 0; s < 20; s++) expect(reshuffle(tiles, s)).toBe('dead');
    expect(tiles.map((t) => t.kind)).toEqual(before);
  });
  it('a 3-high stack + 1 loose tile is dead; two loose tiles are solvable', () => {
    expect(clearable([{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 2 }, { x: 6, y: 0, z: 0 }])).toBe(false);
    expect(clearable([{ x: 0, y: 0, z: 0 }, { x: 6, y: 0, z: 0 }])).toBe(true);
    expect(clearable([{ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }])).toBe(false); // odd
  });
  it('random mid-game positions: reshuffle never throws; "solvable" really is, and "pair" always leaves a move', () => {
    let solvable = 0;
    for (let k = 0; k < 120; k++) {
      const lv = LEVELS[k % LEVELS.length]; const { tiles } = deal(LAYOUTS[lv.layout].make(), lv.seed + k); const r = rng(k + 1);
      const steps = Math.floor(r() * tiles.length / 2); // random legal play
      for (let i = 0; i < steps; i++) { const h = findHint(tiles); if (!h) break; h[0].removed = h[1].removed = true; if (r() < 0.5) continue; }
      if (!tiles.some((t) => !t.removed)) continue;
      const res = reshuffle(tiles, k);
      if (res === 'solvable') { solvable++; const live = tiles.filter((t) => !t.removed); if (live.length <= 40) expect(solve(tiles.map((t) => ({ ...t })) as Tile[], 400_000)).not.toBeNull(); }
      if (res !== 'dead') expect(findHint(tiles)).not.toBeNull();
    }
    expect(solvable).toBeGreaterThan(80);
  });
});

describe('save sanitising (audit P0-2, XSS)', () => {
  it('stars:null / theme:"nope" / wrong types fall back per field', () => {
    const s = sanitize({ stars: null, theme: 'nope', bg: 42, outfit: '<img src=x onerror=alert(1)>', carrots: '<img src=x onerror=window.__x=1>', settings: 'x', stats: { won: 'many', played: -4, dailyDone: ['2026-13-45', 'x', '2026-10-01'] }, ach: ['first', 'nope', 3], owned: ['o:fraise', 'o:capydindon', 'z:bad', '__proto__'] });
    expect(s.stars).toEqual({}); expect(s.theme).toBe('capy'); expect(s.bg).toBe('monde'); expect(s.outfit).toBe('agrume'); expect(s.carrots).toBe(0);
    expect(s.settings.musicVol).toBe(0.45); expect(s.settings.hl).toBe(false);
    expect(s.stats.won).toBe(0); expect(s.stats.played).toBe(0); expect(s.stats.dailyDone).toEqual(['2026-10-01']);
    expect(s.ach).toEqual(['first']); expect(s.owned).toEqual(['o:fraise']); // legend outfit can't be granted by a save
  });
  it('keeps valid data and equipped items the player owns', () => {
    const s = sanitize({ stars: { 0: 3, 1: 2, 99: 3, x: 1 }, best: { 0: 1200, d2026_1: 5, 'd2026-10-29': 900 }, carrots: 340.7, owned: ['t:chat', 'o:lunettes'], theme: 'chat', outfit: 'lunettes', bg: 'nuit', stats: { legends: 1 } });
    expect(s.stars).toEqual({ 0: 3, 1: 2 }); expect(s.best).toEqual({ 0: 1200, 'd2026-10-29': 900 }); expect(s.carrots).toBe(340);
    expect(s.theme).toBe('chat'); expect(s.outfit).toBe('lunettes'); expect(s.bg).toBe('monde'); expect(s.owned).toContain('o:capydindon');
  });
  it('drops a run with unknown kinds, a bad layout or faces that no longer pair up', () => {
    const n = LAYOUTS.galet.make().length; const { tiles } = deal(LAYOUTS.galet.make(), 1000);
    const lvl = { ...LEVELS[0], mode: 'level', title: 'Niveau 1', legend: 0 };
    const ok = { level: lvl, kinds: tiles.map((t) => t.kind), removed: [], history: [], t: 5, hints: 0, shuffles: 0, undos: 0, score: 0, legends: 0, maxCombo: 0 };
    expect(sanitize({ run: ok }).run).not.toBeNull();
    expect(sanitize({ run: { ...ok, kinds: Array(n).fill('<svg onload=x>') } }).run).toBeNull();
    expect(sanitize({ run: { ...ok, level: { ...lvl, layout: '__proto__' } } }).run).toBeNull();
    expect(sanitize({ run: { ...ok, kinds: [...ok.kinds.slice(1), 'canard'] } }).run).toBeNull();
    expect(sanitize({ run: { ...ok, level: { ...lvl, title: '<img src=x>'.repeat(20) } } }).run!.level.title.length).toBeLessThanOrEqual(60);
  });
});

describe('save persistence: backup + never silently lose an unreadable save', () => {
  const mem = new Map<string, string>();
  beforeEach(() => { mem.clear(); (globalThis as unknown as { localStorage: Storage }).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, String(v)), removeItem: (k: string) => void mem.delete(k), clear: () => mem.clear(), key: () => null, length: 0 } as Storage; });
  it('a good save is loaded and copied to the backup key', () => {
    mem.set(KEY, JSON.stringify({ carrots: 50 })); const r = loadSave(); expect(r.status).toBe('ok'); expect(r.save.carrots).toBe(50); expect(mem.get(BACKUP_KEY)).toBe(mem.get(KEY));
  });
  it('corrupt JSON → backup restored, corrupt text kept aside', () => {
    mem.set(BACKUP_KEY, JSON.stringify({ carrots: 77 })); mem.set(KEY, '{not json');
    const r = loadSave(); expect(r.status).toBe('backup'); expect(r.save.carrots).toBe(77); expect(mem.get(CORRUPT_KEY)).toBe('{not json');
  });
  it('corrupt JSON without backup → fresh game but the text is preserved', () => {
    mem.set(KEY, '{"stars":'); const r = loadSave(); expect(r.status).toBe('lost'); expect(mem.get(CORRUPT_KEY)).toBe('{"stars":');
  });
  it('save() reports quota errors instead of swallowing them', () => {
    (globalThis as unknown as { localStorage: Storage }).localStorage.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
    expect(save(defaults())).toBe(false);
  });
});

describe('deep links (audit P1-1)', () => {
  it('rejects malformed values without throwing', () => {
    for (const q of ['?level=abc', '?level=-1', '?level=30', '?level=1e3', '?mode=zen&seed=abc', '?mode=zen&layout=constructor', '?mode=zen&layout=__proto__', '?mode=zen&diff=hard', '?mode=bogus']) expect(parseDeep(q).bad, q).toBe(true);
    expect(parseDeep('?level=abc').deep).toBeNull();
  });
  it('accepts valid ones', () => {
    expect(parseDeep('?level=7').deep).toEqual({ kind: 'level', n: 7 });
    expect(parseDeep('?mode=zen&seed=5&diff=difficile&layout=coeur').deep).toEqual({ kind: 'zen', seed: 5, diff: 'difficile', layout: 'coeur', legend: false });
    expect(parseDeep('?mode=endless&round=-3')).toEqual({ deep: { kind: 'endless' }, bad: false }); // round param ignored
    expect(parseDeep('?mode=daily&day=2026-13-45')).toEqual({ deep: { kind: 'daily' }, bad: true });
    expect(parseDeep('').deep).toBeNull();
  });
  it('isDay only accepts real calendar dates', () => {
    expect(isDay('2026-10-30')).toBe(true); expect(isDay('2026-02-30')).toBe(false); expect(isDay('2026-13-45')).toBe(false); expect(isDay('2001-01-01')).toBe(false);
  });
});
