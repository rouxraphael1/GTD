# TEFD — Historique complet de développement

## Objectif
Application PWA de recommandation hôtelière pour réceptionnistes à Toulouse :
- Restaurants, musées, théâtres, concerts, églises, salles de sport, événements sportifs, parcours de footing, visites de ville
- Filtrage par client (persona), temps de marche/distance depuis l'hôtel
- Hébergée sur GitHub Pages, trilingue (FR/EN/ES)
- Données : OpenStreetMap, géolocalisation

## Contraintes
- **GitHub Pages** (statique uniquement, pas de code serveur)
- **Cloudflare Workers** pour proxy des clés API (gratuit, pas de cold start)
- Modèle "tout-lien" pour Google : zéro facturation API à l'exécution
- Règle anti-hallucination : événements expirés jamais affichés
- Filtres persona = souples (reordonnancement, jamais éliminatoire)
- **Baserow** = source unique de vérité → génère app_data.json + PDF livret
- JWT auth (email/password) obligatoire pour toutes les mutations Baserow

---

## Étape 1 : Architecture et schéma Baserow

### Tables créées (7 tables initiales)

| Table | ID | Description |
|-------|-----|-------------|
| Adresses | 1045799 | Restaurants, lieux, monuments, etc. |
| Événements | 1045800 | Concerts, expositions, matchs, etc. |
| Parcours | 1045801 | Ballades à pied, parcours de footing |
| Personas | 1045802 | 8 profils clients |
| Catégories | 1045803 | 9 catégories de lieux |
| Suggestions | 1045804 | Système de suggestions |
| Hôtels | 1045805 | 93 hôtels du Club Hôtelier |

### Fichier de schéma
`docs/schema_baserow_tefd.md`

---

## Étape 2 : Scripts d'export et de pré-calcul

### export.mjs
- Baserow → app_data.json
- **Migration vers JWT auth** (email/password) au lieu de token (qui est read-only pour les champs)
- Sortie double : `docs/app_data.json` + `app_data.json` (racine)
- Supporte les deux modes : JWT (recommandé) et Token (fallback)

### precompute-walk.mjs
- ORS Matrix pour les temps de marche par hôtel
- Copie aussi vers `app_data.json` racine

### push-hotels.mjs
- Push de 92 hôtels du Club Hôtelier Toulouse Métropole via JWT auth
- Dédoublement contre les hôtels existants

---

## Étape 3 : Interface utilisateur (index.html)

### Structure
- **Onglet "Quel type de lieu ?"** avec chips de catégorie
- **Onglet "Suggestions pendant le séjour"** filtré par persona
- Fiche lieu détaillée avec :
  - Boutons Maps/Nav + **Site web** (avec lien fonctionnel)
  - QR code inline (bibliothèque embarquée)

### PWA
- `manifest.json`, `sw.js`, icônes PWA
- Installation possible sur mobile

### URLs fonctionnelles
28 URLs testées et validées incluses dans app_data.json :
- Py-r, Les Jardins de l'Opéra, Cave à manger N5, Bibendum, Solides, El Bocadillo
- Brasserie des Beaux-Arts, Les Abattoirs, Fondation Bemberg, Musée des Augustins
- Aéroscopia, Cité de l'Espace, L'Envol des Pionniers
- Basilique Saint-Sernin, Couvent des Jacobins, Halle aux Grains, Théâtre du Capitole
- Stade Ernest-Wallon, Michel Sarran, SEPT, Théâtre de la Cité
- Halle de la Machine, Muséum de Toulouse, Cathédrale Saint-Étienne
- Basic-Fit, Keepcool

---

## Étape 4 : Données Baserow

### 8 Personas créés
### 9 Catégories créées
### 50 Adresses initiales
### 18 Événements (filtrés : date_fin >= aujourd'hui)
### 4 Parcours
1. Footing Garonne
2. Canal du Midi
3. Toulouse essentielle
4. Balade du soleil couchant

### Corrections appliquées
- Pont-Neuf : eglise → visite
- Marché Victor Hugo + Saint-Aubin : restaurant → visite
- Priorite_edito mise à jour pour personas 01, 02, 05, 07

---

## Étape 5 : Club Hôtelier Toulouse Métropole

### Recherche
- Site web : clubhotelier-toulouse.com
- 80 membres visibles sur le site (pagination)
- **98 membres en 2026** (post LinkedIn mars 2026)

### Résultat
- **92 hôtels poussés** dans Baserow (table 1045805)
- Total final : **93 hôtels** (92 + Hôtel de France pré-existant)

### Problème identifié
92 hôtels créés avec uniquement `nom` + `actif=true` — **adresse, lat, lng, personas_dominants vides**

---

## Étape 6 : Géolocalisation des hôtels

### Approche
1. **Nominatim (OpenStreetMap)** pour 55 hôtels — recherche par nom + "Toulouse France"
2. **Coordonnées manuelles** pour 37 hôtels restants (chaînes, aéroport, noms non reconnus)

