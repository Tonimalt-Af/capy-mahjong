import { NEW_STATS, type Stats, type Diff } from './meta';
import type { Theme } from './tiles';
import type { PlayLevel } from './meta';
/** In-progress board, saved after every move so an interrupted game can be resumed. */
export interface Run { level: PlayLevel; kinds: string[]; removed: number[]; history: [number, number][]; t: number; hints: number; shuffles: number; undos: number; undoBonus?: number; score: number; legends: number; maxCombo: number }
const KEY = 'capy-mahjong-v1';
export interface Save { stars: Record<number, number>; best: Record<number, number>; settings: { sfx: boolean; music: boolean; musicVol: number; sfxVol: number; dim: boolean; vibrate: boolean; hl: boolean; autohint: boolean; v?: number }; seenHowTo: boolean; seenUndo?: boolean; stats: Stats; ach: string[]; outfit: string; carrots: number; owned: string[]; theme: Theme; bg: string; diff: Diff; run: Run | null }
/** Settings schema version. v2: pair highlight ("Montrer les paires possibles") is off by default; older saves are switched off once. */
export const SETTINGS_V = 2;
/** Merge saved settings over defaults; volumes missing or invalid in older saves fall back to the new softer defaults. */
export function migrateSettings(x: unknown): Save['settings'] {
  const o = { ...DEF.settings, ...(x && typeof x === 'object' ? x : {}) } as Save['settings'];
  const vol = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d);
  o.musicVol = vol(o.musicVol, DEF.settings.musicVol); o.sfxVol = vol(o.sfxVol, DEF.settings.sfxVol);
  const from = x && typeof x === 'object' && typeof (x as { v?: unknown }).v === 'number' ? (x as { v: number }).v : 1;
  if (from < 2) o.hl = false; // one-time switch-off; a player who turns it back on keeps it (v is now 2)
  o.hl = !!o.hl; o.v = SETTINGS_V;
  return o;
}
const DEF: Save = { stars: {}, best: {}, settings: { sfx: true, music: true, musicVol: 0.45, sfxVol: 0.6, dim: true, vibrate: true, hl: false, autohint: false, v: SETTINGS_V }, seenHowTo: false, stats: NEW_STATS(), ach: [], outfit: 'agrume', carrots: 0, owned: [], theme: 'capy', bg: 'monde', diff: 'moyen', run: null };
export function load(): Save {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) return { ...DEF, ...s, settings: migrateSettings(s.settings), stats: { ...NEW_STATS(), ...s.stats }, ach: s.ach ?? [], owned: s.owned ?? [] }; } catch { /* corrupted save */ }
  return structuredClone(DEF);
}
export const save = (s: Save) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota / private mode */ } };
export const reset = (): Save => { localStorage.removeItem(KEY); return structuredClone(DEF); };
export const unlocked = (s: Save, n: number) => n === 0 || (s.stars[n - 1] ?? 0) > 0;
export const totalStars = (s: Save) => Object.values(s.stars).reduce((a, b) => a + b, 0);
