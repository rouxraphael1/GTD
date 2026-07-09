// export.mjs — Génère app_data.json depuis Baserow (source de vérité TEFD).
// Node 18+ (fetch natif). Aucune dépendance.
//
// Auth supporte 2 modes :
//   1. JWT : BASEROW_EMAIL + BASEROW_PASSWORD (recommandé)
//   2. Token : BASEROW_TOKEN (lecture seule, peut expirer)
//
// Lancement local :
//   BASEROW_EMAIL=xxx BASEROW_PASSWORD=yyy node scripts/export.mjs
// En CI : voir .github/workflows/build-data.yml

import { writeFile, copyFile, mkdir } from "node:fs/promises";

// ---------- Configuration ----------
const API = process.env.BASEROW_API_URL || "https://api.baserow.io/api";
const BASEROW_EMAIL    = process.env.BASEROW_EMAIL;
const BASEROW_PASSWORD = process.env.BASEROW_PASSWORD;
const BASEROW_TOKEN    = process.env.BASEROW_TOKEN;
const TABLES = {
  adresses:   process.env.T_ADRESSES   || "1045799",
  evenements: process.env.T_EVENEMENTS || "1045800",
  parcours:   process.env.T_PARCOURS   || "1045801",
  personas:   process.env.T_PERSONAS   || "1045802",
  categories: process.env.T_CATEGORIES || "1045803",
  hotels:     process.env.T_HOTELS     || "1045805",
};
const OUT      = process.env.OUT_PATH || "docs/app_data.json";
const OUT_ROOT = "app_data.json";

// Date du jour à Paris — pilote le filtre anti-hallucination des événements.
const todayParis = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

// ---------- Auth ----------
async function getJWTToken() {
  console.log("🔑 Obtention du token JWT…");
  const res = await fetch(`${API}/user/token-auth/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: BASEROW_EMAIL, password: BASEROW_PASSWORD }),
  });
  if (!res.ok) throw new Error(`JWT auth failed → ${res.status} ${await res.text()}`);
  const data = await res.json();
  console.log("✅ Token JWT obtenu");
  return data.token;
}

let AUTH_HEADER;
async function initAuth() {
  if (BASEROW_EMAIL && BASEROW_PASSWORD) {
    const jwt = await getJWTToken();
    AUTH_HEADER = `JWT ${jwt}`;
  } else if (BASEROW_TOKEN) {
    AUTH_HEADER = `Token ${BASEROW_TOKEN}`;
    console.log("🔑 Utilisation du Token Baserow (lecture seule).");
  } else {
    throw new Error("Aucune credentials Baserow. Définir BASEROW_EMAIL+BASEROW_PASSWORD ou BASEROW_TOKEN.");
  }
}

// ---------- Lecture paginée ----------
async function fetchTable(tableId) {
  if (!tableId) return [];
  const rows = [];
  let url = `${API}/database/rows/table/${tableId}/?user_field_names=true&size=200`;
  while (url) {
    const res = await fetch(url, { headers: { Authorization: AUTH_HEADER } });
    if (!res.ok) throw new Error(`Baserow ${tableId} → ${res.status} ${await res.text()}`);
    const data = await res.json();
    rows.push(...data.results);
    url = data.next;
  }
  return rows;
}

// ---------- Helpers ----------
const linkValues = (f) => Array.isArray(f) ? f.map((x) => x.value) : [];
const single     = (f) => (f && typeof f === "object" ? f.value : f) ?? null;
const i18n       = (r, base) => ({ fr: r[`${base}_fr`] ?? r[base] ?? "", en: r[`${base}_en`] ?? "", es: r[`${base}_es`] ?? "" });
const isPublished = (r) => single(r.statut) === "Publié";

// ---------- Main ----------
async function main() {
  await initAuth();

  const [adresses, evenements, parcours, personas, categories, hotels] = await Promise.all([
    fetchTable(TABLES.adresses),
    fetchTable(TABLES.evenements),
    fetchTable(TABLES.parcours),
    fetchTable(TABLES.personas),
    fetchTable(TABLES.categories),
    fetchTable(TABLES.hotels),
  ]);

  const outAdresses = adresses.filter(isPublished).map((r) => ({
    nom: r.nom,
    categorie: Array.isArray(r.categorie) ? (r.categorie[0]?.value || null) : (r.categorie || null),
    personas: linkValues(r.personas),
    place_id: r.place_id_google || null,
    lat: r.latitude != null ? Number(r.latitude) : null,
    lng: r.longitude != null ? Number(r.longitude) : null,
    adresse: r.adresse,
    quartier: single(r.quartier),
    moment: linkValues(r.moment),
    note: i18n(r, "note_edito"),
    acces: r.acces_transport || "",
    prix: single(r.fourchette_prix),
    priorite_edito: r.priorite_edito ?? 3,
    tags: linkValues(r.tags).length ? linkValues(r.tags) : (r.tags || []),
    pmr: !!r.accessible_pmr,
    verifie_le: r.verifie_le || null,
  }));

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

  const outParcours = parcours.filter(isPublished).map((r) => ({
    nom: i18n(r, "nom"),
    type: single(r.type),
    personas: linkValues(r.personas),
    duree_min: r.duree_min, distance_km: r.distance_km,
    profil_ors: single(r.profil_ors),
    points: linkValues(r.points),
    description: i18n(r, "description"),
  }));

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
    lat: r.latitude != null ? Number(r.latitude) : null,
    lng: r.longitude != null ? Number(r.longitude) : null,
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

  const json = JSON.stringify(payload, null, 2);
  await mkdir(OUT.split("/").slice(0, -1).join(".") || ".", { recursive: true });
  await writeFile(OUT, json, "utf8");
  await writeFile(OUT_ROOT, json, "utf8");
  console.log(`✓ ${outAdresses.length} adresses, ${outEvenements.length} événements, ${outParcours.length} parcours, ${outHotels.length} hôtels (réf. ${todayParis}).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
