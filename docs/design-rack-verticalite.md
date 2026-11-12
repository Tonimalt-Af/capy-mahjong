# Refonte de difficulté — rack et verticalité

Document de design. Aucune règle de jeu n’est implémentée par ce texte. Il décrit le comportement à coder ensuite, sans ambiguïté sur le rack.

Décisions déjà prises : le monde 1 reste un mahjong solitaire classique ; à partir du monde 2, un rack (plateau du haut) remplace l’élargissement des plateaux comme levier de difficulté ; tous les mondes et tous les plateaux seront adaptés dans une phase dédiée, pas par un cas particulier.

Le mot **rack** désigne la zone de jeu. Dans l’interface, on l’appelle **plateau du haut**.

---

## 1. Inventaire de l’existant

Mesures prises sur les fonctions de layout (`src/levels.ts`, `src/boards.ts`, `src/layout.ts`) : nombre de tuiles, colonnes `(maxX − minX) / 2 + 1`, rangées, couches (`max z + 1`), hauteur de pile sur une même case. Certains commentaires du source ne correspondent plus au décompte réel (le papillon est à 68 tuiles, pas 84).

### Campagne

5 mondes, 6 niveaux chacun, plus 1 niveau secret par monde ouvert avec 15 étoiles dans ce monde. 35 plateaux, chacun utilisé une seule fois. Aucun plateau n’est partagé entre deux mondes.

| Monde | Id | Niveaux | Indices | Mélanges | Annulations |
|---|---|---|---|---|---|
| 1 Rivière | `riviere` | 1–6 (`n` 0–5) | 4 | 3 | illimitées |
| 2 Onsen | `onsen` | 7–12 (`n` 6–11) | 3 | 3 | 5 |
| 3 Forêt | `foret` | 13–18 (`n` 12–17) | 2 | 2 | 5 |
| 4 Montagne enneigée | `montagne` | 19–24 (`n` 18–23) | 2 | 2 | 3 |
| 5 Temple | `temple` | 25–30 (`n` 24–29) | 2 | 1 | 3 |

Formules actuelles (`src/levels.ts`) : `hintBudget = max(2, 4 − monde)`, `undoBudget` = illimité / 5 / 5 / 3 / 3, mélanges = `max(1, 3 − floor(monde / 2))`, par = `tuiles × (3,2 + monde × 0,3)`. Les étoiles ignorent les mélanges : 3 si temps ≤ par et 0 indice, 2 si temps ≤ 1,6 × par et au plus 1 indice, sinon 1. Le score retire 150 par indice et 250 par mélange.

Les graines ont été calibrées au bot (`src/sim.ts`) pour un taux de réussite d’environ 98 % au niveau 1 jusqu’à environ 82 % au niveau 30, sans pic. Le niveau 8 (index campagne `n` 7, graine 70859) est un repro de soft-lock conservé volontairement.

### Comment la difficulté monte aujourd’hui

La liberté d’une tuile ne change pas : rien au-dessus (`z + 1` qui chevauche) et au moins un côté gauche ou droit ouvert (`src/engine.ts`, `isFree`). On gagne en vidant le plateau. On est bloqué quand plus aucune paire libre n’existe. Le mélange redistribue les faces restantes, force une paire libre, et ne garantit pas que le plateau reste soluble. S’il est géométriquement insoluble, le mélange n’est pas consommé.

Le levier principal n’est pas la profondeur. C’est la largeur, le nombre de tuiles, puis des budgets plus serrés et des graines plus dures. La profondeur existe (pyramide et escalier à 4 couches, tortue à 5) mais plusieurs grands plateaux tardifs sont larges et plats : lanternes et chêne à 1 de pile, bassin à 15 colonnes et 1 de pile, sommets à 16 colonnes, escalier à 18.

| Monde | Tuiles | Colonnes | Couches | Constat |
|---|---|---|---|---|
| 1 | 36–78 | 6–12 | 2–3 | Lisibles, peu de piles. Le galet (6 × 4, 3 couches) enseigne la règle. |
| 2 | 64–96 | 8–15 | 2–4 | La pyramide est le seul vrai volume (4 de pile). Le bassin fait 15 colonnes pour 1 de pile. |
| 3 | 68–112 | 11–15 | 2–3 | Presque tout est large. Le capybara fait 112 tuiles sur 15 colonnes. |
| 4 | 74–130 | 12–16 | 2–4 | Le refuge (130 tuiles, 4 couches) est l’exception. Les sommets font 16 colonnes. |
| 5 | 90–144 | 10–18 | 3–5 | L’escalier atteint 18 colonnes. La tortue (144, 15 colonnes, 5 couches) est le seul final déjà vertical. |

### Modes hors campagne

- **Défi du jour.** Même plateau pour tout le monde. Depuis le 31 octobre 2026, pioche parmi 30 plateaux d’au moins 64 tuiles. 1 indice, 1 mélange, 5 annulations. Capydindon à 35 %. Les jours d’avant gardent leur ancien plateau (calendrier, liens).
- **Infini.** 10 paliers de plateaux classés par nombre de tuiles, 2 manches par palier, jamais plus petit que le palier précédent. Le texte du mode promet « des plateaux de plus en plus grands ».
- **Zen.** 4 difficultés (Facile 36–84, Moyen 72–92, Difficile 96–120, Expert grands plateaux). Indices, mélanges et annulations illimités. Pas de chrono ni de score affichés.
- **Reprise.** `Run` dans la sauvegarde : faces, ids retirés, historique de paires `[id, id]`, temps, budgets, score. Reprise refusée si le layout a changé de longueur, ou si un défi du jour a changé de date. L’export de code retire la partie en cours.