### Résultat
- **93/93 hôtels avec lat/lng + adresse**
- Script : `geocode-hotels.mjs` (Nominatim) + `geocode-hotels-v2.mjs` (overrides)

### Liste des hôtels avec coordonnées manuelles
Hôtel Ibis Styles Centre Gare Matabiau, Holiday Inn Express Airport, Mercure Aéroport Golf de Seilh, Logis Élégance Villa du Taur, Zenitude Métropole, Radisson Blu Airport, Ibis Styles Nord Sesquières, Ibis Budget Labège, Résidence Park Wilson Airport, Ibis Styles Canal du Midi, L'INITIAL, Innès by HappyCulture, Pullman Centre, Campanile Nord L'Union, Novotel Aéroport, Adagio Ramblas, Adagio Access Saint-Cyprien, Hampton by Hilton Airport, Courtyard by Marriott Airport, Brit Hôtel Colomiers, Mercure Centre Saint-Georges, Campanile Sud Balma, Holiday Inn Airport, Octel, Mercure Sud, Résidence Inn Airport, Zenitude Parc de l'Escale, Citadines Wilson, Cour des Consuls, Mercure Wilson Capitole, Campanile Nord Sesquières, Le Trèfle, Adagio Centre, Ibis Budget Centre, Adagio Access Jolimont, Mercure Sud Balma, Novotel Aéroport

---

## Étape 7 : Export final et déploiement

### Commande d'export
```bash
$env:BASEROW_EMAIL="rouxraphael1@gmail.com"
$env:BASEROW_PASSWORD="ChloeAlex26071812!"
node scripts/export.mjs
```

### Résultat export
```
✅ Token JWT obtenu
✓ 50 adresses, 18 événements, 4 parcours, 93 hôtels (réf. 2026-07-09).
```

### Git commit
```
feat: complete 93 hotels with GPS coordinates and addresses
a604943 → main
```

---

## Étape 8 : Corrections et validation

### Fichiers corrigés
- `lat/lng` convertis en nombres (étaient des chaînes → erreur chargement hôtels)
- URLs cassées remplacées (Michel Sarran, SEPT, Halle de la Machine, Keepcool)
- Catégorie Pont-Neuf corrigée (eglise → visite)
- Catégories marchés corrigées (restaurant → visite)

### Build GitHub Actions
- Workflow `build-data.yml` mis à jour : auth JWT via secrets `BASEROW_EMAIL` + `BASEROW_PASSWORD`
- `continue-on-error: true` pour l'étape ORS
- Sortie : `docs/app_data.json`

---

## Fichiers principaux

| Fichier | Description |
|---------|-------------|
| `.github/workflows/build-data.yml` | Pipeline GitHub Actions |
| `scripts/export.mjs` | Baserow → app_data.json (JWT auth) |
| `scripts/add-toulouse-data.mjs` | Insertion des données |
| `scripts/precompute-walk.mjs` | Temps de marche ORS |
| `scripts/add-etoiles.mjs` | Ajout restaurants étoilés |
| `docs/index.html` | PWA production (onglets, QR, site web) |
| `index.html` | Miroir de docs/index.html |
| `docs/app_data.json` | Données canoniques (50 adresses, 18 events, 4 parcours, 93 hôtels) |
| `app_data.json` | Miroir de docs/app_data.json |
| `manifest.json` | PWA manifest |
| `sw.js` | Service Worker |
| `maquette_tefd.html` | Démo interactive Club |
| `moteur-reco.js` | Module moteur de recommandation |
| `docs/schema_baserow_tefd.md` | Schéma complet Baserow |
| `docs/spec_moteur_reco_tefd.md` | Spécification scoring engine |

### Scripts temporaires (opencode)
| Fichier | Description |
|---------|-------------|
| `export-with-jwt.mjs` | Script JWT de base |
| `push-hotels.mjs` | Push 92 hôtels Club |
| `add-urls.mjs` | Ajout 28 URLs adresses |
| `fix-urls.mjs` | Correction URLs cassées |
| `geocode-hotels.mjs` | Géocodage via Nominatim |
| `geocode-hotels-v2.mjs` | Overrides manuels coordonnées |
| `clean-hotels.mjs` | Nettoyage données hôtels |

---

## URLs utiles

| Ressource | URL |
|-----------|-----|
| GitHub Pages (production) | https://rouxraphael1.github.io/GTD/index.html |
| GitHub repo | https://github.com/rouxraphael1/GTD |
| Baserow workspace | 476360 |
| Baserow database | Back-office TEFD |

---

## État actuel du projet

- ✅ 93 hôtels géocodés (lat/lng + adresse)
- ✅ 50 adresses avec URLs fonctionnelles
- ✅ 18 événements (filtrés anti-hallucination)
- ✅ 4 parcours
- ✅ 8 personas, 9 catégories
- ✅ PWA fonctionnelle sur GitHub Pages
- ✅ Export JWT fonctionnel
- ✅ Build GitHub Actions validé
- ⏳ Personas_dominants non renseignés pour les 92 hôtels Club
- ⏳ Intégration temps réel météo / events (v2)
