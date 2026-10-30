import { describe, expect, test } from 'vitest';
import { SONGS, DEFAULT_MUSIC, DEFAULT_SFX } from '../src/audio';
import { migrateSettings } from '../src/storage';

describe('lo-fi songs', () => {
  test('one song per world, every chord parses into a playable voicing', () => {
    expect(SONGS).toHaveLength(5);
    for (const s of SONGS) {
      expect(s.bpm).toBeGreaterThanOrEqual(60); expect(s.bpm).toBeLessThanOrEqual(85);
      for (const c of [...s.A, ...s.B]) {
        expect(Number.isInteger(c.root)).toBe(true);
        expect(c.notes.length).toBeGreaterThanOrEqual(3);
        for (const n of c.notes) { expect(n).toBeGreaterThanOrEqual(53); expect(n).toBeLessThanOrEqual(72); }
      }
    }
  });
});

describe('settings migration', () => {
  test('old saves without volumes get the new softer defaults', () => {
    const s = migrateSettings({ sfx: false, music: true, dim: true, vibrate: false });
    expect(s.musicVol).toBe(DEFAULT_MUSIC); expect(s.sfxVol).toBe(DEFAULT_SFX);
    expect(s.sfx).toBe(false); expect(s.hl).toBe(true);
  });
  test('volumes the player chose are kept, invalid ones are repaired', () => {
    expect(migrateSettings({ musicVol: 0.2, sfxVol: 1 })).toMatchObject({ musicVol: 0.2, sfxVol: 1 });
    expect(migrateSettings({ musicVol: 'x', sfxVol: 7 })).toMatchObject({ musicVol: DEFAULT_MUSIC, sfxVol: 1 });
    expect(migrateSettings(null).musicVol).toBe(DEFAULT_MUSIC);
  });
});
