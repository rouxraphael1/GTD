# Schéma Baserow — Back-office TEFD

**Rôle :** base de vérité unique. Une seule saisie alimente deux livrables : le `app\\\\\\\_data.json` de la PWA et le PDF du *Livret de référence factuelle*.

**Principe directeur :** Baserow stocke la *sélection éditoriale* et les métadonnées (personas, notes, `place\\\\\\\_id`), **jamais** les photos/avis (récupérés en direct chez Google via le `place\\\\\\\_id`, donc toujours frais). Tout élément daté n'est exporté que si sa date est future → garantie anti-hallucination.

\---

## Vue d'ensemble des tables

|Table|Rôle|Alimente|
|-|-|-|
|**Adresses**|Lieux recommandés (resto, musée, théâtre, église, salle de sport…)|JSON + PDF|
|**Événements**|Concerts, spectacles, expos, matchs — datés|JSON + PDF|
|**Parcours**|Footing et visites à pied|JSON|
|**Personas**|Les 8 profils TEFD (référentiel)|JSON (presets de filtre)|
|**Catégories**|Référentiel des catégories + libellés FR/EN/ES|JSON|
|**Suggestions**|Remontées terrain des réceptionnistes (file de modération)|— (interne)|
|**Hôtels**|Établissements du Club + coordonnées (point de départ des calculs ORS)|JSON|

\---

## Table 1 — Adresses

|Champ|Type Baserow|Rôle|
|-|-|-|
|`nom`|Texte|Nom du lieu (neutre en langue)|
|`categorie`|Lien → Catégories|Restaurant, musée, église, salle de sport…|
|`personas`|Lien → Personas (multiple)|Quels profils cette adresse sert|
|`place\\\\\\\_id\\\\\\\_google`|Texte|Clé de récupération avis/photos/horaires en direct|
|`latitude`|Nombre (décimal)|Affichage carte + calcul ORS|
|`longitude`|Nombre (décimal)|Idem|
|`adresse`|Texte|Adresse postale lisible|
|`quartier`|Sélection simple|Capitole, Carmes, Saint-Cyprien, Sept Deniers…|
|`moment`|Sélection multiple|matin / midi / soir / journée — pilote le signal d'adéquation au moment (moteur de reco v1)|
|`note\\\\\\\_edito\\\\\\\_fr`|Texte long|Note éditoriale type Livret (le « pourquoi » du conseil)|
|`note\\\\\\\_edito\\\\\\\_en`|Texte long|Traduction anglaise|
|`note\\\\\\\_edito\\\\\\\_es`|Texte long|Traduction espagnole|
|`acces\\\\\\\_transport`|Texte long|Métro/tram/navette/parking, temps porte-à-porte|
|`fourchette\\\\\\\_prix`|Sélection simple|€, €€, €€€, €€€€|
|`tags`|Sélection multiple|terrasse, végétarien, romantique, groupe, vue, tardif…|
|`accessible\\\\\\\_pmr`|Booléen|Issu d'acceslibre — différenciateur senior/famille|
|`source`|Sélection simple|Livret / DATAtourisme / OSM / Curation terrain|
|`priorite\\\\\\\_edito`|Nombre (1-5)|Classe les « la maison recommande » en tête|
|`verifie\\\\\\\_le`|Date|Pilote le badge de fraîcheur dans l'appli|
|`valide\\\\\\\_jusqu\\\\\\\_au`|Date (option)|Au-delà → bascule en « À revérifier »|
|`statut`|Sélection simple|Publié / Brouillon / À revérifier / Archivé|
|`cree\\\\\\\_le`|Créé le (auto)|—|
|`modifie\\\\\\\_le`|Modifié le (auto)|—|

> Seules les lignes `statut = Publié` sont exportées vers le JSON et le PDF.

\---

## Table 2 — Événements

