// Which theme plays where. Pure: no audio graph, so the menu / world / mode rules are unit-tested.
import { THEME_IDS, type ThemeId } from './catalog';

/** Home, modes, collection, and the level map's "back to menu" share the river theme (the boot palette). */
export const MENU_THEME: ThemeId = 'riviere';
/** Zen stays on one still theme instead of following the board's random palette. */
export const ZEN_THEME: ThemeId = 'brume';
/** Endless keeps a theme for this many rounds, then crossfades to the next. */
export const ENDLESS_EVERY = 3;
/** Campaign worlds, in WORLDS order. */
export const WORLD_THEMES: readonly ThemeId[] = ['riviere', 'onsen', 'foret', 'montagne', 'temple'];

export type Screen = 'home' | 'modes' | 'coll' | 'map' | 'game';
export type PlayMode = 'level' | 'daily' | 'endless' | 'zen';

export function themeForWorld(world: number): ThemeId {
  const n = WORLD_THEMES.length;
  const i = ((Math.trunc(world) % n) + n) % n;
  return WORLD_THEMES[i];
}

export function themeForPlay(p: { mode: PlayMode; world: number; round?: number }): ThemeId {
  if (p.mode === 'zen') return ZEN_THEME;
  if (p.mode === 'endless') {
    const round = p.round == null || !Number.isFinite(p.round) || p.round < 0 ? 0 : Math.floor(p.round);
    return THEME_IDS[Math.floor(round / ENDLESS_EVERY) % THEME_IDS.length];
  }
  // Campaign levels and the daily challenge follow the board's world.
  // A daily's world is hashed from the date, so the same day keeps the same theme.
  return themeForWorld(p.world);
}

export function themeForContext(c: { screen: Screen; world?: number; mode?: PlayMode; round?: number }): ThemeId {
  if (c.screen === 'map') return themeForWorld(c.world ?? 0);
  if (c.screen === 'game') return themeForPlay({ mode: c.mode ?? 'level', world: c.world ?? 0, round: c.round });
  return MENU_THEME;
}
