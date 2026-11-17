import type { ThemePlay } from '../kit';
import { mtof, near } from '../phrase';

/** Moss path: broken mallets, short pizzicato bass, a shaker. */
export const play: ThemePlay = (kit, h) => {
  const { beat: b, time: t, eighth: e, chord: ch } = h;
  const root = 36 + ch.root;
  if (b === 0 || b === 2 || b === 5) {
    const m = ch.notes[b === 0 ? 0 : b === 2 ? Math.min(1, ch.notes.length - 1) : Math.min(2, ch.notes.length - 1)];
    kit.mallet(mtof(m), t, e * 1.8, b === 0 ? 0.09 : 0.06, (b - 3) * 0.06);
  }
  if (b === 0) kit.bass(mtof(root), t, e * 1.15, 0.06);
  if (b === 3) kit.bass(mtof(root + 12), t, e * 0.9, 0.048);
  if (b % 2 === 0) kit.shaker(t, b === 0 ? 0.04 : 0.026);
  if (b === 0) kit.kick(t, 0.16);
  if (b === 4) kit.snare(t, 0.07);
  if (h.sec !== 0 && (b === 1 || b === 4 || b === 6)) kit.flute(mtof(near(h, 74, 88)), t, e * 1.4, 0.05);
};
