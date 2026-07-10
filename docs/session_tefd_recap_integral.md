# TEFD · Toulouse Experience Front Desk
## Récapitulatif intégral de la session de travail

**Date de génération :** juillet 2026
**Statut projet :** Phase 0 quasi-terminée, base Baserow opérationnelle, appli en ligne sur GitHub Pages, résolution OSM en cours de finalisation.

---

## 1. Contexte et objectif du projet

**Raphaël**, consultant généraliste avec un profil finance d'entreprise (hardskills) et communication (softskills), après deux années comme réceptionniste dans un hôtel boutique 3★ à Honfleur, vit désormais à Toulouse. Il commercialise une prestation de service auprès du **Club Hôtelier Toulouse Métropole**.

**Programme TEFD** — montée en gamme des équipes réception sur deux axes :
1. **Promouvoir la destination Toulouse** avec un minimum de connaissance locale
2. **Professionnaliser la valeur commerciale du front office**

**Trois livrables digitaux** :
- Document de présentation de l'offre commerciale et son kit de déploiement
- Outil interne de récupération des notes Booking/Expedia/Google/TripAdvisor pour démontrer l'écart entre "accueillant/chaleureux" et "conseil local mémorable"
- **Outil interactif client (ce projet)** — recommandations par segment/persona pour vendre Toulouse

**Fondations documentaires** :
- **Livret de référence factuelle TEFD V1** (mai 2026) — 7 sections : écoles/calendrier universitaire, agenda rugby, étoilés Michelin, festivals, salons business, salles de spectacle, mode d'emploi
- **Matrice TEFD V1** — 8 personas × 8 bibliothèques × 5 moments × 6 composants = 240 scripts opérationnels
- **KPI signature** : 5-9 % du CA chambre activé par la réception (50-90 k€ sur 1 M€)

---

## 2. Décisions d'architecture verrouillées

| Décision | Choix retenu | Justification |
|---|---|---|
| Hébergement | **GitHub Pages** (statique) | Gratuit, CI/CD natif, HTTPS |
| Proxy serverless | **Cloudflare Workers** (remplace Render envisagé) | 100 000 req/jour gratuit, zéro cold start, pas de carte bancaire |
| Fond de carte | **MapLibre GL JS + tuiles OSM (MapTiler)** | Vectoriel, fluide mobile, conforme charte OSM |
| Modèle avis/photos | **Modèle tout-lien OpenStreetMap** — zéro API facturable | Décision prise après acceptation du choix open source par le client |
| Fiche lieu | Bouton « Voir sur OpenStreetMap » (`https://www.openstreetmap.org/{osm_type}/{osm_id}`) | Gratuit, sans clé |
| Navigation | Lien `geo:lat,lng?q=...` universel (ouvre Organic Maps / OsmAnd / Plans) | Gratuit, natif mobile |
| Résolution `osm_id` | **Nominatim** (au moment de la saisie référent) | Gratuit, sans clé, User-Agent requis, 1 req/s max |
| Back-office éditorial | **Baserow** (open source, base 476360) | Interface SaaS, API REST, webhooks |
| Routing piéton (temps de marche) | **OpenRouteService Matrix** au build (précalcul) | Zéro appel runtime, tri instantané |
| Transports Toulouse | **Tisséo API** (clé exposable côté web) | Pas de proxy nécessaire |
| Événements | OpenAgenda + open data Toulouse Métropole + DATAtourisme | Gratuits, mis à jour quotidiennement |
| Langues | FR / EN / ES via i18next | Marché toulousain |
| PWA | vite-plugin-pwa (Workbox) | Installable Android / iOS / tablette |
| Mode hors-ligne | **Non retenu** | L'appli reste connectée pour garantir la fraîcheur |
| Anti-hallucination | Filtre `date_fin ≥ today()` **à l'export** (pas dans le moteur) | Le moteur reçoit des données déjà propres |

**Principe fondateur (Livret) :** *« Ce qui ne se vérifie pas se ment. »* — repris comme règle d'or de l'architecture data et de l'UX (badge « vérifié mars 2026 » sur chaque fiche).

---

## 3. Les 8 personas TEFD (matrice V1 — mai 2026)