|Champ|Type|Rôle|
|-|-|-|
|`titre\\\\\\\_fr` / `titre\\\\\\\_en` / `titre\\\\\\\_es`|Texte ×3|Intitulé multilingue|
|`categorie`|Lien → Catégories|Concert, théâtre, expo, festival, match…|
|`personas`|Lien → Personas (multiple)|Ciblage|
|`lieu`|Lien → Adresses|Salle/lieu de l'événement|
|`date\\\\\\\_debut`|Date|—|
|`date\\\\\\\_fin`|Date|**Clé anti-hallucination**|
|`recurrent`|Booléen|Vrai pour les rendez-vous annuels (Rio Loco, Marché de Noël…)|
|`recurrence\\\\\\\_note`|Texte|« chaque mi-juin », affiché sans fausse date précise|
|`url\\\\\\\_billetterie`|URL|Lien sortant|
|`source`|Sélection simple|OpenAgenda / OpenData Toulouse / DATAtourisme / Curation|
|`verifie\\\\\\\_le`|Date|Fraîcheur|
|`statut`|Sélection simple|Publié / Brouillon / Archivé|
|`est\\\\\\\_actif`|Formule|`date\\\\\\\_fin >= today()` → filtre d'export|

> \\\\\\\*\\\\\\\*Règle d'or :\\\\\\\*\\\\\\\* un événement non récurrent n'est exporté que si `est\\\\\\\_actif = vrai`. Les matchs sportifs (curés à la main) suivent la même règle : passés → invisibles automatiquement.

\---

## Table 3 — Parcours

|Champ|Type|Rôle|
|-|-|-|
|`nom\\\\\\\_fr` / `nom\\\\\\\_en` / `nom\\\\\\\_es`|Texte ×3|Intitulé|
|`type`|Sélection simple|Footing / Visite à pied|
|`personas`|Lien → Personas (multiple)|Ciblage (ex. Slow tourism, International)|
|`duree\\\\\\\_min`|Nombre|Paramètre temps|
|`distance\\\\\\\_km`|Nombre|Paramètre distance|
|`profil\\\\\\\_ors`|Sélection simple|foot-walking / foot-hiking|
|`points`|Lien → Adresses (multiple, ordonné)|Waypoints du tracé|
|`description\\\\\\\_fr` / `\\\\\\\_en` / `\\\\\\\_es`|Texte long ×3|Récit du parcours|
|`point\\\\\\\_depart`|Texte|« Depuis l'hôtel » ou coords fixes (Garonne, Capitole…)|
|`verifie\\\\\\\_le`|Date|Fraîcheur|
|`statut`|Sélection simple|Publié / Brouillon / Archivé|

> Le tracé final et les temps réels sont calculés par ORS au runtime ; Baserow ne stocke que les waypoints et les paramètres.

\---

## Table 4 — Personas (référentiel des 8 profils TEFD)

|Champ|Type|Rôle|
|-|-|-|
|`code`|Texte|01 à 08|
|`nom\\\\\\\_fr` / `nom\\\\\\\_en` / `nom\\\\\\\_es`|Texte ×3|« Couple premium », etc.|
|`bibliotheque`|Texte|« Toulouse gastronomie », « Toulouse rugby »…|
|`ressort\\\\\\\_emotionnel`|Texte|« Considération discrète, jamais familiarité »|
|`categories\\\\\\\_prioritaires`|Lien → Catégories (multiple)|Pré-filtre de l'appli|
|`ton`|Texte long|Guidage de posture pour le réceptionniste|
|`description`|Texte long|Fiche persona complète|

> Cette table devient les \\\\\\\*\\\\\\\*presets de filtre\\\\\\\*\\\\\\\* de l'appli : le réceptionniste choisit un persona, l'appli applique `categories\\\\\\\_prioritaires` + le ton.

\---

## Table 5 — Catégories (référentiel + i18n)

|Champ|Type|Rôle|
|-|-|-|
|`cle`|Texte|slug technique : `restaurant`, `musee`, `theatre`, `concert`, `eglise`, `salle\\\\\\\_sport`, `evenement\\\\\\\_sportif`, `footing`, `visite`|
|`label\\\\\\\_fr` / `label\\\\\\\_en` / `label\\\\\\\_es`|Texte ×3|Libellés affichés|
|`icone`|Texte|Nom d'icône (UI)|
|`type\\\\\\\_donnee`|Sélection simple|Lieu / Événement / Parcours|

\---

## Table 6 — Suggestions (file de modération terrain)

