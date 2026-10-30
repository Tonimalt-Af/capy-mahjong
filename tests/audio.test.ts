import { describe, expect, test } from 'vitest';
import { SONGS, DEFAULT_MUSIC, DEFAULT_SFX } from '../src/audio';
import { migrateSettings, SETTINGS_V } from '../src/storage';

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
  test('pair highlight is off by default and switched off once for older saves', () => {
    expect(migrateSettings(null)).toMatchObject({ hl: false, v: SETTINGS_V });
    expect(migrateSettings({ hl: true })).toMatchObject({ hl: false, v: SETTINGS_V });
    expect(migrateSettings({ hl: true, v: 1 }).hl).toBe(false);
    // re-enabled after the migration: kept, and stays kept on later loads
    const again = migrateSettings({ ...migrateSettings({ hl: true }), hl: true });
    expect(again.hl).toBe(true); expect(migrateSettings(JSON.parse(JSON.stringify(again))).hl).toBe(true);
    expect(migrateSettings({ hl: false, v: 2 }).hl).toBe(false);
  });
  test('old saves without volumes get the new softer defaults', () => {
    const s = migrateSettings({ sfx: false, music: true, dim: true, vibrate: false });
    expect(s.musicVol).toBe(DEFAULT_MUSIC); expect(s.sfxVol).toBe(DEFAULT_SFX);
    expect(s.sfx).toBe(false); expect(s.hl).toBe(false);
  });
  test('volumes the player chose are kept, invalid ones are repaired', () => {
    expect(migrateSettings({ musicVol: 0.2, sfxVol: 1 })).toMatchObject({ musicVol: 0.2, sfxVol: 1 });
    expect(migrateSettings({ musicVol: 'x', sfxVol: 7 })).toMatchObject({ musicVol: DEFAULT_MUSIC, sfxVol: 1 });
    expect(migrateSettings(null).musicVol).toBe(DEFAULT_MUSIC);
  });
});