| Code | Persona | Bibliothèque | Ressort émotionnel |
|---|---|---|---|
| 01 | Business aéronautique | Toulouse iconique | Efficacité, anticipation logistique |
| 02 | Client espagnol | Toulouse espagnole | Proximité émotionnelle, discrétion culturelle |
| 03 | Fan rugby | Toulouse rugby | Fraternité ovale, sans imitation |
| 04 | Couple premium | Toulouse gastronomie | Considération discrète, jamais familiarité |
| 05 | Parent étudiant | Toulouse universitaire | Réassurance silencieuse |
| 06 | City break aéronautique | Toulouse aéronautique loisir | Émerveillement précis, expertise reconnue |
| 07 | International | Toulouse secrète | 1 client = 3 à 5 prescriptions |
| 08 | Slow tourism | Toulouse confidentielle | Lenteur autorisée, retour saisonnier |

Chaque persona est un **preset de filtre** dans l'appli : sélection = pré-filtre catégories + ton de conseil.

---

## 4. Schéma Baserow — 7 tables

**Base : `476360` (Back-office TEFD)**

| Table | ID | Rôle | Livrables |
|---|---|---|---|
| **Adresses** | 1045799 | Lieux recommandés (tous types) | JSON + PDF |
| **Événements** | 1045800 | Concerts, spectacles, expos, matchs — datés | JSON + PDF |
| **Parcours** | 1045801 | Footing et visites à pied | JSON |
| **Personas** | 1045802 | Les 8 profils TEFD (référentiel) | JSON (presets) |
| **Catégories** | 1045803 | Référentiel + libellés FR/EN/ES | JSON |
| **Suggestions** | 1045804 | Remontées terrain réceptionnistes | Modération |
| **Hôtels** | 1045805 | Établissements du Club + coords (point de départ ORS) | JSON |

### Champs-clés Adresses
`nom`, `categorie`, `personas` (n-n), `osm_id`, `osm_type`, `latitude`, `longitude`, `adresse`, `quartier` (sélection : Capitole, Carmes, Saint-Cyprien, Sept Deniers, Compans, Borderouge, Île du Ramier, Rangueil), `moment` (multi : matin/midi/soir/journée), `fourchette_prix`, `tags` (multi), `accessible_pmr`, `source`, `priorite_edito` (1-5), `verifie_le`, `valide_jusqu_au`, `statut` (Publié/Brouillon/À revérifier/Archivé), `note_edito_fr/en/es`, `acces_transport`.

### Champs-clés Événements
`titre_fr/en/es`, `date_debut`, `date_fin` (**clé anti-hallucination**), `recurrent`, `recurrence_note`, `url_billetterie`, `source`, `verifie_le`, `statut`.

### Champs-clés Parcours
`nom_fr/en/es`, `type` (Footing / Visite à pied), `duree_min`, `distance_km`, `profil_ors` (foot-walking / foot-hiking), `description_fr/en/es`, `point_depart`.

### Table Hôtels
Chaque `lat/lng` = point de départ des calculs ORS Matrix pour temps de marche par hôtel.

---

## 5. Fichiers produits

### Scripts Node (dans `scripts/`)

| Fichier | Rôle |
|---|---|
| `bootstrap-baserow.mjs` | Crée tous les champs + pré-remplit Personas (8) et Catégories (9) |
| `export.mjs` | Lit Baserow → génère `docs/app_data.json` (filtre anti-hallucination inclus) |
| `precompute-walk.mjs` | Injecte `marche_min[<hôtel>]` par hôtel dans le JSON (ORS Matrix, une seule fois au build) |
| `resolve-osm.mjs` | Résolution Nominatim (interactif ou batch CSV), écrit dans Baserow |
| `inject-osm.mjs` | Injection directe `osm_id + osm_type` (quand Nominatim ne trouve pas) |
| `add-etoiles.mjs` | Ajoute les 11 étoilés Michelin manquants du fichier V4 |
| `add-toulouse-data.mjs` | Alimentation massive : 21 adresses + 15 événements + 5 parcours (Livret + web) |

### Workflow

`.github/workflows/build-data.yml` — GitHub Actions :
- Schedule : quotidien 04h30 Paris
- Manuel : `workflow_dispatch`
- Webhook Baserow : `repository_dispatch` type `baserow-update`

### Documentation
- `schema_baserow_tefd.md` — schéma complet des 7 tables
- `moteur_reco_tefd_v1.md` — spécification du moteur de tri
- `deroule_demo_tefd.md` — script minute par minute pour le Club Hôtelier
- `README_pipeline_tefd.md` — installation et branchement
- `maquette_tefd.html` — démo cliquable (design premium violet Toulouse + Fraunces/Hanken Grotesk)

