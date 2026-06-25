// moteur-reco.js — Moteur de recommandation TEFD (v1)
// Module ESM pur, sans dépendance, compatible navigateur ET Node 18+.
// Applique la spec : 4 signaux (persona, proximité, moment, priorité édito),
// tri doux toujours actif, filtres optionnels OFF par défaut. Rien d'éliminatoire
// hors des interrupteurs explicites — les données périmées sont déjà retirées à l'export.
//
// Forme d'entrée = app_data.json (généré par export.mjs + precompute-walk.mjs).

// ---------- Constantes (externalisables si besoin) ----------
export const POIDS = { persona: 0.40, prioEdito: 0.25, moment: 0.20, proximite: 0.15 };
export const PROX_MAX = 30;          // minutes au-delà desquelles la proximité vaut 0
export const PRIO_DEFAUT = 3;        // priorité éditoriale neutre (1-5)

// ---------- Utilitaires ----------
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// normalise pour comparer "Journée"/"journee"/"JOURNÉE" sans surprise
const norm = (s) => String(s ?? "")
  .toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .trim();

/** Moment de la journée déduit de l'heure courante. */
export function momentCourant(date = new Date()) {
  const h = date.getHours();
  if (h >= 6  && h < 11) return "matin";
  if (h >= 11 && h < 15) return "midi";
  if (h >= 18 && h < 23) return "soir";
  return "journee";
}

/** Temps de marche depuis l'hôtel actif : objet marche_min[<nom hôtel>] (prod).
 *  Fallback toléré sur adresse.walk (mock mono-hôtel). null = hors portée / pas d'itinéraire. */
export function resoudreMarche(adresse, hotel) {
  const m = adresse?.marche_min?.[hotel?.nom];
  if (typeof m === "number") return m;
  if (typeof adresse?.walk === "number") return adresse.walk; // bridge mock
  return null;
}

// ---------- Les 4 signaux (tous renvoient 0 → 1) ----------

/** Persona ∈ codes de l'adresse → 1 ; sinon catégorie prioritaire du persona → 0.5 ; sinon 0.
 *  Pas de persona sélectionné → 0.5 (neutre). Matching par CODE (cf. spec §7.1). */
export function affinitePersona(adresse, persona) {
  if (!persona) return 0.5;
  const codes = Array.isArray(adresse.personas) ? adresse.personas.map(String) : [];
  if (codes.includes(String(persona.code))) return 1.0;
  const cats = (persona.categories_prioritaires || []).map(norm);
  if (cats.includes(norm(adresse.categorie))) return 0.5;
  return 0.0;
}

export function scoreProximite(adresse, hotel) {
  const m = resoudreMarche(adresse, hotel);
  return m === null ? 0 : clamp(1 - m / PROX_MAX, 0, 1);
}

/** Moment courant ∈ tags de l'adresse → 1 ; vide ou "journée" → 0.5 ; sinon 0.2. */
export function adequationMoment(adresse, date = new Date()) {
  const m = momentCourant(date);
  const tags = (Array.isArray(adresse.moment) ? adresse.moment : []).map(norm);
  if (tags.includes(m)) return 1.0;
  if (!tags.length || tags.includes("journee")) return 0.5;
  return 0.2;
}

export function scorePriorite(adresse) {
  const p = typeof adresse.priorite_edito === "number" ? adresse.priorite_edito : PRIO_DEFAUT;
  return clamp((p - 1) / 4, 0, 1);
}

// ---------- Score global ----------
export function scoreAdresse(adresse, ctx) {
  const s = {
    persona:   affinitePersona(adresse, ctx.persona),
    proximite: scoreProximite(adresse, ctx.hotelActif),
    moment:    adequationMoment(adresse, ctx.maintenant),
    prio:      scorePriorite(adresse),
  };
  const total = POIDS.persona   * s.persona
              + POIDS.proximite * s.proximite
              + POIDS.moment    * s.moment
              + POIDS.prioEdito * s.prio;
  return { total, detail: s };
}

// ---------- Filtres optionnels (OFF par défaut : ne retirent QUE si activés) ----------
export function passeFiltresOptionnels(adresse, ctx) {
  const r = ctx.reglages || {};
  if (r.personaSeulement && ctx.persona) {
    const codes = Array.isArray(adresse.personas) ? adresse.personas.map(String) : [];
    if (!codes.includes(String(ctx.persona.code))) return false;
  }
  if (r.rayonActif) {
    const m = resoudreMarche(adresse, ctx.hotelActif);
    if (m === null || m > ctx.rayonMarcheMin) return false;
  }
  if (r.momentActif && adequationMoment(adresse, ctx.maintenant) <= 0.2) return false;
  return true;
}

/** Trie les adresses par score décroissant. Tout passe si tous les interrupteurs sont OFF. */
export function recommander(adresses, ctx) {
  return (adresses || [])
    .filter((a) => passeFiltresOptionnels(a, ctx))
    .map((a) => {
      const { total, detail } = scoreAdresse(a, ctx);
      return { ...a, _score: total, _scoreDetail: detail };
    })
    .sort((a, b) => b._score - a._score);
}

/** Confort : construit le contexte à partir d'app_data.json + des choix du comptoir. */
export function recommanderDepuisData(data, {
  hotelNom, personaCode,
  maintenant = new Date(),
  rayonMarcheMin = 15,
  reglages = {},
} = {}) {
  const hotelActif = (data.hotels || []).find((h) => h.nom === hotelNom) || (data.hotels || [])[0] || null;
  const persona    = personaCode ? (data.personas || []).find((p) => String(p.code) === String(personaCode)) || null : null;
  const ctx = { hotelActif, persona, maintenant, rayonMarcheMin, reglages };
  return recommander(data.adresses || [], ctx);
}
