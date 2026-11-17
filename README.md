# Mahjong Capybaras 🦫

Mahjong solitaire kawaii, mobile-first (paysage), 35 niveaux / 5 mondes (dont 5 secrets), PWA hors ligne. 100 % gratuit, sans pub, sans achat intégré.

## Contenu
- **Campagne** : 30 niveaux, chacun sur son propre plateau thématique (rivière, onsen, forêt, montagne, temple), difficulté progressive (graines calibrées), 3 étoiles par niveau.
- **Niveaux secrets** : un par monde, ouvert avec 15 étoiles dans ce monde (35 plateaux différents au total).
- **Modes** : Défi du jour (calendrier + série), Infini (plateaux de plus en plus profonds), Zen (4 difficultés : Facile, Moyen, Difficile, Expert).
- **Plateaux en forme** : 35 plateaux (nénuphar, canard, lanternes, sapin, bonhomme de neige, torii, pagode, tasse de thé, hérisson…). Tous garantis solubles. Le défi du jour, le Zen et l’Infini puisent dans ces plateaux.
- **Amis** : chat noir, ourson et le **capydindon légendaire** — une paire dorée rare (garantie dans le défi du jour) : +1000 points, +25 carottes, et sa tenue la première fois.
- **Carottes** 🥕 : gagnées en jouant (niveaux, défi, infini, zen, succès), dépensées dans la Collection pour des tenues, des jeux de tuiles (Ménagerie, Chats noirs, Oursons) et des fonds de plateau (Nuit étoilée, Sakura, Potiron). Aucun argent réel.
- **Musique lo-fi et sons** : entièrement synthétisés (Web Audio, aucun fichier audio). Six thèmes originaux — guitare (Rivière), Rhodes (Onsen), marimba (Forêt), cloches (Montagne), koto (Temple), piano feutré (Brume / Zen) — chargés à la demande et enchaînés par un fondu égal (~3 s, calé sur la mesure). L'Infini change de thème toutes les 3 manches. Volumes réglables (musique 45 %, effets 60 % par défaut). Les effets, dont la fusion, restent sur leur propre bus.
- **Aides** : paires possibles en surbrillance (désactivable), indice automatique après 20 s (optionnel), tuiles bloquées assombries.
- Succès, statistiques, calendrier mensuel des défis.
- **Rattrapage** : un défi manqué (30 derniers jours) se rejoue depuis le calendrier (bouton dans Modes, ou Stats) : +20 carottes, marqué en orange, sans effet sur la série 🔥.
- **Annulations** : illimitées en Zen et au monde Rivière, 5 aux mondes 2-3, au défi et en Infini, 3 aux mondes 4-5. Un combo ×4 ou le capydindon en redonne une. Compteur sur le bouton Annuler.
- **Reprendre** : la partie en cours est sauvegardée à chaque coup (appel, appli fermée…) et se reprend depuis l'accueil.
- **Première partie guidée** : la première paire brille et une main montre où toucher.
- **Partage** : résultat du défi du jour (étoiles, temps, série, lien direct), « bats mon temps » sur un niveau ou un plateau zen précis, et « Partager le jeu » dans les réglages.

Réflexion joueur / produit et backlog : [`docs/brainstorm.md`](docs/brainstorm.md).

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests unitaires (Vitest)
npm run e2e        # tests Playwright (mobile paysage 844x390 + desktop)
npm run build      # dist/ + service worker
```

## Déploiement GitHub Pages
1. Pousser sur la branche `main` d'un dépôt GitHub.
2. Settings → Pages → Source : **GitHub Actions**.
3. Le workflow `.github/workflows/deploy.yml` teste, build et publie. URL : `https://<user>.github.io/<repo>/` (chemins relatifs, aucun réglage de base nécessaire).

Liens directs : `?level=N` (0–29), `?mode=daily`, `?mode=zen&diff=expert`, `?mode=zen&layout=chat`. Planche artistique : `art.html`.

## Visuels
- Fond de l'accueil : illustration IA (`assets-src/home-bg.jpg`) convertie en `public/home-bg.webp`, chargée après le premier affichage et mise en cache hors ligne par le service worker.
- Icônes, favicon et image de partage (`public/og-image.jpg`, 1200×630) : `node scripts/icons.mjs` (mascotte A dessinée en SVG).
- Aperçus : `previews/` (scripts dans `scripts/mascot/`).
