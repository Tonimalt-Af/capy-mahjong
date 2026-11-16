import type { Chord, ThemeSpec } from './catalog';

export interface Memory { mel: number }

export interface Hit {
  time: number;
  eighth: number;
  step: number;
  beat: number;
  bar: number;
  absBar: number;
  cycle: number;
  sec: number;
  chord: Chord;
  next: Chord;
  spec: ThemeSpec;
  rng: () => number;
  mem: Memory;
}

export interface Kit {
  ep(f: number, t: number, dur: number, vel: number, pan: number): void;
  bass(f: number, t: number, dur: number, vel: number): void;
  kick(t: number, vel: number): void;
  snare(t: number, vel: number): void;
  hat(t: number, vel: number): void;
  mallet(f: number, t: number, dur: number, vel: number, pan: number): void;
  guitar(f: number, t: number, dur: number, vel: number, pan: number): void;
  pad(f: number, t: number, dur: number, vel: number): void;
  bell(f: number, t: number, dur: number, vel: number, pan: number): void;
  koto(f: number, t: number, dur: number, vel: number, pan: number): void;
  bowl(f: number, t: number, dur: number, vel: number): void;
  snap(t: number, vel: number): void;
  shaker(t: number, vel: number): void;
  flute(f: number, t: number, dur: number, vel: number): void;
  felt(f: number, t: number, dur: number, vel: number, pan: number): void;
}

export type ThemePlay = (kit: Kit, hit: Hit) => void;
