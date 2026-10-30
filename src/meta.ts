// Meta-progression: modes (daily / endless / zen), outfits, achievements, statistics. Pure logic → unit-tested.
import { LAYOUTS, type Level } from './levels';
import { fairSeed } from './engine';

export type Mode = 'level' | 'daily' | 'endless' | 'zen';
export interface PlayLevel extends Level { mode: Mode; title: string; round?: number; date?: string; diff?: Diff; legend: number; /** a past daily replayed from the calendar */ late?: boolean }

export interface Stats { played: number; won: number; pairs: number; seconds: number; bestCombo: number; perfect: number; hintsUsed: number; dailyDone: string[]; dailyLate: string[]; dailyStreak: number; bestStreak: number; endlessBest: number; zenWon: number; legends: number; carrotsEarned: number; expertWon: number; shapes: number; fastest: number }
export const NEW_STATS = (): Stats => ({ played: 0, won: 0, pairs: 0, seconds: 0, bestCombo: 0, perfect: 0, hintsUsed: 0, dailyDone: [], dailyLate: [], dailyStreak: 0, bestStreak: 0, endlessBest: 0, zenWon: 0, legends: 0, carrotsEarned: 0, expertWon: 0, shapes: 0, fastest: 0 });

/** FNV-1a string hash → 32-bit seed */
export const hash = (s: string) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
import { dayKey, addDays } from './dates';
export { dayKey };
const prevDay = (k: string) => { const [y, m, d] = k.split('-').map(Number); return dayKey(new Date(y, m - 1, d - 1)); };

const DAILY_LAYOUTS = ['pyramide', 'fleur', 'papillon', 'forteresse', 'montagne', 'tortue', 'coeur', 'chat', 'ours', 'etoile', 'champignon', 'capy'];
/** Phase 3: from 31 Oct 2026 the daily draws from 30 boards (64+ tiles). Earlier days keep their board (calendar replays, shares). */
const DAILY_LAYOUTS_2 = ['pyramide', 'yuzu', 'nenuphar', 'fleur', 'sapin', 'tasse', 'coeur', 'etoile', 'feuille', 'bonhomme', 'papillon', 'ours', 'nuage', 'lanterne', 'chat', 'champignon',
  'chene', 'bassin', 'cabane', 'forteresse', 'herisson', 'torii', 'capy', 'escalier', 'eventail', 'sommets', 'montagne', 'refuge', 'pagode', 'tortue'];
const DAILY_POOL_SWITCH = '2026-10-31';
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const frDate = (k: string) => { const [, m, d] = k.split('-').map(Number); return `${d === 1 ? '1er' : d} ${MOIS[m - 1]}`; };

/** `min` < 0: use the seed as is (a shared link already carries the final, fair seed). */
const mk = (layout: string, seed: number, world: number, extra: Partial<PlayLevel> & { mode: Mode; title: string }, min = 0.4): PlayLevel => {
  const pos = LAYOUTS[layout].make(); const tiles = pos.length;
  return { n: -1, index: 0, world, layout, seed: min < 0 ? seed >>> 0 : fairSeed(pos, seed >>> 0, min), par: Math.round(tiles * (3.2 + world * 0.3)), hints: 2, shuffles: 2, undos: 5, legend: 0.1, ...extra };
};
/** Chance that the golden capydindon pair hides in a board (deterministic per seed). Steering 2026-10-30: rarer everywhere
 * (levels 20% → 8%, endless/zen 25% → 10%, daily 100% → 35%). */
export const LEVEL_LEGEND = 0.08;
export const DAILY_LEGEND = 0.35;

