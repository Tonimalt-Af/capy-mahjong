import { NEW_STATS, ACHIEVEMENTS, SHELF_ITEMS, DECOR, hash, DIFFS, type Stats, type Diff, type PlayLevel, type Mode } from './meta';
import { LAYOUTS, LEVELS, ALL_LEVELS, SECRET_STARS, levelAt } from './levels';
import { KIND_BY_ID, type Theme } from './tiles';
import { isDay } from './dates';

/** In-progress board, saved after every move so an interrupted game can be resumed. */
export interface Run { level: PlayLevel; kinds: string[]; removed: number[]; history: [number, number][]; t: number; hints: number; shuffles: number; undos: number; undoBonus?: number; score: number; legends: number; maxCombo: number }
/** Every key this app writes is prefixed: the github.io origin is shared with the owner's other Pages sites. */
export const KEY = 'capy-mahjong-v1';
export const BACKUP_KEY = 'capy-mahjong-v1.bak';
export const CORRUPT_KEY = 'capy-mahjong-v1.corrupt';
export interface Save { stars: Record<number, number>; best: Record<string, number>; settings: { sfx: boolean; music: boolean; musicVol: number; sfxVol: number; dim: boolean; vibrate: boolean; hl: boolean; autohint: boolean; v?: number }; seenHowTo: boolean; seenUndo?: boolean; stats: Stats; ach: string[]; outfit: string; carrots: number; owned: string[]; theme: Theme; bg: string; /** tile back */ edge: string; /** onsen decorations shown on the home screen */ decor: string[]; diff: Diff; run: Run | null; firstDay?: string }
/** Settings schema version. v2: pair highlight ("Montrer les paires possibles") is off by default; older saves are switched off once. */
export const SETTINGS_V = 2;
const DEF: Save = { stars: {}, best: {}, settings: { sfx: true, music: true, musicVol: 0.45, sfxVol: 0.6, dim: true, vibrate: true, hl: false, autohint: false, v: SETTINGS_V }, seenHowTo: false, stats: NEW_STATS(), ach: [], outfit: 'agrume', carrots: 0, owned: [], theme: 'capy', bg: 'monde', edge: 'bois', decor: [], diff: 'moyen', run: null };
export const defaults = (): Save => structuredClone(DEF);

// ---------- field validators (anything unexpected falls back to the default for that field only)
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const int = (x: unknown, d: number, min = 0, max = 1e9) => (typeof x === 'number' && Number.isFinite(x) ? Math.min(max, Math.max(min, Math.floor(x))) : d);
const bool = (x: unknown, d: boolean) => (typeof x === 'boolean' ? x : d);
const has = (o: object, k: unknown): k is string => typeof k === 'string' && Object.hasOwn(o, k);
const days = (x: unknown) => (Array.isArray(x) ? [...new Set(x.filter(isDay))].sort().slice(-400) : []);