### HUD actuel

Paysage, une seule ligne utile. En hauteur confortable : barre du haut (pause, musique, nom du niveau, jetons combo / capydindon / paires / temps / score) et rail droit (indice, annuler, mélanger). Sous 500 px de haut, le HUD devient un rail gauche de 84 px et le plateau prend toute la hauteur. Le jeu exige le paysage sur téléphone. Le portrait affiche « Tourne ton téléphone » et met en pause.

Le coach de la première paire ne joue que sur le niveau 1, première victoire jamais faite. Le toast « tuile bloquée » explique gauche / droite pendant les 3 premières victoires. L’aide « Comment jouer » a 3 cartes, toutes sur la règle classique.

---

## 2. Objectifs et non-objectifs

### Objectifs

- Enseigner la règle gauche / droite au monde 1, sans rack.
- À partir du monde 2, faire monter la difficulté par la profondeur des piles et par la taille du rack, à budget d’aides inchangé.
- Rendre chaque plateau de la campagne redessiné dans ce cadre, données comprises (défi, zen, infini), avec une bascule explicite par niveau.
- Garder une partie honnête : on peut se tromper, on peut s’en sortir tant qu’il reste une annulation ou un mélange utile, et une graine parfaite reste gagnable.
- Laisser le HUD respirer. Le rack prend la place d’un chrome existant.

### Non-objectifs

- Pas de tuiles spéciales nouvelles (bombe, gel, joker). Le capydindon, les fleurs et les saisons restent les seules familles particulières, et elles passent par `matches`.
- Pas de changement des prix en carottes, des succès, ni de la formule d’étoiles dans la première version.
- Pas de mode portrait.
- Pas d’effacement des étoiles déjà gagnées.
- Pas de modification du nom d’auteur publié (JSON-LD ou autre).
- Pas de déploiement dans la foulée du code. La mise en ligne attend une revue humaine.

---

## 3. Décisions tranchées

Ces choix sont le contrat. Les variantes écartées sont en fin de section, pour qu’on ne les réimplémente pas « en mieux » sans revenir au design.

1. **Deux règles de liberté, un seul geste de paire.** Le monde 1 conserve le tap-sélection sur le plateau. À partir du monde 2, taper une tuile libre l’enlève du plateau et la pose dans le rack. Taper ensuite sa paire, encore sur le plateau, l’envoie aussi au rack et les deux disparaissent aussitôt.
2. **Une tuile dans le rack ne bloque plus.** Elle libère ses voisins et la tuile du dessous dès qu’elle quitte le plateau. C’est le cœur du risque : on ouvre le plateau en dépensant un emplacement.
3. **Le rack ne contient jamais une paire.** Dès que la deuxième tuile d’un groupe y entre, les deux sortent. Un seul tap produit cette résolution. Un seul annuler l’annule entièrement.
4. **Rack plein n’est pas une défaite.** On peut encore taper une tuile libre du plateau qui matche un occupant du rack. La défaite douce n’arrive que lorsqu’aucun coup légal ne reste.
5. **Le mélange est l’échappatoire, pas une défaite automatique, et il ne touche pas au rack.** Les tuiles déjà montées sont un choix engagé.
6. **On ne repose pas une tuile en la retapant dans le rack.** La seule marche arrière est Annuler, dans la limite du budget.
7. **La géométrie reste soluble en règle classique.** Un deal sans rack (défi du jour, zen facile, monde 1) trouve toujours une solution. Le rack n’est jamais une béquille pour un plateau dont les cases sont impossibles. Le deal de campagne en rack, lui, cache des groupes entiers dans une colonne : la majorité de ces niveaux ne se finit pas en n’appariant que des tuiles libres. Voir § 3 bis.
8. **Le défi du jour reste classique pour tout le monde**, y compris les joueurs qui ont déjà le rack en campagne. Sinon le plateau du jour n’aurait plus la même règle pour tous.
9. **Les budgets d’indices, de mélanges et d’annulations ne changent pas.** La nouvelle difficulté est le rack et la profondeur.

## 3 bis. Le rack fait partie de la difficulté

Ajouter la barre ne suffit pas. Sur un niveau à rack, stocker une tuile doit être le geste qui débloque la suite.

Un groupe est **enfoui** quand ses quatre tuiles occupent la même case, de bas en haut. Une seule est libre à la fois, et sa seule paire est en dessous : le jeu classique ne peut pas la prendre. Le rack la gare, la tuile du dessous se libère, elles partent. Pic d’occupation 1, deux garages forcés par groupe.

Ce n’est pas exigé de chaque niveau. Le premier plateau de chaque monde à rack reste jouable sans rack. L’Onsen en garde un second, la pyramide, sur la graine auditée 70859. Les secrets sont enfouis. Parts verrouillées par `tests/rack-need.test.ts` :

| Ensemble | Part minimale qui exige le rack |
|---|---|
| Onsen (6 niveaux + secret) | 4 / 7 |
| Forêt, Montagne, Temple (chacun) | 5 / 7 |
| Les 28 niveaux à rack | 70 % |

