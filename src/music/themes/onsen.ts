import type { ThemePlay } from '../kit';
import { mtof, near } from '../phrase';

/** Evening steam: Rhodes, a warm pad, finger snaps instead of a kit. */
export const play: ThemePlay = (kit, h) => {
  const { beat: b, time: t, eighth: e, chord: ch, rng } = h;
  const root = 36 + ch.root;
  if (b === 0) {
    ch.notes.forEach((m, i) => kit.ep(mtof(m), t + i * 0.022, e * 7.2, 0.075, (i - 1.5) * 0.2));
    kit.pad(mtof(ch.notes[0] - 12), t, e * 8, 0.03);
    kit.pad(mtof(ch.notes[Math.min(2, ch.notes.length - 1)]), t, e * 8, 0.022);
    kit.bass(mtof(root), t, e * 5.5, 0.064);
  }
  if ((b === 2 || b === 6) && rng() < 0.85) kit.snap(t, 0.07);
  if (b === 7 && rng() < 0.55) {
    const nr = 36 + h.next.root;
    kit.bass(mtof(nr + (nr >= root ? -1 : 2)), t, e * 0.9, 0.046);
  }
  if (h.sec === 2 && (b === 0 || b === 4)) kit.flute(mtof(near(h, 70, 83)), t, e * 3.2, 0.04);
};