/** Merge saved settings over defaults; volumes missing or invalid in older saves fall back to the new softer defaults. */
export function migrateSettings(x: unknown): Save['settings'] {
  const i = isObj(x) ? x : {}; const d = DEF.settings;
  const vol = (v: unknown, dv: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : dv);
  const o: Save['settings'] = { sfx: bool(i.sfx, d.sfx), music: bool(i.music, d.music), musicVol: vol(i.musicVol, d.musicVol), sfxVol: vol(i.sfxVol, d.sfxVol), dim: bool(i.dim, d.dim), vibrate: bool(i.vibrate, d.vibrate), hl: bool(i.hl, d.hl), autohint: bool(i.autohint, d.autohint), v: SETTINGS_V };
  const from = typeof i.v === 'number' ? i.v : 1;
  if (from < 2) o.hl = false; // one-time switch-off; a player who turns it back on keeps it (v is now 2)
  return o;
}
function stats(x: unknown): Stats {
  const i = isObj(x) ? x : {}; const s = NEW_STATS();
  for (const k of Object.keys(s) as (keyof Stats)[]) { if (k === 'dailyDone' || k === 'dailyLate') continue; (s[k] as number) = int(i[k], 0); }
  s.dailyDone = days(i.dailyDone); s.dailyLate = days(i.dailyLate).filter((k) => !s.dailyDone.includes(k));
  return s;
}
const MODES: Mode[] = ['level', 'daily', 'endless', 'zen'];
function level(x: unknown): PlayLevel | null {
  if (!isObj(x) || !has(LAYOUTS, x.layout) || !MODES.includes(x.mode as Mode)) return null;
  const mode = x.mode as Mode; const l: PlayLevel = { mode, layout: x.layout, n: int(x.n, -1, -1, ALL_LEVELS.length - 1), world: int(x.world, 0, 0, 4), index: int(x.index, 0, 0, 99), seed: int(x.seed, 1, 0, 2 ** 32 - 1), par: int(x.par, 300, 30, 9999), hints: int(x.hints, 1, 0, 99), shuffles: int(x.shuffles, 1, 0, 99), undos: int(x.undos, -1, -1, 99), legend: typeof x.legend === 'number' && x.legend >= 0 && x.legend <= 1 ? x.legend : 0, title: typeof x.title === 'string' ? x.title.slice(0, 60) : '' };
  if (mode === 'level' && l.n < 0) return null;
  if (mode === 'level') l.name = levelAt(l.n).name; // never taken from the save: names are ours
  if (mode === 'daily') { if (!isDay(x.date)) return null; l.date = x.date; if (x.late === true) l.late = true; }
  if (mode === 'endless') l.round = int(x.round, 0, 0, 999);
  if (mode === 'zen' || x.diff !== undefined) { const d = DIFFS.find((f) => f.id === x.diff); if (d) l.diff = d.id; else if (mode === 'zen') l.diff = 'moyen'; }
  return l;
}
function run(x: unknown): Run | null {
  if (!isObj(x)) return null; const lv = level(x.level); if (!lv) return null;
  const n = LAYOUTS[lv.layout].make().length;
  if (!Array.isArray(x.kinds) || x.kinds.length !== n || !x.kinds.every((k) => typeof k === 'string' && KIND_BY_ID.has(k))) return null;
  if (!Array.isArray(x.removed) || !x.removed.every((v) => Number.isInteger(v) && v >= 0 && v < n) || new Set(x.removed).size !== x.removed.length || x.removed.length >= n || x.removed.length % 2) return null;
  const kinds = x.kinds as string[]; const removed = x.removed as number[];
  // the remaining faces must still pair up, or the board could never be cleared
  const cnt = new Map<string, number>(); kinds.forEach((k, i) => { if (!removed.includes(i)) { const g = KIND_BY_ID.get(k)!.group; cnt.set(g, (cnt.get(g) ?? 0) + 1); } });
  if ([...cnt.values()].some((c) => c % 2)) return null;
  const history = Array.isArray(x.history) ? x.history.filter((p): p is [number, number] => Array.isArray(p) && p.length === 2 && p.every((v) => removed.includes(v as number))) : [];
  return { level: lv, kinds, removed, history, t: int(x.t, 0, 0, 359999), hints: int(x.hints, 0, 0, 99), shuffles: int(x.shuffles, 0, 0, 99), undos: int(x.undos, 0, 0, 999), undoBonus: int(x.undoBonus, 0, 0, 999), score: int(x.score, 0, 0, 1e7), legends: int(x.legends, 0, 0, 1), maxCombo: int(x.maxCombo, 0, 0, 999) };
}
const SHELVES = SHELF_ITEMS;
/** Type-check every field of a parsed save; never throws. */
export function sanitize(x: unknown): Save {
  const i = isObj(x) ? x : {}; const s = defaults();
  if (isObj(i.stars)) for (const [k, v] of Object.entries(i.stars)) { const n = Number(k); if (Number.isInteger(n) && n >= 0 && n < ALL_LEVELS.length && typeof v === 'number') { const st = int(v, 0, 0, 3); if (st) s.stars[n] = st; } }
  if (isObj(i.best)) for (const [k, v] of Object.entries(i.best)) { if ((/^\d{1,2}$/.test(k) && +k < 30) || (k[0] === 'd' && isDay(k.slice(1)))) { const b = int(v, -1, 0, 1e7); if (b >= 0) s.best[k] = b; } }
  s.settings = migrateSettings(i.settings); s.seenHowTo = bool(i.seenHowTo, false); if (i.seenUndo === true) s.seenUndo = true;
  s.stats = stats(i.stats);
  s.ach = Array.isArray(i.ach) ? [...new Set(i.ach.filter((a): a is string => typeof a === 'string' && ACHIEVEMENTS.some((x) => x.id === a)))] : [];
  s.owned = Array.isArray(i.owned) ? [...new Set(i.owned.filter((o): o is string => { if (typeof o !== 'string') return false; const [sh, id] = o.split(':'); return has(SHELVES, sh) && SHELVES[sh as keyof typeof SHELVES].some((it) => it.id === id && !it.legend); }))] : [];
  if (s.stats.legends > 0 && !s.owned.includes('o:capydindon')) s.owned.push('o:capydindon');
  s.carrots = int(i.carrots, 0, 0, 1e7);
  const owned = (sh: keyof typeof SHELVES, id: unknown) => typeof id === 'string' && SHELVES[sh].some((it) => it.id === id && (it.price === 0 && !it.legend || s.owned.includes(`${sh}:${id}`)));
  s.outfit = owned('o', i.outfit) ? i.outfit as string : 'agrume'; s.theme = owned('t', i.theme) ? i.theme as Theme : 'capy'; s.bg = owned('b', i.bg) ? i.bg as string : 'monde'; s.edge = owned('k', i.edge) ? i.edge as string : 'bois';
  s.decor = Array.isArray(i.decor) ? [...new Set(i.decor.filter((d): d is string => typeof d === 'string' && DECOR.some((x) => x.id === d) && s.owned.includes(`d:${d}`)))] : [];
  s.diff = DIFFS.some((d) => d.id === i.diff) ? i.diff as Diff : 'moyen';
  s.run = run(i.run);
  if (isDay(i.firstDay)) s.firstDay = i.firstDay;
  return s;
}