Le nombre de groupes enfouis visé grandit quand le rack rétrécit : 3 groupes à 6 places, 3 à 5 places, 4 à 4 places. Le bot qui connaît le rack doit quand même garder une courbe douce : au moins 75 % de réussites par niveau, sans remonter de plus de deux points d’un monde à l’autre.

Zen Moyen, Difficile, Expert et Infini à partir de la manche 3 tirent au sort l’enfouissement (environ 75–90 % des graines). On ne rejette pas les graines restantes. Zen Facile, les deux premières manches d’Infini, le monde 1 et le défi du jour ne tirent jamais.

### Variantes écartées

- **Appariement manuel dans le rack.** Obliger un troisième geste, ou laisser deux tuiles appariables attendre dans la barre, crée des défaites par oubli. La résolution est automatique.
- **Taper une tuile du rack pour la marier à une tuile du plateau.** Cibles trop petites au doigt, et deux façons de faire le même coup.
- **Reposer une tuile en tapant son emplacement.** Le rack deviendrait une sélection gratuite à 6 cases. Taper un emplacement occupé affiche une fois le toast « Elle attend sa paire. Annuler pour la reposer. », puis ne fait plus rien.
- **Défaite sèche dès que le rack est plein.** Trop punitif au monde 2, et contradictoire avec le mélange déjà en place.
- **Mélanger aussi les tuiles du rack.** Cela efface la erreur que le rack est là pour punir.
- **Rack au monde 1.** Le monde 1 n’a qu’un travail : apprendre gauche / droite.

---

## 4. Règles du rack

`rack` sur un niveau vaut `0` (classique) ou le nombre d’emplacements. Le geste, l’indice, le mélange, la sauvegarde et le coach se branchent sur ce nombre. Le monde 1 et le défi du jour restent à `0`.

### 4.1 Qui est libre

Inchangé pour les tuiles encore sur le plateau. Le calcul ignore les tuiles retirées et les tuiles qui sont dans le rack. Une tuile du rack n’est pas « retirée » : elle a encore sa case d’origine `(x, y, z)` pour l’annulation, et elle n’est plus dessinée sur le plateau.

Taper une tuile bloquée : secousse, son invalide, même toast qu’aujourd’hui (phrase longue gauche / droite pendant les 3 premières victoires, puis « Tuile bloquée »).

### 4.2 Poser une tuile

Taper une tuile libre du plateau :

- Si son groupe matche une tuile du rack, c’est une **paire** (§ 4.3), même si le rack est plein.
- Sinon, s’il reste un emplacement vide, c’est une **prise**. La tuile quitte le plateau et se place dans l’emplacement libre le plus à gauche. Les tuiles ne laissent pas de trou : après chaque changement, la rangée se tasse à gauche. L’ordre est l’ordre d’arrivée.
- Sinon le rack est plein et cette tuile ne matche rien : le tap est refusé. Secousse, toast « Le plateau du haut est plein. » La tuile reste sur le plateau. Ce n’est pas une défaite.

Une prise ne marque pas de points, ne compte pas comme un coup de combo, et ne réinitialise pas le combo en cours. La fenêtre de combo reste 4 secondes entre deux paires, comme aujourd’hui.

État invariant après chaque geste résolu : au plus une tuile par groupe dans le rack. Les fleurs se matchent entre elles, les saisons aussi, le capydindon avec l’autre capydindon, via `matches`.

### 4.3 Faire une paire

La paire se touche sur le plateau. La tuile tapée part vers le rack et s’annule avec l’unique tuile du même groupe déjà présente. Les deux quittent la partie (`removed`). Le rack se tasse.

Ce geste est **une seule action**, même si l’animation montre un aller. Un annuler restaure l’état d’avant ce tap : la tuile du rack revient à son emplacement d’alors, la tuile du plateau revient sur sa case, aucune des deux ne reste dans le rack.

Points, combo, capydindon, son et secousse légère : identiques à une paire classique. Le combo ×4 et le capydindon redonnent une annulation quand le budget est limité, comme aujourd’hui.

S’il ne reste plus aucune tuile sur le plateau ni dans le rack, la partie est gagnée. Avec l’invariant, un plateau vide implique un rack vide : une tuile garée a forcément sa paire encore quelque part.

### 4.4 Coup légal, défaite, mélange

Un coup légal existe si :

- une tuile libre du plateau matche une tuile du rack, ou
- le rack n’est pas plein et il existe au moins une tuile libre sur le plateau.

S’il reste des tuiles et qu’aucun coup légal n’existe, on ouvre la carte de blocage déjà connue, après le même court délai. Le titre de situation :

- rack plein, ou rack non vide sans tuile libre qui matche : « Plus aucune paire ne peut entrer dans le plateau du haut. »
- plateau géométriquement mort (aucune tuile libre, ou `clearable` faux) : la phrase actuelle sur les tuiles coincées.

Boutons, dans cet ordre de préférence :

1. **Annuler**, si l’historique n’est pas vide et qu’il reste du budget.
2. **Mélanger**, si le mélange peut produire un coup légal et qu’il reste du budget (illimité au zen).
3. **Recommencer** et **Quitter**, toujours.

On ne mélange pas tout seul. On ne termine pas la partie tant qu’un de ces boutons peut débloquer.

Le mélange :

