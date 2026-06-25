# Spec — Moteur de recommandation TEFD (v1)

**But :** ordonner les adresses pour le réceptionniste selon le persona et le contexte, **sans jamais rien cacher** par défaut. L'outil conseille en triant ; le réceptionniste décide.

**Périmètre v1 :** 4 signaux — affinité persona, proximité, moment, priorité éditoriale. Météo et événementiel → v2 (annexe).

**Anchré sur les livrables existants :** noms de champs issus de `export.mjs` ; `marche_min` au format **par hôtel** produit par `precompute-walk.mjs` ; aucune donnée périmée n'arrive ici (filtrée à l'export).

---

## 1. Les trois couches (rien d'éliminatoire dans le moteur)

1. **Données propres** — `export.mjs` n'écrit jamais un événement périmé (`est_actif` / `recurrent`). Le moteur reçoit du JSON déjà sain.
2. **Tri par score, toujours actif** — toutes les adresses publiées restent visibles ; le score ne fait qu'**ordonner**.
3. **Filtres optionnels** — interrupteurs au comptoir (« ce persona seulement », « à pied ≤ X min », « adapté au moment »), **OFF par défaut**. OFF = le critère pèse sur l'ordre, il n'élimine pas.

---

## 2. Contexte d'exécution

```js
const ctx = {
  hotelActif,        // objet hôtel courant (data.hotels[k]) — DÉTERMINE marche_min
  persona,           // persona sélectionné (data.personas[i]) ou null
  maintenant,        // Date courante (pour dériver le "moment")
  rayonMarcheMin,    // valeur du curseur "à pied" (ex. 10) — sert au filtre optionnel
  reglages: {
    personaSeulement: false,   // toggle "Masquer le hors-persona"
    rayonActif:       false,   // toggle "à pied ≤ X min"
    momentActif:      false,   // toggle "adapté au moment"
  },
};
```

---

## 3. ⭐ Le format `marche_min` (le point acté ici)

`precompute-walk.mjs` injecte dans chaque adresse :

```json
"marche_min": { "Hôtel des Beaux-Arts": 8, "Hôtel du Capitole": 14 }
```

C'est un **objet indexé par nom d'hôtel**, pas un nombre. Le moteur résout donc le temps de marche **dans le contexte de l'hôtel actif** avant tout calcul :

```js
function resoudreMarche(adresse, ctx) {
  const m = adresse.marche_min?.[ctx.hotelActif.nom];
  return (typeof m === "number") ? m : null;   // null = hors portée / pas d'itinéraire ORS
}
```

> **Règle :** `marche_min` absent ou `null` n'élimine jamais (pas de filtre dur). La proximité vaut alors 0 — l'adresse reste visible, simplement non favorisée par ce signal.

> **Réconciliation avec la maquette : ✅ alignée.** Depuis la version multi-hôtel, `maquette_tefd.html` utilise exactement le même format que la production — `adresse.marche_min[hotelActif.nom]`, résolu via `resoudreMarche(x, hotelNom)`. Le sélecteur d'hôtel du header change `state.hotel`, et la proximité (carte + pills + score) se recalcule en direct pour l'établissement choisi. Plus aucun champ `walk` legacy dans les données.

---

## 4. Les 4 signaux v1 (tous normalisés 0 → 1)

| Signal | Source (champs `export.mjs`) | Formule |
|---|---|---|
| **Affinité persona** | `adresse.personas`, `persona`, `adresse.categorie`, `persona.categories_prioritaires` | `1.0` si persona ∈ `adresse.personas` ; sinon `0.5` si `adresse.categorie` ∈ `persona.categories_prioritaires` ; sinon `0.0`. Persona null → `0.5` (neutre). |
| **Proximité** | `resoudreMarche(adresse, ctx)` | `marche === null` → `0` ; sinon `clamp(1 − marche / PROX_MAX, 0, 1)` avec `PROX_MAX = 30` min. |
| **Moment** | `adresse.moment` (matin/midi/soir/journée), `ctx.maintenant` | `1.0` si moment courant ∈ `adresse.moment` ; `0.5` si `adresse.moment` vide ou contient « journée » ; sinon `0.2`. |
| **Priorité éditoriale** | `adresse.priorite_edito` (1-5) | `(p − 1) / 4`. Champ absent → `0.5`. |