|Champ|Type|Rôle|
|-|-|-|
|`nom`|Texte|Lieu proposé|
|`adresse`|Texte|—|
|`categorie\\\\\\\_suggeree`|Lien → Catégories|—|
|`commentaire`|Texte long|Pourquoi le réceptionniste le propose|
|`propose\\\\\\\_par`|Texte|Nom de l'agent|
|`hotel`|Lien → Hôtels|Provenance|
|`date\\\\\\\_proposition`|Créé le (auto)|—|
|`statut\\\\\\\_moderation`|Sélection simple|Nouvelle / En revue / Acceptée / Refusée|
|`adresse\\\\\\\_publiee`|Lien → Adresses|Renseigné quand le référent valide et crée la fiche|

\---

## Table 7 — Hôtels (multi-établissements du Club)

|Champ|Type|Rôle|
|-|-|-|
|`nom`|Texte|—|
|`adresse`|Texte|—|
|`latitude` / `longitude`|Nombre ×2|**Point de départ des isochrones et temps de marche ORS**|
|`personas\\\\\\\_dominants`|Lien → Personas (multiple)|Profils clés de l'établissement|
|`referent\\\\\\\_tefd`|Texte / Collaborateur|Responsable de la mise à jour|
|`actif`|Booléen|Hôtel en service|

\---

## Relations (résumé)

* **Adresses** ↔ Catégories (n-1), ↔ Personas (n-n)
* **Événements** → Adresses (lieu), ↔ Catégories, ↔ Personas
* **Parcours** → Adresses (waypoints, n-n ordonné), ↔ Personas
* **Personas** ↔ Catégories (n-n, prioritaires)
* **Suggestions** → Hôtels, → Catégories, → Adresses (une fois validée)
* **Hôtels** ↔ Personas (n-n)

\---

## Gestion multilingue (FR / EN / ES)

* Les **libellés de catégories** et les **textes éditoriaux** (notes, descriptions, titres d'événements) ont une colonne par langue (`\\\\\\\_fr`, `\\\\\\\_en`, `\\\\\\\_es`).
* Les **noms propres** (restaurants, salles) restent uniques.
* À l'export, le JSON regroupe les trois langues ; l'appli sert la langue active via i18next.

\---

## Pipeline d'export (source unique → 2 livrables)

1. **Déclencheur :** webhook Baserow à chaque modification, ou GitHub Action planifiée (ex. quotidienne).
2. **Script (Node, lancé par GitHub Actions — gratuit) :**

   * lit les tables via l'API REST Baserow ;
   * filtre : `Adresses/Parcours` en `statut = Publié` ; `Événements` en `statut = Publié` **ET** (`est\\\\\\\_actif = vrai` **OU** `recurrent = vrai`) ;
   * génère `app\\\\\\\_data.json` → publié sur GitHub Pages ;
   * génère le **PDF du Livret** en regroupant les données selon les 7 sections ci-dessous.
3. **Sécurité :** le token API Baserow vit dans le Worker Cloudflare, jamais côté client.

### Mapping vers les 7 sections du Livret (pour le PDF)

|Section Livret|Source dans Baserow|
|-|-|
|Écoles \& calendrier universitaire|Adresses `categorie = ecole` + Événements récurrents (pics)|
|Stade Toulousain \& rugby|Adresses (stades) + Événements `categorie = evenement\\\\\\\_sportif`|
|Étoilés Michelin|Adresses `tags ⊇ étoilé`, triées par `priorite\\\\\\\_edito`|
|Festivals \& agenda culturel|Événements `recurrent = vrai`|
|Salons business|Événements `categorie = salon`|
|Grandes salles de spectacle|Adresses `categorie ∈ {théâtre, concert}`|
|Mode d'emploi / règles|Bloc statique (hors base)|

\---

## Rôles \& gouvernance

* **Référent TEFD** : écrit directement dans Baserow (= l'interface admin, rien à développer). Valide les suggestions. Garant des cycles mars / septembre / trimestriel.
* **Réceptionniste** : via l'appli, propose une adresse → table *Suggestions* → modération.
* **Résolution `place\\\\\\\_id`** : écran « Ajouter une adresse » (PWA admin) → Worker → Google Text Search → confirmation humaine → écriture Baserow avec `place\\\\\\\_id` + lat/lng.