- ne change ni le contenu du rack, ni l’ordre, ni les faces qui y sont ;
- redistribue seulement les faces des tuiles encore sur le plateau ;
- n’est pas consommé s’il ne peut pas créer un coup légal (aucune tuile libre, ou plus aucune face du plateau ne matche le rack alors que le rack est plein, ou géométrie insoluble) ;
- s’il est consommé et que le rack est vide, il garantit une paire libre sur le plateau, comme aujourd’hui ;
- s’il est consommé et que le rack n’est pas vide, il garantit au moins une tuile libre du plateau qui matche un occupant du rack, en déplaçant une face compatible déjà présente sur le plateau vers une case libre ;
- ne promet pas que le reste de la partie est soluble. Se tromper ensuite fait partie du jeu, comme aujourd’hui.

L’historique d’annulation survit au mélange. Annuler une prise d’avant le mélange reposent la tuile avec la face qu’elle avait en quittant le plateau. Les autres faces du plateau restent celles du mélange.

### 4.5 Annuler

Un annuler = le dernier tap du joueur.

| Dernier tap | Effet de l’annuler |
|---|---|
| Prise | La tuile revient sur sa case, le rack se tasse, le score ne change pas. |
| Paire | Les deux tuiles reviennent où elles étaient avant ce tap. Le score perd exactement les points ajoutés par cette paire (base, bonus de combo, +1000 du capydindon s’il y en avait un). Le combo retombe à 0. |

Le budget est celui du niveau, plus les bonus déjà gagnés. Une annulation sans budget affiche le toast actuel. L’indice et le mélange ne sont pas rendus.

Le chip capydindon suit la vérité de la partie : si la paire dorée n’est plus retirée, le chip repasse à « Caché ». Le compteur de carrière n’est pas décrémenté.

Le mode classique conserve son annuler actuel (historique de paires, −100 points). On ne mélange pas les deux implémentations.

### 4.6 Indice, surbrillance, indice auto

L’indice ne joue pas le coup. Il dépense un indice (sauf au zen, illimité, et sauf l’indice auto).

Priorité :

1. S’il existe une tuile libre du plateau qui matche le rack, surligner cette tuile et l’emplacement correspondant.
2. Sinon, s’il reste de la place dans le rack, surligner une paire libre du plateau, comme aujourd’hui. Le joueur devra encore faire les deux taps.
3. S’il n’existe aucun coup légal, l’indice ne fait rien et n’est pas dépensé.

L’option « Montrer les paires possibles » : en mode rack, toutes les tuiles libres du plateau qui matchent une tuile du rack portent la surbrillance de paire. Rack vide : rien n’est surligné. On ne montre pas toutes les paires futures du plateau.

L’indice automatique à 20 secondes, s’il est activé, applique la même priorité, ne coûte rien, et ne part pas pendant une carte ouverte.

### 4.7 Coach et aide

Deux coaches, deux drapeaux.

- **Classique.** Inchangé : niveau 1, aucune victoire, la première paire brille, une main montre le tap, toast « Bravo ! » après la paire. Le monde 1 ne parle pas du rack.
- **Rack.** La première fois qu’une partie en rack démarre (campagne, zen ou infini) et que `seenRack` est faux. On le pose à vrai au début de cette partie, pour ne pas le répéter après une reprise. Même si le joueur a déjà des étoiles au monde 2 : la règle est nouvelle pour tout le monde.

Déroulé du coach rack, sur une paire libre dès le deal (elle existe : les deals restent solubles) :

1. La première tuile brille, main, toast « Touche une tuile libre : elle monte dans le plateau du haut. »
2. Après la prise, sa paire brille, main, toast « Touche sa paire : elles disparaissent. »
3. Après la paire, toast « Si le plateau du haut se remplit sans paire possible, tu es bloqué. Annuler ou mélanger peut t’aider. » Le coach s’arrête.

L’aide « Comment jouer » :

- garde ses 3 cartes classiques tant que le monde 2 n’est pas débloqué et qu’on n’est pas dans une partie en rack ;
- ajoute une 4ᵉ carte dès que le monde 2 est débloqué, ou dès qu’on l’ouvre pendant une partie en rack. Texte de la carte : « En dehors de la Rivière, une tuile libre monte dans le plateau du haut. Touche sa paire pour les retirer. Un plateau du haut plein, sans paire possible, bloque la partie. »

Le toast de la première annulation limitée reste, au premier niveau qui a un budget fini.

### 4.8 Animation et entrée

L’état change au moment du tap. L’animation rattrape. On n’empêche pas le tap suivant : un second tap pendant le vol est appliqué sur le nouvel état. `prefers-reduced-motion` et l’option d’animations réduites, le jour où elle existe, sautent le vol ; les règles ne changent pas.

Le clavier, encore au backlog, suivra la même règle le jour où il arrive : Entrée sur une tuile libre = un tap, les emplacements du rack ne sont pas dans l’ordre de tabulation.

### 4.9 Accessibilité

Le rack est une liste. Chaque emplacement a un nom : « Emplacement 3 sur 6 : bambou 1, en attente » ou « Emplacement 4 sur 6 : vide ». Une paire réussie passe par le toast déjà annoncé (`role=status`). Les tuiles du rack sont les mêmes tuiles (chiffres, pips) : pas d’information portée seulement par la couleur. Contraste et cible : voir les risques et les critères d’acceptation.

