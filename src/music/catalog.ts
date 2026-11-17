// Original lo-fi themes for Capy Mahjong. Note data and arrangements are written for this game
// and synthesized in the browser (Web Audio). No samples, no third-party recordings.
// See LICENSES.md.

export const THEME_IDS = ['riviere', 'onsen', 'foret', 'montagne', 'temple', 'brume'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export interface Chord { root: number; notes: number[] }

export interface ThemeSpec {
  id: ThemeId;
  /** World or mode name shown to players */
  name: string;
  /** Piece title */
  title: string;
  mood: string;
  /** Lead voice, unique per theme */
  lead: string;
  bpm: number;
  key: string;
  keyPc: number;
  /** Off-beat delay as a fraction of an eighth note. 0 = straight. */
  swing: number;
  /** Bars in the harmonic loop. Bar 0 and bar `bars` are the same chord. */
  bars: number;
  /** Loudness trim so a sparser arrangement sits with the others. Crossfades scale it. */
  level: number;
  A: Chord[];
  B: Chord[];
}

const PC: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, Ab: 8, A: 9, Bb: 10, B: 11 };
const QUAL: Record<string, number[]> = {
  maj9: [4, 7, 11, 14], m9: [3, 7, 10, 14], '13': [4, 10, 14, 21], m11: [3, 7, 10, 17],
  '7b9': [4, 10, 13, 19], '69': [4, 9, 14, 19], maj7: [4, 7, 11, 16], m7: [3, 7, 10, 15],
};

export function parseChord(s: string): Chord {
  const [r, q] = s.split(':');
  const root = PC[r];
  if (root === undefined || !QUAL[q]) throw new Error('bad chord ' + s);
  const notes = QUAL[q].map((iv) => {
    let n = 48 + root + iv;
    while (n < 53) n += 12;
    while (n > 72) n -= 12;
    return n;
  }).sort((a, b) => a - b);
  return { root, notes: [...new Set(notes)] };
}

function theme(p: Omit<ThemeSpec, 'keyPc' | 'A' | 'B' | 'bars' | 'level'> & { A: string; B: string; bars?: number; level?: number }): ThemeSpec {
  return { ...p, bars: p.bars ?? 16, level: p.level ?? 1, keyPc: PC[p.key], A: p.A.split(' ').map(parseChord), B: p.B.split(' ').map(parseChord) };
}

export const THEMES: ThemeSpec[] = [
  theme({ id: 'riviere', name: 'Rivière', title: 'Courant du matin', mood: 'clair, fluide, un peu balancé', lead: 'guitar', bpm: 76, key: 'C', swing: 0.18, level: 1.7, A: 'D:m9 G:13 C:maj9 A:m9', B: 'F:maj9 E:m7 D:m9 G:13' }),
  theme({ id: 'onsen', name: 'Onsen', title: 'Bain du soir', mood: 'chaud, lent, vaporeux', lead: 'ep', bpm: 63, key: 'F', swing: 0.22, level: 1.25, A: 'G:m9 C:13 F:maj9 D:m9', B: 'Bb:maj9 A:m7 G:m9 C:7b9' }),
  theme({ id: 'foret', name: 'Forêt', title: 'Sentier moussu', mood: 'vif, boisé, sautillant', lead: 'mallet', bpm: 86, key: 'G', swing: 0.08, level: 2, A: 'E:m9 A:m9 D:13 G:maj9', B: 'C:maj9 A:m9 D:13 B:m7' }),
  theme({ id: 'montagne', name: 'Montagne', title: 'Porche enneigé', mood: 'aéré, rare, feutré', lead: 'bell', bpm: 60, key: 'D', swing: 0, level: 3.4, A: 'D:maj9 B:m9 E:m9 A:13', B: 'G:maj9 F#:m7 E:m11 A:7b9' }),
  theme({ id: 'temple', name: 'Temple', title: 'Lanternes', mood: 'posé, doré, pentatonique', lead: 'koto', bpm: 70, key: 'E', swing: 0, level: 2.4, A: 'C#:m9 F#:m9 B:13 E:maj9', B: 'A:maj9 F#:m11 B:13 G#:m7' }),
  theme({ id: 'brume', name: 'Brume', title: 'Brume zen', mood: 'calme, presque sans batterie', lead: 'felt', bpm: 66, key: 'A', swing: 0, level: 3.2, A: 'A:m9 D:m9 A:m9 E:m9', B: 'F:maj9 C:maj9 D:m9 E:m7' }),
];

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));
export const themeById = (id: ThemeId): ThemeSpec => BY_ID.get(id)!;

export function isThemeId(x: string): x is ThemeId {
  return (THEME_IDS as readonly string[]).includes(x);
}

/** Chord sounding on absolute bar `absBar`. The pattern loops every `spec.bars` bars. */
export function chordAt(spec: ThemeSpec, absBar: number): { chord: Chord; next: Chord; sec: number } {
  const bar = ((absBar % spec.bars) + spec.bars) % spec.bars;
  const sec = Math.floor(bar / 4);
  const prog = sec % 2 === 0 ? spec.A : spec.B;
  return { chord: prog[bar % 4], next: prog[(bar + 1) % 4], sec };
}
