import type { ThemePlay } from '../kit';
import { mtof, near } from '../phrase';

/** Snow porch: music-box bells and a felt piano. A kick only every other bar. */
export const play: ThemePlay = (kit, h) => {
  const { beat: b, time: t, eighth: e, chord: ch, rng } = h;
  const root = 36 + ch.root;
  const even = h.absBar % 2 === 0;
  if (b === 0) {
    kit.bell(mtof(ch.notes[ch.notes.length - 1] + 12), t, e * 6, 0.08, 0.18);
    kit.felt(mtof(ch.notes[0]), t, e * 7, 0.07, -0.12);
    if (even) kit.bass(mtof(root), t, e * 6, 0.042);
    if (even) kit.kick(t, 0.1);
  }
  if (b === 5 && rng() < 0.5) kit.bell(mtof((ch.notes[1] ?? ch.notes[0]) + 12), t, e * 4, 0.04, 0.28);
  if (h.sec === 2 && (b === 0 || b === 3 || b === 6)) kit.bell(mtof(near(h, 79, 91)), t, e * 2.2, 0.038, 0.22);
};
