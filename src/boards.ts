// Compact boards: short footprints, stacked in place, so a 667×375 landscape phone
// still draws tiles at least 44px wide. Tile counts match the originals.
import { lanterns, stack } from './layout';
import type { LayoutDef } from './levels';

const L = (id: string, name: string, layers: [number, number][]): LayoutDef => ({ id, name, shape: true, make: () => stack(layers) });

export const BOARDS: Record<string, LayoutDef> = {
  nenuphar: L('nenuphar', 'Nénuphar', [[7, 5], [7, 5]]),
  canard: L('canard', 'Canard', [[7, 4], [7, 4]]),
  lanterne: { id: 'lanterne', name: 'Lanternes', shape: true, make: lanterns },
  bassin: L('bassin', 'Bain fumant', [[9, 4], [5, 4], [5, 4], [5, 4]]),
  chene: L('chene', 'Chêne', [[9, 4], [7, 4], [7, 4]]),
  cabane: L('cabane', 'Cabane', [[10, 4], [10, 4], [4, 4]]),
  feuille: L('feuille', 'Feuille d\'érable', [[8, 5], [8, 5]]),
  sapin: L('sapin', 'Sapin', [[10, 5], [8, 3]]),
  bonhomme: L('bonhomme', 'Bonhomme de neige', [[10, 5], [4, 5], [4, 3]]),
  sommets: L('sommets', 'Trois sommets', [[10, 5], [10, 5], [6, 3]]),
  refuge: L('refuge', 'Refuge', [[10, 5], [8, 5], [8, 5]]),
  escalier: L('escalier', 'Escalier', [[10, 5], [8, 5], [8, 3]]),
  torii: L('torii', 'Torii', [[10, 5], [6, 5], [6, 5]]),
  pagode: L('pagode', 'Pagode', [[10, 5], [10, 3], [10, 3], [8, 3]]),
  tasse: L('tasse', 'Tasse de thé', [[9, 4], [5, 4], [5, 4]]),
  herisson: L('herisson', 'Hérisson', [[10, 5], [10, 5]]),
  flocon: L('flocon', 'Flocon', [[6, 4], [6, 4]]),
  eventail: L('eventail', 'Éventail', [[9, 5], [9, 3], [7, 3], [7, 3]]),
};
