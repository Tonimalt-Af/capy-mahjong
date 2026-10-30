// Shared links (?level=, ?mode=daily|zen|endless). Pure parsing + validation: anything malformed is ignored, never thrown.
import { LAYOUTS, ALL_LEVELS } from './levels';
import { DIFFS, type Diff } from './meta';
import { isDay } from './dates';

export type Deep =
  | { kind: 'level'; n: number }
  | { kind: 'daily'; day?: string }
  | { kind: 'zen'; seed: number; diff: Diff; layout?: string; legend: boolean }
  | { kind: 'endless' };
const uint = (v: string | null, max: number) => (v !== null && /^\d{1,10}$/.test(v) && +v <= max ? +v : null);

/** Returns the requested action, or null when there is no (valid) deep link. `bad` is true for a malformed link. */
export function parseDeep(search: string): { deep: Deep | null; bad: boolean } {
  const q = new URLSearchParams(search); const mode = q.get('mode');
  if (q.has('level')) { const n = uint(q.get('level'), ALL_LEVELS.length - 1); return n === null ? { deep: null, bad: true } : { deep: { kind: 'level', n }, bad: false }; }
  if (mode === 'daily') { const d = q.get('day'); if (d === null) return { deep: { kind: 'daily' }, bad: false }; return isDay(d) ? { deep: { kind: 'daily', day: d }, bad: false } : { deep: { kind: 'daily' }, bad: true }; }
  if (mode === 'zen') {
    const seed = q.has('seed') ? uint(q.get('seed'), 2 ** 32 - 1) : 1; const dq = q.get('diff'); const lay = q.get('layout');
    const diff = DIFFS.find((d) => d.id === dq)?.id; const layOk = lay === null || Object.hasOwn(LAYOUTS, lay);
    if (seed === null || (dq !== null && !diff) || !layOk) return { deep: null, bad: true };
    return { deep: { kind: 'zen', seed, diff: diff ?? 'moyen', layout: lay ?? undefined, legend: q.has('legend') }, bad: false };
  }
  if (mode === 'endless') return { deep: { kind: 'endless' }, bad: false }; // always from round 1 (a round number in the URL is ignored)
  return { deep: null, bad: mode !== null };
}