// ---------- difficulty (zen / free play), inspired by Microsoft Mahjong's 4 tiers
export type Diff = 'facile' | 'moyen' | 'difficile' | 'expert';
export const DIFFS: { id: Diff; name: string; pool: string[]; min: number; desc: string }[] = [
  { id: 'facile', name: 'Facile', pool: ['galet', 'carotte', 'pont', 'flocon', 'canard', 'pyramide', 'yuzu', 'nenuphar', 'papillon'], min: 0.7, desc: '36 à 84 tuiles' },
  { id: 'moyen', name: 'Moyen', pool: ['fleur', 'sapin', 'tasse', 'coeur', 'etoile', 'feuille', 'bonhomme', 'ours', 'nuage', 'lanterne', 'chat', 'champignon', 'chene'], min: 0.5, desc: '72 à 92 tuiles' },
  { id: 'difficile', name: 'Difficile', pool: ['bassin', 'cabane', 'forteresse', 'herisson', 'torii', 'capy', 'escalier', 'eventail', 'sommets', 'montagne'], min: 0.3, desc: '96 à 120 tuiles' },
  { id: 'expert', name: 'Expert', pool: ['tortue', 'pagode', 'refuge', 'capy', 'montagne', 'etoile'], min: 0, desc: 'Grands plateaux pièges' },
];
/** Same board for everyone on a given day. */
export function dailyLevel(key = dayKey(), late = false): PlayLevel {
  const h = hash('capy-daily-' + key);
  const pool = key >= DAILY_POOL_SWITCH ? DAILY_LAYOUTS_2 : DAILY_LAYOUTS;
  return mk(pool[h % pool.length], h, (h >>> 8) % 5, { mode: 'daily', title: `Défi du ${frDate(key)}`, date: key, hints: 1, shuffles: 1, legend: DAILY_LEGEND, ...(late ? { late: true, title: `Rattrapage · ${frDate(key)}` } : {}) });
}
/** Endless tiers: sizes never overlap between tiers, so boards only grow; each run draws its own board in each tier. */
export const ENDLESS_TIERS = [['galet'], ['carotte', 'pont', 'flocon'], ['canard', 'pyramide', 'yuzu', 'nenuphar'], ['fleur', 'sapin', 'tasse', 'coeur'],
  ['etoile', 'feuille', 'bonhomme', 'nuage', 'ours'], ['lanterne', 'chat', 'champignon', 'chene'], ['bassin', 'cabane', 'forteresse', 'herisson'],
  ['torii', 'capy', 'escalier', 'eventail'], ['sommets', 'montagne', 'refuge', 'pagode'], ['tortue']];
/** Endless run: boards grow with the round, world rotates. */
export function endlessLevel(round: number, seed: number): PlayLevel {
  const t = Math.min(ENDLESS_TIERS.length - 1, Math.floor(round / 2)); const tier = ENDLESS_TIERS[t];
  // two different boards per tier (smaller one first, so boards never shrink), a different mix every run
  const h = hash(`endless-${seed}-${t}`); const i = h % tier.length; const j = tier.length > 1 ? (i + 1 + ((h >>> 8) % (tier.length - 1))) % tier.length : i;
  const [a, b] = [tier[i], tier[j]].sort((x, y) => LAYOUTS[x].make().length - LAYOUTS[y].make().length);
  const layout = round % 2 ? b : a;
  return mk(layout, (seed + round * 7907) >>> 0, round % 5, { mode: 'endless', title: `Infini · manche ${round + 1}`, round, hints: round < 4 ? 2 : 1, shuffles: round < 6 ? 2 : 1 });
}
export function zenLevel(seed: number, diff: Diff = 'moyen'): PlayLevel {
  const D = DIFFS.find((d) => d.id === diff) ?? DIFFS[1]; const layout = D.pool[seed % D.pool.length];
  return mk(layout, seed, seed % 5, { mode: 'zen', title: `Zen ${D.name} · ${LAYOUTS[layout].name}`, hints: 99, shuffles: 99, undos: -1, diff: D.id }, D.min);
}
/** The exact board of a shared zen link: final seed + layout, no fairness re-pick → same board for everyone. */
export function zenShared(seed: number, diff: Diff, layout: string): PlayLevel {
  const D = DIFFS.find((d) => d.id === diff) ?? DIFFS[1];
  return mk(layout, seed, seed % 5, { mode: 'zen', title: `Zen ${D.name} · ${LAYOUTS[layout].name}`, hints: 99, shuffles: 99, undos: -1, diff: D.id }, -1);
}
/** Share link of a zen board (carries the final seed and layout). */
export const zenLink = (lv: PlayLevel) => `?mode=zen&seed=${lv.seed}&diff=${lv.diff ?? 'moyen'}&layout=${lv.layout}`;

