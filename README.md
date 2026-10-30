# Mahjong Capybaras 🦫

Mahjong solitaire kawaii, mobile-first (paysage), 30 niveaux / 5 mondes, PWA hors ligne. 100 % gratuit, sans pub, sans achat intégré.

## Contenu
- **Campagne** : 30 niveaux, difficulté progressive (graines calibrées), 3 étoiles par niveau.
- **Modes** : Défi du jour (calendrier + série), Infini (plateaux de plus en plus grands), Zen (4 difficultés : Facile, Moyen, Difficile, Expert).
- **Plateaux en forme** : Cœur, Capybara, Chat, Ourson, Étoile, Champignon (+ classiques). Tous garantis solubles.
- **Amis** : chat noir, ourson et le **capydindon légendaire** — une paire dorée rare (garantie dans le défi du jour) : +1000 points, +25 carottes, et sa tenue la première fois.
- **Carottes** 🥕 : gagnées en jouant (niveaux, défi, infini, zen, succès), dépensées dans la Collection pour des tenues, des jeux de tuiles (Ménagerie, Chats noirs, Oursons) et des fonds de plateau (Nuit étoilée, Sakura, Potiron). Aucun argent réel.
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
