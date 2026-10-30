// Save code ("Code de sauvegarde"): export → import round-trips; any damaged, foreign or hostile code is refused or sanitized.
import { it, expect } from 'vitest';
import { defaults, exportCode, importCode, sanitize } from '../src/storage';

const sample = () => { const s = defaults(); s.stars = { 0: 3, 1: 2 }; s.carrots = 1234; s.owned = ['o:fraise', 'k:jade', 'd:lanterne', 'o:citrouille']; s.edge = 'jade'; s.decor = ['lanterne']; s.outfit = 'citrouille'; s.stats.dailyDone = ['2026-10-29']; s.firstDay = '2026-10-01'; s.settings.sfxVol = 0.4; return s; };

it('round-trips the whole save (except the in-progress board)', () => {
  const s = sample(); const r = importCode(exportCode(s));
  expect('save' in r).toBe(true); if (!('save' in r)) return;
  expect(r.save).toEqual(sanitize({ ...s, run: null })); expect(r.save.carrots).toBe(1234); expect(r.save.edge).toBe('jade'); expect(r.save.decor).toEqual(['lanterne']); expect(r.save.firstDay).toBe('2026-10-01');
});
it('accepts a code split over lines or with spaces (pasted from a note app)', () => {
  const c = exportCode(sample()); const messy = `  ${c.slice(0, 40)}\n${c.slice(40, 90)} ${c.slice(90)}\n`;
  expect('save' in importCode(messy)).toBe(true);
});
it('accented names and UTF-8 survive', () => {
  const s = sample(); (s.best as Record<string, number>)['dé'] = 5; const r = importCode(exportCode(s));
  expect('save' in r).toBe(true);
});
it('refuses empty, foreign, truncated and tampered codes with a French message', () => {
  const c = exportCode(sample());
  const err = (t: string) => { const r = importCode(t); return 'error' in r ? r.error : ''; };
  expect(err('')).toMatch(/Colle/);
  expect(err('{"stars":{}}')).toMatch(/n'est pas un code/);
  expect(err(c.slice(0, c.length - 12))).toMatch(/incomplet|abîmé/);
  const i = c.indexOf('-') + 20; const tampered = c.slice(0, i) + (c[i] === 'A' ? 'B' : 'A') + c.slice(i + 1);
  expect(err(tampered)).toMatch(/abîmé/);
  expect(err('CAPY1-!!!!-1')).toMatch(/incomplet/);
});
it('a well-formed code with hostile content is sanitized (no unknown items, no HTML, no absurd numbers)', () => {
  const body = Buffer.from(JSON.stringify({ stars: { 0: 99, x: 3 }, best: {}, settings: {}, stats: {}, carrots: 1e12, owned: ['o:<img src=x onerror=alert(1)>', 'd:bonsai', 'zz:top'], decor: ['bonsai', 'maneki', '<b>'], edge: 'nope', outfit: '<svg onload=alert(1)>' }), 'utf8').toString('base64');
  const fnv = (s: string) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const r = importCode(`CAPY1-${body}-${fnv(body)}`); expect('save' in r).toBe(true); if (!('save' in r)) return;
  expect(r.save.owned).toEqual(['d:bonsai']); expect(r.save.decor).toEqual(['bonsai']); expect(r.save.edge).toBe('bois'); expect(r.save.outfit).toBe('agrume');
  expect(r.save.carrots).toBeLessThan(1e9); expect(r.save.stars[0]).toBeLessThanOrEqual(3);
});
it('a new save has the free wooden tile back and no decor', () => { const s = sanitize({}); expect(s.edge).toBe('bois'); expect(s.decor).toEqual([]); });
