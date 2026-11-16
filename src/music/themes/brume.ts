import type { ThemePlay } from '../kit';
import { mtof, near } from '../phrase';

/** Zen mist: felt piano and a bowl. No drums, so the loop is mostly space. */
export const play: ThemePlay = (kit, h) => {
  const { beat: b, time: t, eighth: e, chord: ch, rng } = h;
  if (b === 0) {
    kit.felt(mtof(ch.notes[0]), t, e * 7.5, 0.08, -0.08);
    if (rng() < 0.85) kit.felt(mtof(ch.notes[Math.min(2, ch.notes.length - 1)]), t + 0.04, e * 6, 0.048, 0.14);
  }
  if (b === 5 && h.sec >= 2 && rng() < 0.7) kit.felt(mtof(near(h, 72, 84)), t, e * 4, 0.04, 0.22);
  if (h.absBar % 2 === 0 && b === 0) kit.bowl(mtof(48 + ch.root), t, e * 10, 0.032);
};
