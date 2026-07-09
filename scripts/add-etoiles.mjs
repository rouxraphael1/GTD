// add-etoiles.mjs — Crée les restaurants étoilés Michelin manquants dans Baserow
// Version 2 — valeurs corrigées pour correspondre aux options existantes dans Baserow.
// Node 18+. Lancement :
//   set BASEROW_TOKEN=ton_token
//   node scripts/add-etoiles.mjs

const API   = "https://api.baserow.io/api";
const TOKEN = process.env.BASEROW_TOKEN;
const TABLE = 1045799;

if (!TOKEN) { console.error("❌  BASEROW_TOKEN manquant."); process.exit(1); }

async function createRow(data) {
  const res = await fetch(`${API}/database/rows/table/${TABLE}/?user_field_names=true`, {
    method: "POST",
    headers: { Authorization: `Token ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Baserow → ${res.status} ${await res.text()}`);
  const row = await res.json();
  console.log(`  ✓  ${data.nom} → ligne ${row.id}`);
  return row.id;
}

async function injectOsm(rowId, osmType, osmId, lat, lng) {
  if (!osmType || !osmId) return;
  const res = await fetch(`${API}/database/rows/table/${TABLE}/${rowId}/?user_field_names=true`, {
    method: "PATCH",
    headers: { Authorization: `Token ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ osm_id: osmId, osm_type: osmType, latitude: lat, longitude: lng }),
  });
  if (!res.ok) throw new Error(`OSM inject → ${res.status} ${await res.text()}`);
}

// Quartiers valides dans Baserow (définis dans le bootstrap) :
// Capitole, Carmes, Saint-Cyprien, Sept Deniers, Compans, Borderouge, Île du Ramier, Rangueil
// Les restaurants hors Toulouse n'ont pas de quartier valide → on laisse vide

const ETOILES = [
  // ── Acte 2 Yannick Delpech ────────────────────────────────────────────────
  {
    data: {
      nom: "Acte 2 Yannick Delpech",
      adresse: "1 rue Pane-Bœuf, 31000 Toulouse",
      categorie: "restaurant",
      personas: "04,07",
      fourchette_prix: "€€€",
      moment: "soir",
      quartier: "Capitole",
      tags: "gastronomique,étoilé,romantique",
      note_edito_fr: "Étoilé Michelin. Ancienne scierie, ambiance table d'hôtes bohème, musique et projection vidéo. 15 convives max, menu dégustation surprise. Vins bio et nature uniquement. Expérience hors codes.",
      note_edito_en: "Michelin starred. Former sawmill, bohemian dinner party atmosphere, music and video. Max 15 guests, surprise tasting menu. Natural wines only. An experience unlike any other.",
      note_edito_es: "Estrella Michelin. Antigua serrería, ambiente íntimo y bohemio. Máx. 15 comensales, menú degustación sorpresa. Solo vinos naturales.",
      acces_transport: "Centre-ville — 10 min à pied du Capitole",
      priorite_edito: 4,
      verifie_le: "2026-05-01",
      statut: "Publié",
    },
    osm_type: null, osm_id: null, lat: null, lng: null,
  },
  // ── L'Écorce ──────────────────────────────────────────────────────────────
  {
    data: {
      nom: "L'Écorce",
      adresse: "8 rue de l'Esquille, 31000 Toulouse",
      categorie: "restaurant",
      personas: "04,05",
      fourchette_prix: "€€",
      moment: "midi,soir",
      quartier: "Capitole",
      tags: "gastronomique,étoilé,terrasse",
      note_edito_fr: "Nouvelle étoile Michelin 2026. Cuisine épurée, circuits courts, saisonnalité. Menu Saveurs du marché à 34 € le midi en semaine : meilleure entrée en gastronomie étoilée de Toulouse.",
      note_edito_en: "New Michelin star 2026. Pure cuisine, short supply chains, seasonality. Market menu at €34 for weekday lunch: the best entry point to Toulouse's starred gastronomy.",
      note_edito_es: "Nueva estrella Michelin 2026. Cocina depurada, circuitos cortos, estacionalidad. Menú a 34 € al mediodía en semana: la mejor entrada a la gastronomía con estrella de Toulouse.",
      acces_transport: "Centre-ville — 6 min à pied du Capitole",
      priorite_edito: 4,
      verifie_le: "2026-05-01",
      statut: "Publié",
    },
    osm_type: null, osm_id: null, lat: null, lng: null,
  },
  // ── Maison Pellestor-Veyrier (Colomiers) ──────────────────────────────────
  {
    data: {
      nom: "Maison Pellestor-Veyrier",
      adresse: "28 chemin de Gramont, 31770 Colomiers",
      categorie: "restaurant",
      personas: "04,07",
      fourchette_prix: "€€€",
      moment: "midi,soir",
      tags: "gastronomique,étoilé,romantique",
      note_edito_fr: "Nouvelle étoile Michelin 2026 + Jeune Chef de l'Année 2026. Quentin Pellestor-Veyrier, premier talent de la jeune gastronomie toulousaine. 15 min du centre en voiture.",
      note_edito_en: "New Michelin star 2026 + Young Chef of the Year 2026. Quentin Pellestor-Veyrier, leading talent of Toulouse's new gastronomy. 15 min from the centre by car.",
      note_edito_es: "Nueva estrella Michelin 2026 + Joven Chef del Año 2026. Quentin Pellestor-Veyrier, principal talento de la nueva gastronomía tolosana. 15 min del centro en coche.",
      acces_transport: "Colomiers — 15 min en voiture depuis le centre",
      priorite_edito: 4,
      verifie_le: "2026-05-01",
      statut: "Publié",
    },
    osm_type: null, osm_id: null, lat: null, lng: null,
  },
  // ── En Marge (Aureville) ──────────────────────────────────────────────────
  {
    data: {
      nom: "En Marge",
      adresse: "1204 route de Lacroix-Falgarde, 31320 Aureville",
      categorie: "restaurant",
      personas: "04,08",
      fourchette_prix: "€€€",
      moment: "midi,soir",
      tags: "gastronomique,étoilé,terrasse",
      note_edito_fr: "Étoilé Michelin. Cuisine inspirée par la nature et les saisons, cadre verdoyant. Pour client avec véhicule, en recherche de quiétude et de gastronomie au vert. 20 min du centre.",
      note_edito_en: "Michelin starred. Nature and season-inspired cuisine, green setting. For guests with a vehicle seeking peace and countryside gastronomy. 20 min from centre.",
      note_edito_es: "Estrella Michelin. Cocina inspirada en la naturaleza y las estaciones, entorno verde. Para clientes con vehículo. 20 min del centro.",
      acces_transport: "Aureville — 20 min en voiture depuis le centre",
      priorite_edito: 3,
      verifie_le: "2026-05-01",
      statut: "Publié",
    },
    osm_type: "way", osm_id: "62842448", lat: 43.5283, lng: 1.4361,
  },
  // ── L'Aparté (Montrabé) ───────────────────────────────────────────────────
  {
    data: {
      nom: "L'Aparté",
      adresse: "21 rue de l'Europe, 31850 Montrabé",
      categorie: "restaurant",
      personas: "04,08",
      fourchette_prix: "€€€",
      moment: "midi,soir",
      tags: "gastronomique,étoilé,élégant",
      note_edito_fr: "Étoilé Michelin depuis 2017. Jérémy Morin, ancien chef du Met à Toulouse. Cuisine aboutie et personnelle. Pour client fidèle à la gastronomie toulousaine voulant explorer les environs. 15 min.",
      note_edito_en: "Michelin starred since 2017. Jérémy Morin, former chef at Le Met in Toulouse. Accomplished and personal cuisine. 15 min from centre.",
      note_edito_es: "Estrella Michelin desde 2017. Jérémy Morin, ex chef del Met en Toulouse. Cocina elaborada y personal. 15 min del centro.",
      acces_transport: "Montrabé — 15 min en voiture depuis le centre",
      priorite_edito: 3,
      verifie_le: "2026-05-01",
      statut: "Publié",
    },
    osm_type: null, osm_id: null, lat: null, lng: null,
  },
  // ── Auberge de la Forge (Lavalette) ───────────────────────────────────────
  {
    data: {
      nom: "Auberge de la Forge",
      adresse: "8 rue Jean Parisot, 31590 Lavalette",
      categorie: "restaurant",
      personas: "04,08",
      fourchette_prix: "€€€",
      moment: "midi,soir",
      tags: "gastronomique,étoilé,chaleureux",
      note_edito_fr: "Étoilé Michelin. Claire et Théo Fernandez. Cuisine de terroir étoilée en cadre d'auberge. Pour client amateur de gastronomie ancrée dans le terroir occitan. 20 min du centre.",
      note_edito_en: "Michelin starred. Claire and Théo Fernandez. Starred terroir cuisine in an inn setting. For guests who love gastronomy rooted in Occitan terroir. 20 min from centre.",
      note_edito_es: "Estrella Michelin. Claire y Théo Fernandez. Cocina de terruño con estrella. Para amantes de la gastronomía occitana. 20 min del centro.",
      acces_transport: "Lavalette — 20 min en voiture depuis le centre",
      priorite_edito: 3,
      verifie_le: "2026-05-01",
      statut: "Publié",
    },
    osm_type: null, osm_id: null, lat: null, lng: null,
  },
  // ── En Pleine Nature (Quint-Fonsegrives) ──────────────────────────────────
  {
    data: {
      nom: "En Pleine Nature",
      adresse: "6 place de la Mairie, 31130 Quint-Fonsegrives",
      categorie: "restaurant",
      personas: "04,08",
      fourchette_prix: "€€€",
      moment: "midi,soir",
      tags: "gastronomique,étoilé,terrasse",
      note_edito_fr: "Étoilé Michelin. Sylvain Joffre, étoile retrouvée dans son nouvel établissement. Cuisine instinctive, nature et produits. Pour client avec véhicule, gastronomie hors les murs. 15 min.",
      note_edito_en: "Michelin starred. Sylvain Joffre, star regained in his new establishment. Instinctive cuisine, nature and produce. For guests with a vehicle. 15 min from centre.",
      note_edito_es: "Estrella Michelin. Sylvain Joffre, estrella recuperada en su nuevo establecimiento. Cocina instintiva. Para clientes con vehículo. 15 min del centro.",
      acces_transport: "Quint-Fonsegrives — 15 min en voiture depuis le centre",
      priorite_edito: 3,
      verifie_le: "2026-05-01",
      statut: "Publié",
    },
    osm_type: null, osm_id: null, lat: null, lng: null,
  },
  // ── Une Table à Deux ──────────────────────────────────────────────────────
  {
    data: {
      nom: "Une Table à Deux",
      adresse: "10 rue de la Pleau, 31000 Toulouse",
      categorie: "restaurant",
      personas: "04,08",
      fourchette_prix: "€€",
      moment: "soir",
      quartier: "Capitole",
      tags: "romantique,élégant,gastronomique",
      note_edito_fr: "Cadre confidentiel, menus courts et travaillés. Bib Gourmand Michelin. Idéal pour dîner romantique ou soirée intime. Ne désemplit pas — réservation impérative.",
      note_edito_en: "Intimate setting, short and refined menus. Michelin Bib Gourmand. Ideal for a romantic dinner. Always full — booking essential.",
      note_edito_es: "Marco íntimo, menús cortos y trabajados. Bib Gourmand Michelin. Ideal para una cena romántica. Siempre lleno — reserva imprescindible.",
      acces_transport: "Centre-ville — 7 min à pied du Capitole",
      priorite_edito: 4,
      verifie_le: "2026-05-01",
      statut: "Publié",
    },
    osm_type: "node", osm_id: "5075018122", lat: 43.6008, lng: 1.4448,
  },
];

async function main() {
  console.log(`🚀 Ajout de ${ETOILES.length} restaurants dans Baserow\n`);
  const created = [];

  for (const { data, osm_type, osm_id, lat, lng } of ETOILES) {
    try {
      const rowId = await createRow(data);
      if (osm_type && osm_id) {
        await injectOsm(rowId, osm_type, osm_id, lat, lng);
        console.log(`     → OSM ${osm_type}/${osm_id} injecté`);
      } else {
        console.log(`     → OSM à résoudre manuellement`);
      }
      created.push({ nom: data.nom, rowId, osm_type, osm_id });
    } catch (e) {
      console.error(`  ❌  ${data.nom} : ${e.message}`);
    }
  }

  console.log(`\n✅ Terminé — ${created.length} restaurants ajoutés`);
  created.forEach(r => console.log(`  ${r.nom} → ligne ${r.rowId} ${r.osm_id ? "(OSM ✓)" : "(OSM à injecter)"}`));
}

main().catch(e => { console.error(e); process.exit(1); });
