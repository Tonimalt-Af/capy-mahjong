import { NEW_STATS, type Stats, type Diff } from './meta';
import type { Theme } from './tiles';
import type { PlayLevel } from './meta';
/** In-progress board, saved after every move so an interrupted game can be resumed. */
export interface Run { level: PlayLevel; kinds: string[]; removed: number[]; history: [number, number][]; t: number; hints: number; shuffles: number; undos: number; undoBonus?: number; score: number; legends: number; maxCombo: number }
const KEY = 'capy-mahjong-v1';
export interface Save { stars: Record<number, number>; best: Record<number, number>; settings: { sfx: boolean; music: boolean; dim: boolean; vibrate: boolean; hl: boolean; autohint: boolean }; seenHowTo: boolean; seenUndo?: boolean; stats: Stats; ach: string[]; outfit: string; carrots: number; owned: string[]; theme: Theme; bg: string; diff: Diff; run: Run | null }
const DEF: Save = { stars: {}, best: {}, settings: { sfx: true, music: true, dim: true, vibrate: true, hl: true, autohint: false }, seenHowTo: false, stats: NEW_STATS(), ach: [], outfit: 'agrume', carrots: 0, owned: [], theme: 'capy', bg: 'monde', diff: 'moyen', run: null };
export function load(): Save {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) return { ...DEF, ...s, settings: { ...DEF.settings, ...s.settings }, stats: { ...NEW_STATS(), ...s.stats }, ach: s.ach ?? [], owned: s.owned ?? [] }; } catch { /* corrupted save */ }
  return structuredClone(DEF);
}
export const save = (s: Save) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota / private mode */ } };
export const reset = (): Save => { localStorage.removeItem(KEY); return structuredClone(DEF); };
export const unlocked = (s: Save, n: number) => n === 0 || (s.stars[n - 1] ?? 0) > 0;
export const totalStars = (s: Save) => Object.values(s.stars).reduce((a, b) => a + b, 0);