// ---------- persistence: backup copy, never silently overwrite an unreadable save
export type LoadStatus = 'new' | 'ok' | 'backup' | 'lost';
export interface Loaded { save: Save; status: LoadStatus }
const ls = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };
const parse = (raw: string | null): unknown => { if (!raw) return undefined; try { const v = JSON.parse(raw); return isObj(v) ? v : undefined; } catch { return undefined; } };
/** Load the save. Unreadable → previous good copy (backup); the unreadable text is kept aside under CORRUPT_KEY, never thrown away. */
export function loadSave(): Loaded {
  const st = ls(); if (!st) return { save: defaults(), status: 'new' };
  let raw: string | null = null; try { raw = st.getItem(KEY); } catch { /* blocked */ }
  const main = parse(raw);
  if (main) { try { st.setItem(BACKUP_KEY, raw!); } catch { /* quota */ } return { save: sanitize(main), status: 'ok' }; }
  let bak: string | null = null; try { bak = st.getItem(BACKUP_KEY); } catch { /* blocked */ }
  if (raw) { try { st.setItem(CORRUPT_KEY, raw); } catch { /* quota */ } }
  const b = parse(bak);
  if (b) return { save: sanitize(b), status: raw ? 'backup' : 'ok' };
  return { save: defaults(), status: raw ? 'lost' : 'new' };
}
export const load = (): Save => loadSave().save;
let lastBak = 0;
/** Write the save; returns false when the browser refused (quota, private mode). Refreshes the backup at most once a minute. */
export const save = (s: Save): boolean => {
  const st = ls(); if (!st) return false;
  try { const j = JSON.stringify(s); st.setItem(KEY, j); if (Date.now() - lastBak > 60_000) { lastBak = Date.now(); try { st.setItem(BACKUP_KEY, j); } catch { /* quota */ } } return true; } catch { return false; }
};
export const reset = (): Save => { const st = ls(); try { st?.removeItem(KEY); st?.removeItem(BACKUP_KEY); } catch { /* blocked */ } return defaults(); };
// ---------- save code: the whole save as a copy-paste text (Safari may erase site data after 7 days without a visit)
const CODE_PREFIX = 'CAPY1-';
const b64 = (txt: string) => { const bytes = new TextEncoder().encode(txt); let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); }); return btoa(bin); };
const unb64 = (b: string) => new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(b), (ch) => ch.charCodeAt(0)));
/** Export: 'CAPY1-' + base64(JSON) + '-' + checksum (detects a truncated or mistyped paste). The in-progress board is left out. */
export function exportCode(s: Save): string { const body = b64(JSON.stringify({ ...s, run: null })); return `${CODE_PREFIX}${body}-${hash(body).toString(36)}`; }
/** Import a save code. Returns the validated save, or a French reason why the code was refused. Never throws. */
export function importCode(text: string): { save: Save } | { error: string } {
  const t = (text ?? '').replace(/\s+/g, '');
  if (!t) return { error: 'Colle d\'abord ton code de sauvegarde.' };
  if (!t.startsWith(CODE_PREFIX)) return { error: 'Ce n\'est pas un code de sauvegarde Mahjong Capybaras.' };
  const m = /^CAPY1-([A-Za-z0-9+/=]{8,400000})-([0-9a-z]{1,8})$/.exec(t); if (!m) return { error: 'Code incomplet : copie-le en entier.' };
  if (hash(m[1]).toString(36) !== m[2]) return { error: 'Code abîmé : une partie manque ou a été modifiée.' };
  let data: unknown; try { data = JSON.parse(unb64(m[1])); } catch { return { error: 'Code illisible.' }; }
  if (!isObj(data) || !isObj(data.stats) || !isObj(data.settings)) return { error: 'Code illisible.' };
  return { save: sanitize(data) };
}
/** Stars earned in a world's 6 campaign levels (secret level not counted). */
export const worldStars = (s: Save, w: number) => LEVELS.filter((l) => l.world === w).reduce((a, l) => a + (s.stars[l.n] ?? 0), 0);
export const unlocked = (s: Save, n: number) => (n >= LEVELS.length ? worldStars(s, n - LEVELS.length) >= SECRET_STARS : n === 0 || (s.stars[n - 1] ?? 0) > 0);
export const totalStars = (s: Save) => Object.values(s.stars).reduce((a, b) => a + b, 0);