/** Record a completed daily; returns updated streak. */
export function recordDaily(s: Stats, key: string) {
  if (s.dailyDone.includes(key)) return s.dailyStreak;
  s.dailyStreak = s.dailyDone.includes(prevDay(key)) ? s.dailyStreak + 1 : 1;
  s.dailyDone = [...s.dailyDone, key].slice(-400); s.bestStreak = Math.max(s.bestStreak, s.dailyStreak);
  return s.dailyStreak;
}
/** How far back missed dailies can be replayed from the calendar (a week: catching up, not farming). */
export const REPLAY_DAYS = 7;
/** Past days (newest first, within REPLAY_DAYS, and never before the player's first day) whose daily was neither won on the day nor replayed. */
export function missedDays(s: Stats, today = dayKey(), since?: string, span = REPLAY_DAYS) {
  const out: string[] = []; for (let i = 1; i <= span; i++) { const k = addDays(today, -i); if (since && k < since) break; if (!s.dailyDone.includes(k) && !s.dailyLate.includes(k)) out.push(k); } return out;
}
export const canReplay = (s: Stats, key: string, today = dayKey(), since?: string) => missedDays(s, today, since).includes(key);
/** First day of play for an existing save (set once): the earliest daily on record or, for anyone who has already played, a week ago; else today. */
export function firstDayOf(s: Stats, today = dayKey()) {
  const d = [...s.dailyDone, ...s.dailyLate].filter((k) => k < today).sort()[0];
  const cands = [d, s.played > 0 ? addDays(today, -REPLAY_DAYS) : undefined].filter((x): x is string => !!x).sort();
  return cands[0] ?? today;
}
/** A replayed past daily: marked on the calendar, but never touches the streak (no streak repair). */
export function recordLate(s: Stats, key: string) { if (!s.dailyLate.includes(key) && !s.dailyDone.includes(key)) s.dailyLate = [...s.dailyLate, key].slice(-400); }
/** Streak currently alive (today or yesterday done). */
export const liveStreak = (s: Stats, today = dayKey()) => (s.dailyDone.includes(today) || s.dailyDone.includes(prevDay(today)) ? s.dailyStreak : 0);

