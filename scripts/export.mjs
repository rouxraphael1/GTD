// export.mjs — Génère public/app_data.json depuis Baserow (source de vérité TEFD).
// Node 18+ (fetch natif). Aucune dépendance.
//
// Lancement local :  BASEROW_TOKEN=xxx node scripts/export.mjs
// En CI : voir .github/workflows/build-data.yml

import { writeFile, mkdir } from "node:fs/promises";

// ---------- Configuration (via variables d'environnement) ----------
const API   = process.env.BASEROW_API_URL || "https://api.baserow.io/api";
const TOKEN = process.env.BASEROW_TOKEN;
const TABLES = {
  adresses:   process.env.T_ADRESSES,
  evenements: process.env.T_EVENEMENTS,
  parcours:   process.env.T_PARCOURS,
  personas:   process.env.T_PERSONAS,
  categories: process.env.T_CATEGORIES,
  hotels:     process.env.T_HOTELS,
};
const OUT = process.env.OUT_PATH || "public/app_data.json";

if (!TOKEN) { console.error("BASEROW_TOKEN manquant."); process.exit(1); }

// Date du jour à Paris — pilote le filtre anti-hallucination des événements.
const todayParis = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }); // YYYY-MM-DD

// ---------- Lecture paginée d'une table Baserow ----------
async function fetchTable(tableId) {
  if (!tableId) return [];
  const rows = [];
  let url = `${API}/database/rows/table/${tableId}/?user_field_names=true&size=200`;
  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Token ${TOKEN}` } });
    if (!res.ok) throw new Error(`Baserow ${tableId} → ${res.status} ${await res.text()}`);
    const data = await res.json();
    rows.push(...data.results);
    url = data.next; // null quand terminé
  }
  return rows;
}

// ---------- Helpers ----------
const linkValues = (f) => Array.isArray(f) ? f.map((x) => x.value) : [];   // champ "lien" → libellés
const single     = (f) => (f && typeof f === "object" ? f.value : f) ?? null; // select simple
const i18n       = (r, base) => ({ fr: r[`${base}_fr`] ?? r[base] ?? "", en: r[`${base}_en`] ?? "", es: r[`${base}_es`] ?? "" });
const isPublished = (r) => single(r.statut) === "Publié";

// ---------- Programme principal ----------
async function main() {
  const [adresses, evenements, parcours, personas, categories, hotels] = await Promise.all([
    fetchTable(TABLES.adresses),
    fetchTable(TABLES.evenements),
    fetchTable(TABLES.parcours),
    fetchTable(TABLES.personas),
    fetchTable(TABLES.categories),
    fetchTable(TABLES.hotels),
  ]);

  // -- Adresses publiées
  const outAdresses = adresses.filter(isPublished).map((r) => ({
    nom: r.nom,
    categorie: Array.isArray(r.categorie) ? (r.categorie[0]?.value || null) : (r.categorie || null),
    personas: linkValues(r.personas),
    osm_id:   r.osm_id   || null,
    osm_type: r.osm_type || null,
    lat: r.latitude, lng: r.longitude,
    adresse: r.adresse,
    quartier: single(r.quartier),
    moment: linkValues(r.moment),
    note: i18n(r, "note_edito"),
    acces: r.acces_transport || "",
    prix: single(r.fourchette_prix),
    tags: linkValues(r.tags).length ? linkValues(r.tags) : (r.tags || []),
    pmr: !!r.accessible_pmr,
    verifie_le: r.verifie_le || null,
  }));

  // -- Événements : RÈGLE ANTI-HALLUCINATION
  //    on n'exporte que ce qui est publié ET (encore actif OU récurrent).
  const outEvenements = evenements
    .filter(isPublished)
    .filter((r) => r.recurrent || (r.date_fin && r.date_fin >= todayParis))
    .map((r) => ({
      titre: i18n(r, "titre"),
      categorie: Array.isArray(r.categorie) ? (r.categorie[0]?.value || null) : (r.categorie || null),
      personas: linkValues(r.personas),
      lieu: linkValues(r.lieu)[0] || null,
      date_debut: r.date_debut || null,
      date_fin: r.date_fin || null,
      recurrent: !!r.recurrent,
      url: r.url_billetterie || null,
    }));

  // -- Parcours publiés
  const outParcours = parcours.filter(isPublished).map((r) => ({
    nom: i18n(r, "nom"),
    type: single(r.type),
    personas: linkValues(r.personas),
    duree_min: r.duree_min, distance_km: r.distance_km,
    profil_ors: single(r.profil_ors),
    points: linkValues(r.points),
    description: i18n(r, "description"),
  }));

  // -- Référentiels
  const outPersonas = personas.map((r) => ({
    code: r.code, nom: i18n(r, "nom"),
    bibliotheque: r.bibliotheque || "",
    ressort: r.ressort_emotionnel || "",
    categories_prioritaires: linkValues(r.categories_prioritaires),
    ton: r.ton || "",
  }));

  const outCategories = categories.map((r) => ({
    cle: r.cle, label: i18n(r, "label"),
    icone: r.icone || "", type: single(r.type_donnee),
  }));

  const outHotels = hotels.filter((r) => r.actif).map((r) => ({
    nom: r.nom, adresse: r.adresse,
    lat: r.latitude, lng: r.longitude,
    personas: linkValues(r.personas_dominants),
  }));

  const payload = {
    genere_le: new Date().toISOString(),
    date_reference: todayParis,
    personas: outPersonas,
    categories: outCategories,
    hotels: outHotels,
    adresses: outAdresses,
    evenements: outEvenements,
    parcours: outParcours,
  };

  await mkdir(OUT.split("/").slice(0, -1).join("/") || ".", { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 2), "utf8");
  console.log(`✓ ${OUT} — ${outAdresses.length} adresses, ${outEvenements.length} événements actifs, ${outParcours.length} parcours (réf. ${todayParis}).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
