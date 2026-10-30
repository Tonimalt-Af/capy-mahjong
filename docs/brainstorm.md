# Mahjong Capybaras — brainstorm joueur & produit

_30 octobre 2026. Écrit après le passage Phase 4 (amis, capydindon, carottes, plateaux en forme). Le jeu a été rejoué sur mobile paysage (844×390) et sur desktop, avec des captures d'écran et des sessions réelles au doigt et à la souris._

## 1. Point de vue joueur

### A. Première visite, joueur occasionnel
| Moment | Ce qui marche | Friction / risque |
|---|---|---|
| Arrivée sur l'accueil | Héros mignon, gros bouton « Jouer », aucune inscription | Rien n'indique que tout est gratuit avant d'ouvrir la Collection |
| « Comment jouer » | 3 cartes illustrées, courtes | C'est de la lecture : la règle « libre à gauche ou à droite » ne s'apprend vraiment qu'en jouant |
| Premiers coups, niveau 1 | Grandes tuiles (65 px), tuiles bloquées assombries | **Aucune aide guidée** : un joueur perdu touche des tuiles bloquées, voit « Tuile bloquée » sans savoir pourquoi |
| Première victoire | Confettis, étoiles, carottes, succès | La carte annonce des carottes, mais ne dit pas **quoi en faire** |
| Interruption (appel, appli tuée par le téléphone) | Pause automatique | **La partie en cours est perdue** si l'onglet est déchargé : c'est la première cause de frustration sur mobile |

**Plaisirs à protéger :** le son d'une paire, les combos, le style stickers, l'apparition surprise du capydindon.

### B. Joueur quotidien qui revient
- Le point rouge sur « Modes » est discret. La **série 🔥** n'apparaît que dans l'écran Modes, donc l'enjeu (« je vais perdre ma série ») est invisible depuis l'accueil.
- Une fois le défi gagné, **rien à faire du résultat** : on ne peut pas le montrer à un ami, alors que c'est le moteur n° 1 de Wordle et des jeux quotidiens.
- Le calendrier mensuel est satisfaisant à remplir. Rejouer les jours manqués serait apprécié, mais risque de dévaluer la série (→ backlog).

### C. Complétionniste
- Il a beaucoup à viser : 90 étoiles, 4 jeux de tuiles, 20 tenues, 4 fonds, des succès, les plateaux en forme, l'Expert, le capydindon.
- **Manque de visibilité sur le prochain objectif :** combien de carottes avant le prochain achat ? Quels succès sont presque atteints ?
- Le capydindon est une excellente chasse au trésor : « Caché / Trouvé » dans le HUD fonctionne bien.

### Boucles de motivation (état actuel)
```
jouer → carottes → (???) → boutique → nouvelle tenue / nouvelles tuiles → envie de rejouer
             ↑ le maillon manquant : on ne signale pas qu'un achat est possible
défi du jour → série 🔥 → (rien à partager) → retour demain
```

## 2. Point de vue produit (PM)

### Rétention
- **J1 :** le défi quotidien, la série et les +5 carottes par jour de série (plafonnés à 7) constituent une base saine. Il manque :
  - un rappel visible de la série depuis l'accueil ;
  - un partage du résultat (acquisition et engagement social).
- **J7 et J30 :** la boutique (≈ 3 240 carottes au total) donne un horizon d'environ un mois de jeu régulier. C'est le bon ordre de grandeur.
- **Pas de notifications push** (PWA iOS limitée, et c'est volontaire pour un jeu doux). La rétention repose donc sur l'habitude et le partage.

### Entonnoir d'accueil
1. Ouvrir le lien.
2. Toucher « Jouer ».
3. Lire le tutoriel (abandon possible).
4. Réussir la 1ʳᵉ paire ← **étape critique, rien ne l'assure aujourd'hui**.
5. Gagner le niveau 1.
6. Ouvrir la boutique / le défi.

→ Il faut un **coach interactif sur la 1ʳᵉ paire** et des messages d'erreur pédagogiques pendant les premières parties.

### Rythme de progression (calcul)
- **Campagne :** 30 premiers passages × (10 + 5 × ~2,3 étoiles) ≈ 650 🥕, plus ~150 🥕 de capydindons (20 % des niveaux) et ~400 🥕 de succès, soit **≈ 1 200 🥕**. Cela suffit pour environ un tiers de la boutique (les tenues bon marché, la Ménagerie et un fond).
- **Défi du jour :** 45 à 75 🥕 par jour. Les tenues chères, les jeux Chats noirs et Oursons et la couronne arrivent en 3 à 4 semaines.
- **Prix les plus bas :** de 20 à 60 🥕. Le premier achat est donc possible dès les niveaux 1-2, ce qui enclenche bien la boucle. **À signaler activement.**

### Partage
- Aujourd'hui, seul le lien du jeu se partage (image og présente).
- Opportunités :
  1. **une carte de résultat du défi** (texte emoji à la Wordle et lien direct `?mode=daily`) ;
  2. **un lien « défie un ami »** sur un plateau exact (niveau, plateau zen avec graine) ;
  3. **« Partager le jeu »** dans les réglages.

### Accessibilité
- **Déjà en place :**
  - chiffres et pips sur les tuiles (daltonisme) ;
  - tuiles bloquées assombries ;
  - `prefers-reduced-motion` ;
  - `aria-label` sur les tuiles ;
  - grandes cibles tactiles ;
  - aides optionnelles (surbrillance, indice auto).
- **Manque :**
  - annonces lecteur d'écran (le toast n'est pas `aria-live`) ;
  - jeu au clavier sur desktop (tuiles non focalisables) ;
  - option « réduire les animations » dans le jeu lui-même.