// ---------- carrots 🥕: free in-game currency, earned by playing, spent in the Collection
export interface Item { id: string; name: string; price: number; legend?: boolean; /** seasonal: on sale only during this month (1–12) and the next one, back every year */ month?: number }
/** Hero outfits (accessories + friend costumes). The capydindon costume can't be bought: find the legend. */
export const OUTFITS: Item[] = [
  { id: 'agrume', name: 'Yuzu', price: 0 }, { id: 'fraise', name: 'Fraise', price: 20 }, { id: 'feuille', name: 'Feuille', price: 30 },
  { id: 'lunettes', name: 'Lunettes de soleil', price: 40 }, { id: 'paille', name: 'Chapeau de paille', price: 50 }, { id: 'serviette', name: 'Serviette d\'onsen', price: 60 },
  { id: 'noeud', name: 'Nœud', price: 70 }, { id: 'bonnet', name: 'Bonnet', price: 80 }, { id: 'canard', name: 'Canard', price: 90 },
  { id: 'lotus', name: 'Lotus', price: 100 }, { id: 'tournesol', name: 'Tournesol', price: 110 }, { id: 'tulipe', name: 'Tulipe', price: 120 },
  { id: 'hibiscus', name: 'Hibiscus', price: 130 }, { id: 'printemps', name: 'Printemps', price: 140 }, { id: 'ete', name: 'Été', price: 150 },
  { id: 'automne', name: 'Automne', price: 160 }, { id: 'hiver', name: 'Hiver', price: 170 }, { id: 'couronne', name: 'Couronne royale', price: 250 },
  { id: 'chat', name: 'Costume chat noir', price: 200 }, { id: 'ours', name: 'Costume ourson', price: 200 },
  { id: 'capydindon', name: 'Capydindon légendaire', price: 0, legend: true },
  // seasonal (rotating shop): one per month, sold during its month and the next
  { id: 'galette', name: 'Couronne des rois', price: 180, month: 1 }, { id: 'crepe', name: 'Crêpe', price: 180, month: 2 },
  { id: 'parapluie', name: 'Parapluie', price: 200, month: 3 }, { id: 'cloche', name: 'Cloche en chocolat', price: 200, month: 4 },
  { id: 'muguet', name: 'Muguet', price: 180, month: 5 }, { id: 'cerises', name: 'Cerises', price: 180, month: 6 },
  { id: 'glace', name: 'Cornet de glace', price: 200, month: 7 }, { id: 'pasteque', name: 'Pastèque', price: 200, month: 8 },
  { id: 'pomme', name: 'Pomme de la rentrée', price: 180, month: 9 }, { id: 'citrouille', name: 'Citrouille', price: 220, month: 10 },
  { id: 'chataigne', name: 'Châtaigne', price: 180, month: 11 }, { id: 'noel', name: 'Bonnet de Noël', price: 220, month: 12 },
];
/** Is a seasonal item for sale on this day? (its month and the following one) */
export const onSale = (it: Item, today = dayKey()) => { if (!it.month) return true; const m = +today.slice(5, 7); return m === it.month || m === (it.month % 12) + 1; };
/** Seasonal items for sale right now, newest month first. */
export const seasonal = (today = dayKey()) => OUTFITS.filter((o) => o.month && onSale(o, today)).sort((a, b) => (+today.slice(5, 7) === a.month ? -1 : 0) - (+today.slice(5, 7) === b.month ? -1 : 0));
/** Tile sets: which animal plays each family. */
export const THEMES: Item[] = [
  { id: 'capy', name: 'Capybaras', price: 0 }, { id: 'menagerie', name: 'Ménagerie', price: 120 },
  { id: 'chat', name: 'Chats noirs', price: 250 }, { id: 'ours', name: 'Oursons', price: 250 },
];
/** Board backgrounds ('monde' follows the current world). */
export const BACKS: Item[] = [
  { id: 'monde', name: 'Selon le monde', price: 0 }, { id: 'nuit', name: 'Nuit étoilée', price: 150 },
  { id: 'sakura', name: 'Sakura', price: 150 }, { id: 'potiron', name: 'Potiron', price: 150 },
];
/** Tile backs: colour of the tile's back and of its visible edge on the board. */
export const EDGES: (Item & { side: string; side2: string; back: string })[] = [
  { id: 'bois', name: 'Bois clair', price: 0, side: '#E2BF8C', side2: '#C99A62', back: '#2FA4A9' },
  { id: 'jade', name: 'Jade', price: 60, side: '#8FD3B5', side2: '#4FA383', back: '#3F9B78' },
  { id: 'corail', name: 'Corail', price: 60, side: '#FFB3A1', side2: '#E07A66', back: '#E8735E' },
  { id: 'lavande', name: 'Lavande', price: 80, side: '#C9B8F0', side2: '#9580D1', back: '#8A72CC' },
  { id: 'nuit', name: 'Bleu nuit', price: 100, side: '#7F93D6', side2: '#4A5A9C', back: '#34477E' },
  { id: 'or', name: 'Or', price: 150, side: '#FFD45C', side2: '#D9A21E', back: '#E8B53A' },
];
/** Onsen decorations: shown around the hot spring on the home screen (each can be shown or hidden). */
export const DECOR: Item[] = [
  { id: 'lanterne', name: 'Lanterne en papier', price: 80 }, { id: 'canards', name: 'Canards de bain', price: 100 },
  { id: 'yuzus', name: 'Yuzus flottants', price: 100 }, { id: 'seau', name: 'Seau en bois', price: 100 },
  { id: 'bonsai', name: 'Bonsaï', price: 150 }, { id: 'maneki', name: 'Chat porte-bonheur', price: 200 },
];
export type Shelf = 'o' | 't' | 'b' | 'k' | 'd';
export const SHELF_ITEMS: Record<Shelf, Item[]> = { o: OUTFITS, t: THEMES, b: BACKS, k: EDGES, d: DECOR };
export interface Wallet { carrots: number; owned: string[] }
const FREE = ['o:agrume', 't:capy', 'b:monde', 'k:bois'];
export const owns = (w: Wallet, shelf: Shelf, id: string, legends = 0) => FREE.includes(`${shelf}:${id}`) || w.owned.includes(`${shelf}:${id}`) || (shelf === 'o' && id === 'capydindon' && legends > 0);
/** Spend carrots; returns false (and changes nothing) if not affordable or not for sale. */
export function buy(w: Wallet, shelf: Shelf, item: Item, today = dayKey()) {
  if (owns(w, shelf, item.id) || item.legend || w.carrots < item.price || !onSale(item, today)) return false;
  w.carrots -= item.price; w.owned.push(`${shelf}:${item.id}`); return true;
}
/** Carrots earned for a win. Replays pay less than the first clear; the golden capydindon bonus is paid once per board
 *  (first clear of a level, today's daily, any zen/endless board), never on replays or catch-up dailies. */