> ⚠️ Le champ `priorite_edito` est dans le schéma Baserow mais **pas encore émis par `export.mjs`** — à ajouter au mapping des adresses (voir §7).

---

## 5. Poids par défaut

```js
const POIDS = {
  persona:   0.40,
  prioEdito: 0.25,
  moment:    0.20,
  proximite: 0.15,
};
```

Ajustables sans toucher au code (à externaliser dans une constante ou le JSON de config). La **priorité éditoriale (0,25)** est la voix de la maison : à pertinence égale, elle départage en faveur de l'adresse que l'hôtel veut pousser — c'est ce qui distingue l'outil d'un tri par note de foule.

---

## 6. Pseudo-code complet

```js
function scoreAdresse(adresse, ctx) {
  const marche = resoudreMarche(adresse, ctx);

  const sPersona = affinitePersona(adresse, ctx.persona);
  const sProx    = marche === null ? 0 : clamp(1 - marche / 30, 0, 1);
  const sMoment  = adequationMoment(adresse, ctx.maintenant);
  const sPrio    = ((adresse.priorite_edito ?? 3) - 1) / 4;

  return POIDS.persona   * sPersona
       + POIDS.proximite * sProx
       + POIDS.moment    * sMoment
       + POIDS.prioEdito * sPrio;
}

// OFF par défaut : ne renvoie false QUE si un interrupteur est activé.
function passeFiltresOptionnels(adresse, ctx) {
  const r = ctx.reglages;
  if (r.personaSeulement && ctx.persona
      && !adresse.personas.includes(clePersona(ctx.persona))) return false;
  if (r.rayonActif) {
    const m = resoudreMarche(adresse, ctx);
    if (m === null || m > ctx.rayonMarcheMin) return false;
  }
  if (r.momentActif && !adequationMoment(adresse, ctx.maintenant)) return false; // adequationMoment > 0 attendu
  return true;
}

function recommander(adresses, ctx) {
  return adresses
    .filter(a => passeFiltresOptionnels(a, ctx))   // tout passe si tout est OFF
    .map(a => ({ ...a, _score: scoreAdresse(a, ctx) }))
    .sort((a, b) => b._score - a._score);
}
```

**Note UI :** quand `personaSeulement` est OFF, la maquette **grise** les hors-profil au lieu de les retirer (étiquette « hors profil »). C'est un choix d'affichage ; le moteur, lui, les garde dans la liste triée. Le toggle OFF ⇒ `recommander` renvoie tout, ordonné.

---

## 7. À trancher / à câbler (les vraies décisions restantes)

1. **Clé de matching persona — ✅ tranché.** La maquette compare le persona **par `code`** (`x.p.includes("04")`). Donc `clePersona(persona)` doit renvoyer `persona.code`, et `adresse.personas` doit contenir les **codes** 01-08, pas les noms. → **Champ primaire de la table Personas = `code`** dans Baserow, pour que `linkValues(r.personas)` (dans `export.mjs`) émette bien les codes côté JSON.
2. **`priorite_edito` à exporter** — ajouter `priorite_edito: r.priorite_edito ?? 3` au map des adresses dans `export.mjs`, sinon le signal tombe à neutre pour tout le monde.
3. **Dérivation du « moment courant »** depuis `ctx.maintenant` — proposer : 6-11h → matin, 11-15h → midi, 18-23h → soir, le reste → journée. À valider.

---

## Annexe — v2 (différé)

- **Météo** (Open-Meteo, sans clé) : signal `adequationMeteo` × tag `exposition` (intérieur/extérieur/mixte, à ajouter au schéma). Pénalité **douce** par défaut, dure seulement si pluie forte.
- **Événementiel** : un événement actif au lieu (`data.evenements` → `lieu`) fait remonter l'adresse (« opéra ce soir »).
- Poids suggérés v2 : persona 0,32 · prioEdito 0,20 · moment 0,16 · proximité 0,12 · météo 0,10 · événementiel 0,10.