---

## 5. Progression

Les budgets restent ceux du tableau du § 1. Seuls le mode et la géométrie changent.

| Monde | Mode | Emplacements | Géométrie visée |
|---|---|---|---|
| 1 Rivière | classique | — | Plateaux actuels conservés. Plafond déjà respecté : 12 colonnes. Pas de rack, même sur le secret. |
| 2 Onsen | rack | 6 | Colonnes ≤ 10. Couches 3 ou 4. Le premier niveau (Les lanternes du soir) est le tutoriel : peu de tuiles hors pile, une ouverture évidente, rack difficile à remplir par accident. |
| 3 Forêt | rack | 5 | Colonnes ≤ 10. Couches 4, pile visuelle lisible, pas une tour unique. |
| 4 Montagne | rack | 5 | Colonnes ≤ 11. Couches 4 ou 5. Un sommet peut être plus haut que les autres. |
| 5 Temple | rack | 4 | Colonnes ≤ 12, sauf la tortue (ci-dessous). Couches 4 ou 5. |

Secrets : même mode et même nombre d’emplacements que leur monde. Ils restent aussi durs que le dernier niveau du monde par la géométrie et la graine, pas par un rack plus petit. Le secret de la Rivière (La fleur de lotus) reste classique.

Plafonds de lecture, pour tous les plateaux redessinés :

- au plus 5 couches (`z` de 0 à 4) ;
- au plus 4 tuiles sur la même case ;
- préférer des couches décalées, comme la tortue, à une colonne de 4 tuiles identiques qui se lisent comme une seule ;
- nombre de tuiles à ±15 % du plateau actuel, pour ne pas casser le rythme des carottes ni le par ;
- chaque géométrie reste soluble en règle classique (`assignSolvable` / `clearable`) ; le deal enfoui, lui, ne l’est pas (§ 3 bis).

**Tortue.** On garde la silhouette reconnaissable (15 colonnes, 5 couches, 144 tuiles). On ne l’élargit pas. Sa difficulté de fin de temple vient du rack à 4 et de la pile centrale, pas d’un nouveau rectangle plus large.

**Escalier, sommets, pagode, torii, bassin, éventail, hérisson.** Ce sont les plateaux à rétrécir en largeur et à réempiler. Le flocon secret (48 tuiles, 14 colonnes, 3 couches) est trop vide pour un secret de montagne : le rapprocher du volume du refuge sans dépasser 11 colonnes.

Le par reste `tuiles × (3,2 + monde × 0,3)` jusqu’à la revue. On ne le retouche que si la revue montre qu’un 3 étoiles est hors d’atteinte sans se presser de façon absurde. Les étoiles continuent d’ignorer les mélanges.

### Modes

| Mode | Règle |
|---|---|
| Campagne et secrets | Selon le monde, tableau ci-dessus. `?level=N` suit le niveau. |
| Défi du jour et rattrapage | Classique, `rack = 0`, pour toutes les dates, passées et futures. Les budgets restent 1 / 1 / 5. |
| Zen Facile | Classique. Piscine des petits plateaux. |
| Zen Moyen | Rack 6. |
| Zen Difficile | Rack 5. |
| Zen Expert | Rack 4. |
| Zen, tous | Indices, mélanges, annulations illimités. Pas de chrono. Le lien partagé emporte déjà `diff` et `layout` : la règle se déduit de la difficulté, pas d’un paramètre de plus. |
| Infini | Manches 1–2 : classique, petits plateaux. Manches 3–8 : rack 6. Manches 9–14 : rack 5. Manches 15 et après : rack 4. La progression d’un palier à l’autre est la profondeur, sous les plafonds de colonnes, plus le resserrement du rack. On ne classe plus les paliers par « toujours plus de tuiles ». Deux manches par palier, comme aujourd’hui. Texte du mode : « Des plateaux de plus en plus profonds, jusqu’où iras-tu ? » |

Une graine de campagne en rack doit rester gagnable à jeu parfait avec ce nombre d’emplacements. Le bot de calibration doit connaître le rack (une prise si la place existe, une paire dès qu’elle est libre, et une préférence pour la paire). La phase proto peut garder les graines actuelles le temps de jouer la sensation. La phase de généralisation regraine avant la revue. Le repro du niveau 8 (graine 70859) reste en classique de comportement seulement s’il est encore au monde 2 : il passe en rack avec les autres, et sa graine est alors recalibrée. On note l’ancien soft-lock dans le message de commit de cette graine, on ne le conserve pas au prix d’un niveau injouable.

---

## 6. HUD

Le rack remplace du chrome. Il n’ajoute pas une bande au-dessus du bandeau actuel.

**Partie classique.** HUD inchangé. Aucun emplacement vide, aucune réserve de place.

**Partie en rack, écran assez haut** (au-dessus de 500 px). La rangée de jetons du bandeau haut (combo, capydindon, paires, temps, score) cède sa place au rack, centré. À droite du rack, deux jetons seulement : temps et score. Le combo reste un jeton transitoire, à gauche du rack, visible seulement pendant un combo. Le capydindon, s’il est dans la partie, reste un jeton icône. Le compteur de paires disparaît : le plateau qui se vide et le rack suffisent. Pause, musique et nom du niveau restent à gauche. Le rail droit (indice, annuler, mélanger) ne change pas.

