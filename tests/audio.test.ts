import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { DEFAULT_MUSIC, DEFAULT_SFX } from '../src/audio';
import { THEME_IDS } from '../src/music/catalog';
import { migrateSettings, SETTINGS_V } from '../src/storage';

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

describe('music bundle', () => {
  test('each theme is a separate lazy chunk, not a static import', () => {
    const src = readFileSync(new URL('../src/audio.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/import\s+[^;]*music\/themes\//);
    for (const id of THEME_IDS) expect(src).toContain(`themes/${id}`);
    expect(src).toContain("import('./music/voices')");
  });
});