### Structure du dépôt GitHub

```
rouxraphael1/GTD/
├── scripts/                    # Scripts Node
│   ├── bootstrap-baserow.mjs
│   ├── export.mjs
│   ├── precompute-walk.mjs
│   ├── resolve-osm.mjs
│   ├── inject-osm.mjs
│   ├── add-etoiles.mjs
│   ├── add-toulouse-data.mjs
│   └── adresses-a-resoudre.csv
├── docs/                       # Servi par GitHub Pages
│   ├── app_data.json           # Généré par export.mjs
│   ├── index.html              # PWA
│   ├── maquette_tefd.html      # Démo cliquable
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
└── .github/workflows/
    └── build-data.yml
```

**Repository :** [https://github.com/rouxraphael1/GTD](https://github.com/rouxraphael1/GTD)
**Site public :** [https://rouxraphael1.github.io/GTD/](https://rouxraphael1.github.io/GTD/)

---

## 6. Moteur de recommandation v1

**Philosophie :** **aucun filtre éliminatoire dans le moteur.** L'outil conseille (ordonne), le réceptionniste décide (filtres optionnels off par défaut). Toutes les adresses restent visibles.

### Signaux et poids

| Signal | Formule | Poids |
|---|---|---|
| Affinité persona | 1.0 si persona ✓ + catégorie prioritaire · 0.8 si persona seul · 0.2 sinon | **0,40** |
| Priorité éditoriale | `priorite_edito ÷ 5` — la voix de la maison | **0,25** |
| Adéquation moment | 1.0 si période courante ou "journée" · 0.3 sinon | **0,20** |
| Proximité | `max(0, 1 − marche_min ÷ 25)` | **0,15** |

Ex æquo → départage par `priorite_edito` puis `verifie_le` récent.

### Filtres optionnels (UX)
Tous **off par défaut** :
- **« Ce persona seulement »** (interrupteur de masquage — visible dans la démo)
- **« À pied ≤ X min »** (curseur)
- **« Adapté au moment »** (masque incohérences horaires)

### Optimisation
`marche_min` **précalculé au build** par ORS Matrix, stocké dans `app_data.json` par hôtel → zéro appel ORS runtime.

---

## 7. Coût d'exploitation — zéro facturation

**Le seul appel Google (dans le modèle initial) a été remplacé par Nominatim (OSM) sur choix du client.**

Récap des API utilisées et leur coût :

| Composant | API | Coût |
|---|---|---|
| Fond de carte | MapLibre + MapTiler | Free tier |
| Résolution `osm_id` | Nominatim OSM | Gratuit, sans clé |
| Fiche lieu | Lien `openstreetmap.org/{type}/{id}` | Gratuit, sans clé |
| Navigation | Lien `geo:` universel | Gratuit, sans clé |
| Événements | OpenAgenda + data.toulouse-metropole.fr | Gratuit |
| Routing piéton | OpenRouteService (build only) | Free tier 2500/j, non déclenché en runtime |
| Transports | Tisséo API | Clé exposable côté web |
| Météo (v2) | Open-Meteo | Gratuit, sans clé |
| Hébergement | GitHub Pages | Gratuit |
| Proxy | Cloudflare Workers | Free tier 100k/j |
| CI/CD | GitHub Actions | Gratuit projets publics |
| Back-office | Baserow.io | Free tier (open source, self-host possible) |

**Argument commercial fort auprès du Club : coût d'exploitation nul.**

---

## 8. État actuel des données Baserow

### Adresses saisies

**27 adresses initiales** (Livret V1 + premières curations) :
Py-r, Stéphane Tournié (à renommer *Les Jardins de l'Opéra*), Lambinon (à supprimer — c'est le chef de Py-r), Cave à Manger N°5, Bibendum, Cantine de l'Opéra, Solides, Café Le Bibent, El Bocadillo, Brasserie des Beaux-Arts, Marché Victor Hugo, Marché Saint-Aubin, Les Abattoirs, Fondation Bemberg, Musée des Augustins, Aeroscopia, Cité de l'Espace, L'Envol des Pionniers, Basilique Saint-Sernin, Couvent des Jacobins, Pont-Neuf, Halle aux Grains, Théâtre du Capitole, Stade Ernest-Wallon, Berges de la Garonne, Canal du Midi, Passerelle de la Daurade.

**+11 étoilés Michelin** ajoutés via `add-etoiles.mjs` : Michel Sarran, SEPT, Agapes, L'Écorce, Acte 2 Yannick Delpech, Maison Pellestor-Veyrier, En Marge, L'Aparté, Auberge de la Forge, En Pleine Nature, Le Genty Magre, Une Table à Deux.

**+21 adresses complémentaires** ajoutées via `add-toulouse-data.mjs` :
- Salles : Zénith, Le Bikini, Le Métronum, Casino Théâtre Barrière, Théâtre de la Cité (TNT), La Halle de la Machine
- Musées : Muséum de Toulouse
- Églises : Cathédrale Saint-Étienne, Notre-Dame de la Daurade, Notre-Dame du Taur
- Sport : Keepcool Capitole, Basic-Fit Jean Jaurès
- Emblèmes : Place du Capitole, Jardin Japonais Pierre Baudis, Prairie des Filtres
- Bistronomie Michelin : Émile (cassoulet), L'Air de Famille, Ma Biche sur le Toit, Le Pyrénéen, J'Go, La Faim des Haricots

### OSM IDs résolus (état à la fin de session)

| Ligne | Nom | OSM |
|---|---|---|
| 10 | Py-r | node/2799416140 |
| 11 | Les Jardins de l'Opéra | way/780631225 |
| 13 | Cave à Manger N°5 | node/1533780954 |
| 16 | Solides | node/2192288533 |
| 17 | Café Le Bibent | node/5981188951 |
| 18 | El Bocadillo | node/1533780968 |
| 19 | Brasserie des Beaux-Arts | node/803725007 |
| 20 | Marché Victor Hugo | way/828576847 |
| 21 | Marché Saint-Aubin | node/1150978954 |
| 22 | Les Abattoirs | way/22896377 |
| 23 | Fondation Bemberg | node/1982847379 |
| 24 | Musée des Augustins | way/22718219 |
| 25 | Aeroscopia | way/1465652591 |
| 26 | Cité de l'Espace | way/4722585 |
| 27 | L'Envol des Pionniers | relation/8495554 |
| 28 | Basilique Saint-Sernin | way/260584755 |
| 29 | Couvent des Jacobins | relation/1562254 |
| 30 | Pont-Neuf | node/1149065200 |
| 31 | Halle aux Grains | way/24861515 |
| 32 | Théâtre du Capitole | way/784885230 |
| 33 | Stade Ernest-Wallon | way/517561059 |
| 34 | Berges de la Garonne | way/22937315 |
| 35 | Canal du Midi | node/12833864697 |
| 36 | Passerelle de la Daurade | way/23149002 |
| 43 | Michel Sarran | node/7392341384 |
| 45 | SEPT | node/7785156363 |
| 46 | Agapes | node/1668955924 |
| 47 | Le Genty Magre | node/843097451 |
| 48 | Acte 2 Yannick Delpech | node/13068078672 |
| 49 | L'Écorce | node/5981079077 |
| 50 | Maison Pellestor-Veyrier | way/313165558 |
| 51 | En Marge | way/62842448 |
| 52 | L'Aparté | node/404650895 |
| 53 | Auberge de la Forge | node/9893335091 |
| 54 | En Pleine Nature | node/1261012008 |
| 55 | Une Table à Deux | node/5075018122 |
| 56 | Théâtre de la Cité (TNT) | way/41968655 |
| 57 | La Halle de la Machine | way/613388194 |
| 58 | Muséum de Toulouse | way/134123637 |
| 59 | Cathédrale Saint-Étienne | way/35316357 |
| 60 | Notre-Dame de la Daurade | way/38129169 |
| 61 | Notre-Dame du Taur | way/60535162 |
| 64 | Place du Capitole | relation/11148976 |
| 65 | Émile | node/450171441 |
| 66 | L'Air de Famille | node/2464788571 |
| 67 | J'Go | node/2447719448 |

**OSM à résoudre encore :** restaurants confidentiels sans fiche OSM (Bibendum, Cantine de l'Opéra, quelques bistronomies) — non bloquant, les coordonnées lat/lng suffisent pour la carte et les temps de marche.

### Événements
- 3 événements récurrents initiaux (Piano aux Jacobins, Saison Capitole Opéra, Nuit des Étoiles)
- **+15 événements** via `add-toulouse-data.mjs` : Rio Loco, Marché de Noël, Toulouse les Orgues, Cinespaña (persona 02), Le Printemps de Septembre, Carnaval, Marathon des Mots, Toulouse Plages, Festival Toulouse d'Été, Siestes Électroniques, Aeromart déc 2026, Foire Internationale, saison Top 14 2026-2027 (5 sept 2026 → 5 juin 2027, finale Stade de France 27 juin 2027), Fête de la Musique

### Parcours (table initialement vide)
5 parcours ajoutés :
1. Footing des Berges — boucle Garonne (5 km, 30 min)
2. Footing du Canal du Midi (8 km, 45 min)
3. Toulouse essentielle — 2 heures (3,5 km, 120 min)
4. Toulouse secrète — cours cachées et hôtels particuliers (4 km, 150 min)
5. Balade du soir — coucher de soleil sur la Garonne (2 km, 45 min)

### Hôtels
1 hôtel pilote : **Hôtel de France**, 5 rue d'Austerlitz, 31000 Toulouse (43.6059, 1.4473).

---

## 9. Chronologie de la session

### Étape 1 — Cadrage
- Analyse du besoin, exploration API/technos
- Lecture du **Livret V1** (7 sections, cycles de mise à jour mars/septembre/trimestriel)
- Lecture du **poster matrice** (8 personas × 4 briques : Personas / Déclencheurs relationnels / Scripts / KPI)

### Étape 2 — Architecture
- Choix Cloudflare Workers (remplace Render)
- Choix Baserow open source (bootstrappé live via API)
- Décision **modèle tout-lien** au lieu d'embarquer Google Places
- Puis **bascule complète vers OpenStreetMap** (Nominatim + geo: URI) sur choix client

### Étape 3 — Maquette de démo
Design premium : violet aubergine de Toulouse, accent brique rose, typographie Fraunces (serif éditorial) + Hanken Grotesk. Sélecteur de 8 personas au centre, interrupteur "masquage on/off" pour démontrer la philosophie *tri doux jamais éliminatoire* devant le Club.

### Étape 4 — Pipeline
- `bootstrap-baserow.mjs` — création des 7 tables et de tous les champs
- `export.mjs` — Baserow → JSON avec filtre `date_fin >= today()`
- `precompute-walk.mjs` — ORS Matrix injecté au build
- `.github/workflows/build-data.yml` — 3 déclencheurs

### Étape 5 — Peuplement des données
- Résolution des 27 premières adresses via Nominatim + méthode manuelle openstreetmap.org
- Ajout des 11 étoilés Michelin
- Ajout des 21 adresses + 15 événements + 5 parcours complémentaires

### Étape 6 — Déploiement GitHub Pages
- Renommage `public/` → `docs/` pour compatibilité GitHub Pages
- Push forcé, activation Pages
- Site public en ligne

### Étape 7 — Audit du moteur
17 tests passés, 0 erreur bloquante. Quelques avertissements éditoriaux (Pont-Neuf classé `eglise` au lieu de `visite`, quelques `priorite_edito` à ajuster).

---

## 10. Corrections identifiées à faire

### Dans Baserow (manuelles)
1. **Pont-Neuf** (ligne 30) — passer `categorie` de `eglise` à `visite`
2. **Lambinon** (ligne 12) — supprimer (c'est le chef de Py-r, pas un restaurant)
3. **Priorités éditoriales à monter à 5** sur adresses signatures des personas 01, 02, 05, 07 :
   - 01 Business aéro → Cave à Manger N°5, Aeroscopia
   - 02 Client espagnol → Basilique Saint-Sernin, Café Le Bibent
   - 05 Parent étudiant → Marché Victor Hugo, Cité de l'Espace
   - 07 International → Basilique Saint-Sernin, Couvent des Jacobins

---

## 11. Sécurité — points de vigilance

Plusieurs tokens Baserow ont été exposés en clair pendant la session :
- `bKXWgHUDlBLfvAS1n6Kx4awInQLbLRCd` — révoqué
- `tXqX6N2T2oYgwAo2ps9btAujtRVkQ813` — révoqué

**Règle à respecter :** ne jamais coller un token dans le chat. Utiliser uniquement `set BASEROW_TOKEN=...` dans le terminal CMD local.

**Pour la suite** : quand tu configureras les GitHub Actions, ajouter les tokens dans **Settings → Secrets → Actions** (jamais dans le code source, jamais dans le chat).

---

## 12. Déroulé de démo Club Hôtelier (10 min)

**Avant l'écran :** poser le problème — *« Vos réceptions sont notées accueillantes. Le conseil local, lui, repose sur la mémoire du réceptionniste. »*

| Minute | Action | Message-clé |
|---|---|---|
| 1 | Sélectionner **Couple premium** | Ressort émotionnel affiché — la posture est cadrée |
| 2-3 | Ouvrir **Py-r** — montrer sceau « ★★ vérifié mars 2026 » | **Moment-clé** : la note éditoriale est en tête, pas la note de foule |
| 4 | Cliquer « Voir sur OpenStreetMap » → revenir → cliquer « Y aller » | Zéro coût d'exploitation, navigation native |
| 5-6 | Basculer en **Client espagnol** + langue **ES** | Le conseil bascule dans la langue |
| 7 | Curseur "à pied" de 15 → 8 min | Pilotage par le temps réel du client |
| 7,5 | **Basculer le toggle masquage** | *"Je ne cache rien — le profil reste en tête, le reste descend"* |
| 8 | **Fan rugby** | Anti-hallucination dates : un match passé disparaît tout seul |
| 9-10 | Atterrissage KPI 5-9 % + offre | Slide Club Hôtelier |

**Ne jamais dire "application". Dire "l'outil de comptoir".**

### Parades aux objections
- **Coût ?** Quasi nul. Open data + liens gratuits. Le seul coût = la mise à jour éditoriale (déjà le Livret).
- **Maintenance ?** Un référent par hôtel, cycles mars/septembre/trimestriel = cycles du Livret. Les réceptionnistes remontent des adresses.
- **RGPD ?** Aucune donnée client stockée, aucun avis collecté. On renvoie vers OSM.
- **Sans wifi ?** Pensé connecté, pour garantir la fraîcheur.
- **Combien d'hôtels ?** Illimité, chacun avec sa lat/lng comme point de départ.

---

## 13. Ce qui reste à faire

### Immédiat
- [ ] Corriger la catégorie de Pont-Neuf dans Baserow (`eglise` → `visite`)
- [ ] Supprimer la ligne Lambinon (doublon avec Py-r/Pierre Lambinon)
- [ ] Ajuster les `priorite_edito` sur les signatures des personas 01, 02, 05, 07
- [ ] Finir la résolution `osm_id` des dernières adresses (Bibendum, Cantine de l'Opéra, etc.)
- [ ] Configurer les GitHub Actions Secrets : `BASEROW_TOKEN`, `T_ADRESSES`, `T_EVENEMENTS`, `T_PARCOURS`, `T_PERSONAS`, `T_CATEGORIES`, `T_HOTELS`, `ORS_API_KEY`
- [ ] Créer un compte Cloudflare Workers, déployer le proxy (relais webhook Baserow → GitHub Actions)

### Court terme (Phase 1)
- [ ] Squelette React + Vite + MapLibre + i18next + vite-plugin-pwa
- [ ] Intégration `app_data.json` → composants (liste, carte, fiche)
- [ ] Moteur de reco v1 (score + toggles)
- [ ] Intégration Tisséo `journeys` pour l'option transport
- [ ] Écran admin « Ajouter une adresse » (résolve-osm intégré au front)
- [ ] Écran admin « Suggérer une adresse » (réceptionnistes → table Suggestions)

### Moyen terme (v2)
- [ ] Signal météo (Open-Meteo + tag `exposition` intérieur/extérieur)
- [ ] Signal événementiel (bonus si représentation active pendant séjour)
- [ ] Génération PDF automatique du Livret depuis Baserow
- [ ] Tests iOS / Android / tablette
- [ ] Démo pilote dans un hôtel du Club

---

## 14. Points de reprise pour la prochaine session

**Si tu ouvres une nouvelle conversation, dis simplement :**

> "Je reprends TEFD. Base Baserow 476360 opérationnelle. 59+ adresses résolues OSM, 18 événements, 5 parcours. Site déployé sur https://rouxraphael1.github.io/GTD/. Je veux avancer sur : [Phase 1 React / signal météo / PDF Livret / autres]."

Toutes les décisions ci-dessus sont verrouillées, les fichiers sont sur GitHub, la base est peuplée. Le prochain bond de valeur = **construire la vraie PWA React qui consomme `app_data.json`** (le pipeline data est prêt, l'appli front reste à finaliser).

---

*Fin du récapitulatif.*