export function carrotReward(r: { mode: Mode; late?: boolean; /** day already cleared before */ again?: boolean; stars?: number; first?: boolean; round?: number; diff?: Diff; streak?: number; legend?: boolean; ach?: number }) {
  let c = 0;
  if (r.mode === 'level') c = (r.first ? 10 : 3) + (r.stars ?? 0) * (r.first ? 5 : 2);
  else if (r.mode === 'daily') c = r.again ? 5 : r.late ? 15 : 48 + Math.min(7, r.streak ?? 1) * 5; // 48 (was 40): makes up for the rarer daily capydindon (+25 only 1 day in 3)
  else if (r.mode === 'endless') c = 8 + Math.min(12, r.round ?? 0) * 2;
  else c = { facile: 5, moyen: 10, difficile: 15, expert: 25 }[r.diff ?? 'moyen'];
  const legendPays = r.legend && !r.again && !r.late && (r.mode !== 'level' || r.first);
  return c + (legendPays ? 25 : 0) + (r.ach ?? 0) * 20;
}

// ---------- achievements
export interface Ctx { stats: Stats; stars: Record<number, number>; totalStars: number; last?: { mode: Mode; seconds: number; hints: number; shuffles: number; undos: number; combo: number; tiles: number; perfect: boolean } }
export interface Ach { id: string; name: string; desc: string; icon: string; test: (c: Ctx) => boolean }
const lvDone = (c: Ctx, from: number, to: number) => { for (let i = from; i <= to; i++) if (!(c.stars[i] > 0)) return false; return true; };
export const ACHIEVEMENTS: Ach[] = [
  { id: 'first', name: 'Premier plongeon', desc: 'Termine ton premier plateau.', icon: 'agrume', test: (c) => c.stats.won >= 1 },
  { id: 'perfect', name: 'Sans fausse note', desc: 'Obtiens 3 étoiles sur un niveau.', icon: 'couronne', test: (c) => c.stats.perfect >= 1 },
  { id: 'combo5', name: 'Enchaînement', desc: 'Réalise un combo ×5.', icon: 'noeud', test: (c) => c.stats.bestCombo >= 5 },
  { id: 'nohelp', name: 'Autonome', desc: 'Gagne un niveau de 64 tuiles ou plus sans indice ni mélange.', icon: 'lunettes', test: (c) => !!c.last && c.last.mode === 'level' && c.last.tiles >= 64 && !c.last.hints && !c.last.shuffles },
  { id: 'speed', name: 'Éclair', desc: 'Vide un plateau de 36 tuiles en moins de 60 s.', icon: 'ete', test: (c) => !!c.last && c.last.mode !== 'zen' && c.last.tiles >= 36 && c.last.seconds < 60 },
  { id: 'world1', name: 'Au fil de l\'eau', desc: 'Termine le monde Rivière.', icon: 'canard', test: (c) => lvDone(c, 0, 5) },
  { id: 'world3', name: 'Explorateur', desc: 'Termine le monde Forêt.', icon: 'feuille', test: (c) => lvDone(c, 12, 17) },
  { id: 'allworlds', name: 'Maître du temple', desc: 'Termine les 30 niveaux.', icon: 'couronne', test: (c) => lvDone(c, 0, 29) },
  { id: 'secret1', name: 'Passage secret', desc: 'Termine un niveau secret.', icon: 'lunettes', test: (c) => [30, 31, 32, 33, 34].some((n) => c.stars[n] > 0) },
  { id: 'secrets', name: 'Cartographe', desc: 'Termine les 5 niveaux secrets.', icon: 'lotus', test: (c) => lvDone(c, 30, 34) },
  { id: 'turtle', name: 'La grande tortue', desc: 'Vide un plateau de 144 tuiles.', icon: 'tournesol', test: (c) => !!c.last && c.last.tiles >= 144 },
  { id: 'stars45', name: 'Ciel étoilé', desc: 'Récolte 45 étoiles.', icon: 'hiver', test: (c) => c.totalStars >= 45 },
  { id: 'stars90', name: 'Constellation', desc: 'Récolte 90 étoiles.', icon: 'printemps', test: (c) => c.totalStars >= 90 },
  { id: 'daily1', name: 'Rendez-vous', desc: 'Réussis un défi du jour.', icon: 'serviette', test: (c) => c.stats.dailyDone.length >= 1 },
  { id: 'late1', name: 'Rattrapage', desc: 'Rattrape un défi manqué depuis le calendrier.', icon: 'serviette', test: (c) => c.stats.dailyLate.length >= 1 },
  { id: 'streak3', name: 'Rituel', desc: 'Réussis le défi 3 jours de suite.', icon: 'bonnet', test: (c) => c.stats.bestStreak >= 3 },
  { id: 'streak7', name: 'Habitué de l\'onsen', desc: 'Réussis le défi 7 jours de suite.', icon: 'lotus', test: (c) => c.stats.bestStreak >= 7 },
  { id: 'endless5', name: 'Marathon', desc: 'Termine 5 manches d\'affilée en mode Infini.', icon: 'paille', test: (c) => c.stats.endlessBest >= 5 },
  { id: 'zen5', name: 'Pleine conscience', desc: 'Vide 5 plateaux en mode Zen.', icon: 'tulipe', test: (c) => c.stats.zenWon >= 5 },
  { id: 'pairs1000', name: 'Mille paires', desc: 'Associe 1000 paires au total.', icon: 'fraise', test: (c) => c.stats.pairs >= 1000 },
  { id: 'legend1', name: 'Légende vivante', desc: 'Trouve et associe le capydindon légendaire.', icon: 'capydindon', test: (c) => c.stats.legends >= 1 },
  { id: 'legend5', name: 'Chasseur de légendes', desc: 'Associe 5 capydindons légendaires.', icon: 'capydindon', test: (c) => c.stats.legends >= 5 },
  { id: 'carrots500', name: 'Potager', desc: 'Gagne 500 carottes au total.', icon: 'feuille', test: (c) => c.stats.carrotsEarned >= 500 },
  { id: 'shapes', name: 'Artiste', desc: 'Vide 5 plateaux en forme (cœur, chat, ourson…).', icon: 'chat', test: (c) => c.stats.shapes >= 5 },
  { id: 'expert', name: 'Maître zen', desc: 'Vide un plateau Expert en mode Zen.', icon: 'ours', test: (c) => c.stats.expertWon >= 1 },
  { id: 'hour', name: 'Bain prolongé', desc: 'Joue une heure au total.', icon: 'automne', test: (c) => c.stats.seconds >= 3600 },
];
/** Returns ids of achievements newly earned (not already in `have`). */
export const checkAchievements = (c: Ctx, have: string[]) => ACHIEVEMENTS.filter((a) => !have.includes(a.id) && a.test(c)).map((a) => a.id);