**Partie en rack, téléphone paysage ≤ 500 px de haut.** Le rail gauche actuel (84 px : pause, musique, nom court, jetons empilés) garde pause, musique, numéro de niveau et le temps. Le rack n’entre pas dans ce rail. Il occupe une rangée **dans** la zone de plateau, en haut, d’au plus 52 px. `layout()` soustrait cette hauteur avant de calculer la taille des tuiles, ainsi que le dépassement visuel des couches (`z × profondeur`), pour que la couche du dessus ne passe pas sous le rack. Le rail droit des trois boutons reste.

Taille des emplacements : tuiles du jeu, plafonnées, centrées, non étirées à la largeur de l’écran. Viser environ 46 × 60. Minimum 40 × 52. Six emplacements plus les gouttières tiennent dans la zone utile d’un paysage 844 px avec les deux rails. Un emplacement vide est un creux visible, même contraste que les tuiles bloquées, avec son numéro pour le lecteur d’écran.

Le zen continue de masquer temps et score. Le rack, lui, est affiché.

---

## 7. Sauvegardes et reprise

La partie classique continue d’enregistrer un historique de paires `[id, id]`. La partie en rack enregistre en plus :

- `rules: "rack"` et `rackSlots` (la capacité au début de la partie) ;
- `rack`: ids de gauche à droite ;
- `actions`: une entrée par tap, avec l’état du rack après ce tap et les ids dont `removed` a changé. C’est ce que l’annuler rejoue à l’envers.

Les tuiles du rack ne sont pas dans `removed`.

Au chargement :

- pas de `rules`, ou `rules` classique : reprise classique, si la longueur du layout correspond encore ;
- `rules: "rack"` et `rack.length ≤ rackSlots` du niveau actuel : reprise, même si la capacité du niveau a augmenté ;
- partie classique sauvegardée sur un niveau qui est devenu rack, ou rack plus long que la capacité actuelle, ou longueur de layout différente : on jette **la partie en cours**, on garde étoiles, carottes, succès, déblocages. Toast : « Ce niveau a changé : on reprend depuis le début. »

Le code d’export ignore déjà la partie en cours. Ajouter `seenRack` (booléen, absent = faux) ne casse pas un ancien fichier : un champ inconnu est ignoré par un vieux client, un nouveau client traite l’absence comme faux. Les étoiles gagnées avant la refonte restent valables, y compris si le plateau a changé de forme. On ne réinitialise pas `best`.

`seenHowTo` et le coach du niveau 1 ne sont pas rejoués.

---

## 8. Plan d’implémentation

Quatre phases. On ne commence pas la suivante tant que la précédente n’est pas jouable. On ne déploie pas à la fin de la phase 3 sans accord humain.

### Phase A — Proto monde 2

But : sentir le rack sur les niveaux 7 à 12, avec les plateaux actuels, même s’ils sont trop larges. C’est assumé, et temporaire.

- Champ `rack` sur chaque niveau. 0 au monde 1 et sur les secrets du monde 1. 6 sur les six niveaux du monde 2. Les mondes 3 à 5 restent classiques jusqu’à la phase B, pour ne pas livrer un rack sur des plateaux qu’on s’apprête à jeter.
- Moteur : prise, paire, plein, coup légal, mélange qui épargne le rack, annuler en une action, indice. `isFree` inchangé sur les tuiles hors rack.
- HUD selon § 6, seulement si `rack > 0`.
- Coach rack, 4ᵉ carte d’aide, drapeau `seenRack`.
- Sauvegarde selon § 7.
- Tests moteur du rack, et mise à jour des e2e qui jouent déjà un niveau du monde 2 avec l’ancien geste de paire (`?level=6` dans `e2e/features.spec.ts`). Les niveaux 1 à 6 (`n` 0–5) restent sur l’ancien geste : la majorité des e2e ne change pas.
- Le bot rack peut attendre la phase B. On ne regraine pas encore.
- Pas de redessin de plateau dans cette phase.

### Phase B — Tous les plateaux

- Redessiner les layouts des mondes 2 à 5 et leurs secrets selon le § 5 et l’annexe. Mondes 3 à 5 basculent alors sur leur `rack`.
- Aligner zen, infini et le texte des modes. Le défi du jour reste classique ; sa piscine peut utiliser les nouveaux layouts, qui sont solubles sans rack.
- Regrainer avec un bot qui joue le rack. Vérifier qu’un jeu parfait gagne, et que la courbe de réussite du bot reste douce, du même ordre qu’aujourd’hui (haut au début du monde 2, plus bas en fin de temple, sans pic isolé).
- Recalculer le par seulement si le nombre de tuiles a bougé, avec la formule actuelle.

### Phase C — Revue exhaustive

Jouer, au doigt sur un paysage téléphone (844 × 390 et une hauteur ≤ 500) et à la souris sur grand écran :

- les 30 niveaux et les 5 secrets ;
- un plateau de chaque difficulté zen, dont un lien zen rouvert ;
- une course infini qui traverse un changement de rack (manche 2 → 3, 8 → 9, 14 → 15) ;
- un défi du jour, pour vérifier qu’il n’a pas de rack ;
- une reprise après kill, une reprise d’une vieille sauvegarde classique sur un niveau devenu rack (toast, étoiles intactes) ;
- capydindon, combo ×4 qui rend une annulation, indice, mélange inutile non consommé, coach rack une seule fois.

