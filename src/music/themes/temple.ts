import type { ThemePlay } from '../kit';
import { mtof, near } from '../phrase';

/** Lanterns: koto figures over a singing bowl, a soft pulse on 1. Straight time. */
export const play: ThemePlay = (kit, h) => {
  const { beat: b, time: t, eighth: e, chord: ch } = h;
  const root = 36 + ch.root;
  if (b === 0) {
    ch.notes.forEach((m, i) => kit.koto(mtof(m + 12), t + i * 0.048, e * 2, 0.08 - i * 0.008, 0.12));
    // a quiet bowl on every bar, so the loop never opens a hole between downbeats
    kit.bowl(mtof(root + 12), t, e * 10, 0.034);
    kit.pad(mtof(ch.notes[0]), t, e * 8, 0.018);
  }
  if (b === 4) [...ch.notes].reverse().slice(0, 3).forEach((m, i) => kit.koto(mtof(m + 12), t + i * 0.042, e * 1.5, 0.05, -0.08));
  if (b === 0) kit.kick(t, 0.14);
  if ((h.sec === 1 || h.sec === 3) && (b === 0 || b === 2 || b === 5)) kit.koto(mtof(near(h, 72, 88)), t, e * 1.5, 0.06, 0.04);
};
