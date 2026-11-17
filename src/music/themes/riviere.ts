import type { ThemePlay } from '../kit';
import { mtof, near } from '../phrase';

/** Morning current: nylon guitar, soft hats, a little flute. No backbeat snare. */
export const play: ThemePlay = (kit, h) => {
  const { beat: b, time: t, eighth: e, chord: ch, rng } = h;
  const root = 36 + ch.root;
  if (b === 0) ch.notes.forEach((m, i) => kit.guitar(mtof(m), t + i * 0.016, e * 6.5, 0.085, (i - 1.5) * 0.18));
  if (b === 4 && rng() < 0.75) ch.notes.slice(1, 4).forEach((m, i) => kit.guitar(mtof(m), t + i * 0.014, e * 3, 0.045, 0.16));
  if (b === 0) kit.bass(mtof(root), t, e * 3, 0.068);
  if (b === 3) kit.bass(mtof(root + (rng() < 0.5 ? 7 : 12)), t, e * 1.5, 0.05);
  if (b === 0) kit.kick(t, 0.18);
  if (b === 5 && rng() < 0.45) kit.kick(t, 0.1);
  if (b === 2 || b === 6) kit.mallet(mtof(ch.notes[0] + 12), t, e * 0.8, 0.028, 0.05);
  if (b % 2 === 1) kit.hat(t, 0.026);
  if ((h.sec === 1 || h.sec === 2) && (b === 0 || b === 3 || b === 5)) kit.flute(mtof(near(h, 72, 86)), t, e * 2.4, 0.055);
};