Liste de critères : § 9. On corrige, on rejoue ce qui a cassé, on s’arrête.

### Phase D — Déployer

Uniquement après accord humain sur la revue. Pas de merge vers `main` au nom de cette refonte tant que cet accord n’est pas là.

---

## 9. Critères d’acceptation

La revue est bonne quand tous les points suivants sont vrais.

1. Monde 1, secret compris : aucun rack dans le DOM, sélection classique, annulations illimitées, coach de première paire seulement sur le premier niveau jamais gagné.
2. Mondes 2 à 5 : rack de 6, 5, 5 et 4. Une prise libère vraiment les côtés et le dessous. Une paire est un seul tap et un seul annuler.
3. Rack plein : un tap qui ne matche pas est refusé avec le toast prévu ; un tap qui matche réussit et libère une place.
4. Bloqué : la carte propose annuler puis mélanger quand ils sont utiles, recommencer et quitter sinon. Aucun mélange automatique. Un mélange ne change pas les faces du rack. Un mélange impossible n’est pas décompté.
5. Partie gagnée seulement quand le plateau et le rack sont vides.
6. Défi du jour, rattrapage, zen facile, deux premières manches infinies : classiques.
7. HUD : en paysage ≤ 500 px, le rack est dans la zone de plateau, le rail gauche ne s’élargit pas, les trois boutons restent accessibles. Sur le plus profond plateau du temple, tuile d’au moins 40 × 52 px, emplacement d’au moins 40 × 52 px, couche supérieure non coupée par le rack.
8. Reprise fidèle de l’ordre du rack. Vieille partie incompatible jetée, étoiles et carottes conservées, toast affiché.
9. Coach rack une fois. Aide à 3 cartes avant le monde 2, à 4 cartes après.
10. Chaque nouveau layout est soluble sans rack, tient dans son plafond de colonnes et de couches, et une graine parfaite est gagnable avec le rack du niveau.
11. Les e2e du monde 1 passent sans adaptation de geste. Ceux du monde 2 jouent le rack.

---

## 10. Risques

- **Lisibilité des piles.** Cinq couches décalées peuvent se lire comme une tache au centre, surtout sur la tortue. Le décalage actuel (`z` vers le haut-gauche) et l’assombrissement des tuiles bloquées restent obligatoires. Au-delà de 5 couches, on n’y va pas sans une nouvelle revue.
- **Tuiles trop petites.** Le rack vole environ 52 px de haut précisément là où le plateau est déjà limité par la hauteur. Le critère des 40 × 52 px est un seuil d’arrêt : si un plateau ne le tient pas, on le rétrécit, on n’ajoute pas de scroll.
- **Paysage téléphone.** Rails gauche et droit déjà serrés. Un rack dans le rail gauche, ou une seconde barre sous le bandeau, mangerait la largeur ou la hauteur. Le § 6 est là pour ça.
- **iOS.** La rotation et les barres d’outils changent la taille utile après coup. `layout()` doit compter le rack à chaque mesure, pas seulement au premier affichage.
- **Espace de recherche du bot.** L’état inclut le sous-ensemble garé dans le rack. La simulation sera plus lente. On borne les nœuds, comme le solveur actuel, et on n’exige pas une preuve exhaustive sur les plateaux de 144 tuiles : le même compromis que `clearable` (inconnu au-delà d’une taille) suffit, à condition qu’un jeu glouton-avec-préférence-pour-la-paire trouve une victoire sur la graine retenue.
- **Par et 3 étoiles.** Réfléchir au rack allonge les parties. Si la revue rate les 3 étoiles partout au temple, on relève le par de ces niveaux, pas les carottes.
- **Tests e2e du monde 2.** `?level=6` joue aujourd’hui des paires classiques. La phase A les met à jour dans le même changement que le geste.
- **Lien zen expert déjà partagé.** Il s’ouvrira en rack 4. C’est voulu : la difficulté Expert change de nature. Le plateau (layout + graine) reste le même.
- **Soft-lock du niveau 8.** Il ne survit pas tel quel une fois le niveau passé en rack. Le noter, ne pas le garder comme exception de règle.

---

## Annexe — mapping des 35 niveaux

`n` est l’index campagne (0–29) puis secret (30–34). Colonnes, couches et tuiles sont l’état **actuel**. « Cible » est la consigne de redessin de la phase B. Le monde 1 ne change pas de layout.

