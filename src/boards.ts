// Compact, recognisable silhouettes. Tile counts match the originals, and every
// upper tile sits on the layer below so a 667×375 landscape phone stays ≥ 44px.
import { silhouette } from './silhouettes';
import type { LayoutDef } from './levels';

const L = (id: string, name: string): LayoutDef => ({ id, name, shape: true, make: () => silhouette(id) });

export const BOARDS: Record<string, LayoutDef> = {
  nenuphar: L('nenuphar', 'Nénuphar'),
  canard: L('canard', 'Canard'),
  lanterne: L('lanterne', 'Lanternes'),
  bassin: L('bassin', 'Bain fumant'),
  chene: L('chene', 'Chêne'),
  cabane: L('cabane', 'Cabane'),
  feuille: L('feuille', 'Feuille d\'érable'),
  sapin: L('sapin', 'Sapin'),
  bonhomme: L('bonhomme', 'Bonhomme de neige'),
  sommets: L('sommets', 'Trois sommets'),
  refuge: L('refuge', 'Refuge'),
  escalier: L('escalier', 'Escalier'),
  torii: L('torii', 'Torii'),
  pagode: L('pagode', 'Pagode'),
  tasse: L('tasse', 'Tasse de thé'),
  herisson: L('herisson', 'Hérisson'),
  flocon: L('flocon', 'Flocon'),
  eventail: L('eventail', 'Éventail'),
};