### Priorités de finition
- Reprendre une partie interrompue.
- Coach de la 1ʳᵉ paire.
- Partage.
- Signal « achat possible ».
- Série visible depuis l'accueil.
- Test sur vrai téléphone (iOS : verrouillage paysage impossible hors PWA installée).

## 3. Backlog priorisé

Valeur : impact sur rétention / plaisir. Coût : effort estimé. ✅ = fait dans ce passage.

| # | Élément | Valeur | Coût | Statut |
|---|---|---|---|---|
| P0-1 | **Reprendre la partie interrompue.** Le plateau est sauvegardé à chaque coup. L'accueil propose « Reprendre » avec le niveau et les paires restantes. Un défi d'un jour passé est ignoré. | ★★★ | M | ✅ |
| P0-2 | **Coach de la 1ʳᵉ paire.** Les deux tuiles brillent, une main montre où toucher, puis « Bravo ! ». Pendant les 3 premières parties, le message « tuile bloquée » explique pourquoi. | ★★★ | S | ✅ |
| P0-3 | **Partager le résultat.** Bouton sur la carte de victoire, avec Web Share sur mobile et copie dans le presse-papiers sinon. Le défi produit une carte emoji avec le lien du jour ; le niveau et le zen produisent un lien « bats mon temps » sur le même plateau ; l'Infini, la manche atteinte. | ★★★ | S | ✅ |
| P1-1 | **Signal « achat possible ».** Un point sur le portefeuille de l'accueil, et la mention « De quoi t'offrir : … » sur la carte de victoire. | ★★☆ | S | ✅ |
| P1-2 | **Série visible depuis l'accueil.** « 🔥 N » sur le bouton Modes quand le défi du jour reste à faire et qu'une série est en jeu. | ★★☆ | S | ✅ |
| P1-3 | **Annonces accessibles.** Le toast devient `role=status`/`aria-live`. | ★★☆ | XS | ✅ |
| P1-4 | **« Partager le jeu » dans les réglages.** | ★☆☆ | XS | ✅ |
| P1-5 | **Progression des succès** (« 3/5 capydindons »), pour les complétionnistes. | ★★☆ | S | backlog |
| P2-1 | **Rejouer un défi manqué** depuis le calendrier : récompense réduite, sans effet sur la série. | ★★☆ | M | **fait** (Phase 6) : calendrier (Modes + Stats), 30 derniers jours, +20 carottes (+5 si déjà fait), hors série, marqué orange, succès « Rattrapage » |
| P2-2 | **Jeu au clavier sur desktop** (flèches + Entrée, focus visible). | ★☆☆ | M | backlog |
| P2-3 | **« Bouillotte » anti-perte de série,** achetable en carottes (façon Duolingo). | ★★☆ | S | backlog (décision : économie) |
| P2-4 | **Limite d'annulations par niveau,** en option de difficulté. | ★☆☆ | S | **fait** (Phase 6) : ∞ en Zen et monde 1, 5 aux mondes 2-3, défi et Infini, 3 aux mondes 4-5 ; +1 par combo ×4 ou capydindon ; compteur dans le HUD |
| P2-5 | **Option « Animations réduites »** dans les réglages, en plus de la préférence système. | ★☆☆ | XS | backlog |
| P2-6 | **Image de résultat partageable** (PNG généré en canvas) plutôt que du texte. | ★☆☆ | M | backlog |
| P3 | **Test sur vrai téléphone** (iOS Safari et Android Chrome), audio et vibrations. | ★★★ | — | à faire par Maxime après le déploiement |

## 4. Insights clés
1. **Le risque n° 1 sur mobile n'est pas la difficulté mais l'interruption.** Perdre un plateau de 72 paires à cause d'un appel fait fuir. Sauvegarder la partie à chaque coup est le meilleur rapport valeur/coût.
2. **La 1ʳᵉ paire est l'étape critique de l'entonnoir.** Un coach visuel de 5 secondes vaut mieux qu'un tutoriel à lire.
3. **La boucle carottes ne tourne que si on la montre.** Gagner sans savoir quoi acheter = monnaie morte. Il faut signaler l'achat possible au bon moment, c'est-à-dire sur la carte de victoire.
4. **Le partage est la seule acquisition gratuite d'un jeu sans pub.** Le défi du jour avec une carte emoji et un lien direct, c'est le modèle Wordle.
5. **La série doit se voir là où le joueur arrive** (l'accueil), pas un écran plus loin.