| n | Monde | Niveau | Layout | Tuiles | Col. | Couches | Mode cible | Rack | Note de redessin |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 | Premier plouf | galet | 36 | 6 | 3 | classique | — | Garder. Plateau d’apprentissage. |
| 1 | 1 | La carotte du goûter | carotte | 46 | 12 | 3 | classique | — | Garder. Au plafond de largeur du monde 1. |
| 2 | 1 | Le pont de bambou | pont | 48 | 10 | 2 | classique | — | Garder. |
| 3 | 1 | La grande feuille ronde | nenuphar | 70 | 11 | 3 | classique | — | Garder. |
| 4 | 1 | Le canard des roseaux | canard | 56 | 12 | 2 | classique | — | Garder. Large et plat, acceptable pour apprendre. |
| 5 | 1 | Cœur de nénuphar | coeur | 78 | 10 | 3 | classique | — | Garder. |
| 30 | 1 | La fleur de lotus | fleur | 78 | 10 | 3 | classique | — | Secret. Garder. |
| 6 | 2 | Les lanternes du soir | lanterne | 90 | 14 | 2 | rack | 6 | Trop large, 1 de pile. Réduire vers ≤ 10 col., 3–4 couches, moins de tuiles : c’est le tutoriel. |
| 7 | 2 | La pile de serviettes | pyramide | 64 | 8 | 4 | rack | 6 | Déjà le bon volume. Servir de modèle. Graine à recalibrer avec le bot rack. |
| 8 | 2 | Les yuzus du bain | yuzu | 66 | 10 | 3 | rack | 6 | Largeur déjà bonne. Ajouter une couche si la revue le trouve trop sage. |
| 9 | 2 | Petit nuage tiède | nuage | 86 | 14 | 3 | rack | 6 | Ramener à ≤ 10 col. en réempilant. |
| 10 | 2 | Ourson en peignoir | ours | 86 | 10 | 3 | rack | 6 | Largeur bonne. Viser 4 couches sans élargir. |
| 11 | 2 | Le bain fumant | bassin | 96 | 15 | 3 | rack | 6 | 15 col. et 1 de pile. Priorité de réempilage. |
| 31 | 2 | La tasse de thé | tasse | 76 | 14 | 2 | rack | 6 | Secret trop plat (2 couches). Réempiler, ≤ 10 col. |
| 12 | 3 | Le champignon moussu | champignon | 90 | 12 | 3 | rack | 5 | Ramener à ≤ 10 col., 4 couches. |
| 13 | 3 | Le vieil arbre | chene | 92 | 12 | 2 | rack | 5 | 1 de pile. Réempiler. |
| 14 | 3 | La cabane dans les chênes | cabane | 96 | 14 | 3 | rack | 5 | Trop large, 1 de pile. |
| 15 | 3 | L'érable rouge | feuille | 80 | 14 | 2 | rack | 5 | Trop large et plat. |
| 16 | 3 | Papillons de fougère | papillon | 68 | 11 | 3 | rack | 5 | Proche du plafond. Une couche de plus plutôt que deux colonnes de moins si la forme casse. |
| 17 | 3 | Le grand capybara des bois | capy | 112 | 15 | 3 | rack | 5 | 112 tuiles sur 15 col. Réempiler sous 10 col., ±15 % de tuiles. |
| 32 | 3 | Le hérisson du sous-bois | herisson | 100 | 15 | 3 | rack | 5 | Secret trop large. |
| 18 | 4 | Le sapin enneigé | sapin | 74 | 14 | 3 | rack | 5 | Trop large pour sa taille. Bon candidat à une pile étroite. |
| 19 | 4 | Flocon étoilé | etoile | 82 | 14 | 3 | rack | 5 | Réduire la largeur, garder la symétrie. |
| 20 | 4 | Le bonhomme de neige | bonhomme | 82 | 14 | 2 | rack | 5 | 1 de pile. Réempiler. |
| 21 | 4 | Le col de la Patate | montagne | 120 | 12 | 3 | rack | 5 | Presque dans le plafond (11). Gagner une couche en perdant une colonne. |
| 22 | 4 | Les trois sommets | sommets | 118 | 16 | 3 | rack | 5 | 16 col. Priorité de rétrécissement. |
| 23 | 4 | Le refuge douillet | refuge | 130 | 14 | 4 | rack | 5 | Déjà profond. Rétrécir à ≤ 11 sans perdre la 4ᵉ couche. |
| 33 | 4 | Le cristal de givre | flocon | 48 | 14 | 3 | rack | 5 | Trop peu de tuiles pour un secret. Viser le volume du refuge, ≤ 11 col. |
| 24 | 5 | Les portes du temple | forteresse | 96 | 10 | 3 | rack | 4 | Largeur saine. Ajouter une couche. |
| 25 | 5 | Le chat porte-bonheur | chat | 90 | 10 | 3 | rack | 4 | 1 de pile. Réempiler dans les 10 col. |
| 26 | 5 | Les mille marches | escalier | 114 | 18 | 4 | rack | 4 | Le plus large du jeu. Le rétrécir est le chantier principal du temple. |
| 27 | 5 | Le portique vermillon | torii | 110 | 16 | 3 | rack | 4 | Trop large. |
| 28 | 5 | La pagode aux cinq toits | pagode | 134 | 16 | 3 | rack | 4 | La forme veut de la hauteur : 5 couches, ≤ 12 col., pas 16. |
| 29 | 5 | La grande tortue d'or | tortue | 144 | 15 | 5 | rack | 4 | Exception de silhouette. Ne pas élargir. Rack 4 + centre déjà très couvert. |
| 34 | 5 | L'éventail doré | eventail | 114 | 16 | 3 | rack | 4 | Secret trop large. Replier vers ≤ 12 col. et 4–5 couches. |

Champ de donnée visé, pour que la phase A ne soit pas un cas particulier : `rack` entier sur le niveau, `0` en classique. La campagne le déduit du monde (0 / 6 / 5 / 5 / 4). Le défi force 0. Le zen le déduit de la difficulté (0 / 6 / 5 / 4). L’infini le déduit de la manche (§ 5). Aucun écran ne teste « si monde ≥ 2 » en dur une fois ce champ en place.
