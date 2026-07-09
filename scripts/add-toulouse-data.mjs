// add-toulouse-data.mjs — Alimentation massive des tables TEFD depuis les sources vérifiées :
// Livret de référence factuelle V1 (mai 2026), fichier Michelin V4, recherches web juillet 2026.
// Node 18+. Lancement :
//   set BASEROW_TOKEN=ton_token
//   node scripts/add-toulouse-data.mjs

import https from 'https';

const API   = "https://api.baserow.io/api";
const EMAIL = "rouxraphael1@gmail.com";
const PASSWORD = "ChloeAlex26071812!";
const T = { adresses: 1045799, evenements: 1045800, parcours: 1045801 };

let TOKEN = null;

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function getJWTToken() {
  console.log('🔑 Obtention du token JWT...');
  const options = {
    hostname: 'api.baserow.io',
    path: '/api/user/token-auth/',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };
  const result = await makeRequest(options, { email: EMAIL, password: PASSWORD });
  console.log('✅ Token JWT obtenu');
  return result.token;
}

async function createRow(tableId, data) {
  const res = await fetch(`${API}/database/rows/table/${tableId}/?user_field_names=true`, {
    method: "POST",
    headers: { Authorization: `JWT ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`${res.status}: ${errorText.slice(0, 200)}`);
  }
  return (await res.json()).id;
}

// Vérifie si un nom existe déjà dans la table (anti-doublon)
async function existingNames(tableId, field = "nom") {
  const names = new Set();
  let url = `${API}/database/rows/table/${tableId}/?user_field_names=true&size=200`;
  while (url) {
    const res = await fetch(url, { headers: { Authorization: `JWT ${TOKEN}` } });
    if (!res.ok) {
      console.error(`  ⚠️  Erreur API table ${tableId}: ${res.status} ${await res.text()}`);
      break;
    }
    const data = await res.json();
    if (data.results) {
      data.results.forEach(r => { if (r[field]) names.add(r[field]); if (r[`${field}_fr`]) names.add(r[`${field}_fr`]); });
    }
    url = data.next;
  }
  return names;
}

/* ════════════════════════════════════════════════════════════════
   ADRESSES — salles de spectacle, églises, sport, bistronomie, emblèmes
   Sources : Livret TEFD V1 (adresses et accès vérifiés mai 2026),
   fichier Michelin V4, recherches web juillet 2026.
   ════════════════════════════════════════════════════════════════ */

const ADRESSES = [
  // ── GRANDES SALLES DE SPECTACLE (Livret section 06) ──────────────
  { nom: "Zénith Toulouse Métropole", categorie: "concert", personas: "03,05",
    adresse: "11 avenue Raymond Badiou, 31300 Toulouse", quartier: "Saint-Cyprien",
    moment: "soir", fourchette_prix: "€€", tags: "animé,moderne,groupe",
    latitude: 43.5966, longitude: 1.4108,
    note_edito_fr: "Jusqu'à 11 000 places. Grands concerts variété, pop-rock, humour, stars internationales. Métro A Arènes + 10 min à pied, ou tram T1 Casselardit. Parking gratuit 2 000 places.",
    note_edito_en: "Up to 11,000 seats. Major pop, rock and comedy shows, international stars. Metro A Arènes + 10 min walk, or tram T1 Casselardit. Free parking, 2,000 spaces.",
    note_edito_es: "Hasta 11 000 plazas. Grandes conciertos de variedades, pop-rock, humor, estrellas internacionales. Metro A Arènes + 10 min a pie.",
    acces_transport: "Métro A Arènes puis 10 min à pied · Tram T1 Casselardit · Parking gratuit 2 000 places",
    priorite_edito: 4, verifie_le: "2026-05-01", statut: "Publié" },

  { nom: "Le Bikini", categorie: "concert", personas: "07,08",
    adresse: "Rue Théodore Monod, 31520 Ramonville-Saint-Agne", quartier: "Rangueil",
    moment: "soir", fourchette_prix: "€€", tags: "animé,branché,tardif",
    latitude: 43.5474, longitude: 1.4796,
    note_edito_fr: "1 600 places debout. Salle de référence rock, électro, indie pour le public 25-45 ans. Métro B terminus Ramonville puis 10 min à pied.",
    note_edito_en: "1,600 standing. The reference venue for rock, electro and indie for the 25-45 crowd. Metro B to Ramonville terminus then 10 min walk.",
    note_edito_es: "1 600 plazas de pie. Sala de referencia rock, electro, indie para el público de 25-45 años. Metro B hasta Ramonville y 10 min a pie.",
    acces_transport: "Métro B terminus Ramonville puis 10 min à pied · Voiture 15 min du centre",
    priorite_edito: 3, verifie_le: "2026-05-01", statut: "Publié" },

  { nom: "Le Métronum", categorie: "concert", personas: "07",
    adresse: "5 rue Raymond Lizop, 31200 Toulouse", quartier: "Borderouge",
    moment: "soir", fourchette_prix: "€", tags: "animé,branché,moderne",
    latitude: 43.6421, longitude: 1.4530,
    note_edito_fr: "1 200 places debout. SMAC — rap, électro, world, émergence locale. Public jeune et urbain. Quartier Borderouge, métro B.",
    note_edito_en: "1,200 standing. Contemporary music venue — rap, electro, world, emerging local scene. Young urban crowd. Borderouge district, metro B.",
    note_edito_es: "1 200 plazas de pie. Sala de músicas actuales — rap, electro, world, escena local emergente. Público joven y urbano.",
    acces_transport: "Métro B Borderouge",
    priorite_edito: 3, verifie_le: "2026-05-01", statut: "Publié" },

  { nom: "Casino Théâtre Barrière", categorie: "theatre", personas: "04,03",
    adresse: "18 chemin de la Loge, 31400 Toulouse", quartier: "Île du Ramier",
    moment: "soir", fourchette_prix: "€€", tags: "animé,élégant",
    latitude: 43.5836, longitude: 1.4380,
    note_edito_fr: "1 200 places. One-man shows, concerts variété, café-théâtre. Restaurant et casino sur place — soirée complète possible au même endroit. Île du Ramier.",
    note_edito_en: "1,200 seats. Stand-up, variety concerts, café-théâtre. Restaurant and casino on site — a full evening in one place. Île du Ramier.",
    note_edito_es: "1 200 plazas. Monólogos, conciertos de variedades, café-teatro. Restaurante y casino en el lugar.",
    acces_transport: "Île du Ramier · Métro B Empalot puis 10 min à pied",
    priorite_edito: 3, verifie_le: "2026-05-01", statut: "Publié" },

  { nom: "Théâtre de la Cité (TNT)", categorie: "theatre", personas: "04,07,08",
    adresse: "1 rue Pierre Baudis, 31000 Toulouse", quartier: "Capitole",
    moment: "soir", fourchette_prix: "€€", tags: "culturel,contemporain",
    latitude: 43.6060, longitude: 1.4498,
    note_edito_fr: "Centre dramatique national — théâtre contemporain de création. Pour le client curieux de la scène vivante française. Centre-ville, proche Jean Jaurès.",
    note_edito_en: "National drama centre — contemporary creative theatre. For guests curious about the French live scene. City centre, near Jean Jaurès.",
    note_edito_es: "Centro dramático nacional — teatro contemporáneo de creación. Para el cliente curioso de la escena francesa.",
    acces_transport: "Métro A/B Jean Jaurès, 3 min à pied",
    priorite_edito: 3, verifie_le: "2026-05-01", statut: "Publié" },

  { nom: "La Halle de la Machine", categorie: "musee", personas: "05,06,07",
    adresse: "3 avenue de l'Aérodrome de Montaudran, 31400 Toulouse", quartier: "Rangueil",
    moment: "journée", fourchette_prix: "€€", tags: "famille,moderne,contemporain",
    latitude: 43.5794, longitude: 1.4837,
    note_edito_fr: "Spectacles mécaniques, le Minotaure géant en balade. Immanquable en famille, voisin de L'Envol des Pionniers à Montaudran — combinez les deux.",
    note_edito_en: "Mechanical spectacles, the giant Minotaur on the move. A must with children, next door to L'Envol des Pionniers in Montaudran — combine both.",
    note_edito_es: "Espectáculos mecánicos, el Minotauro gigante en movimiento. Imprescindible en familia, junto a L'Envol des Pionniers.",
    acces_transport: "Ligne L9 ou TER halte Montaudran · 15 min du centre",
    priorite_edito: 4, verifie_le: "2026-05-01", statut: "Publié" },

  { nom: "Muséum de Toulouse", categorie: "musee", personas: "05,08",
    adresse: "35 allées Jules Guesde, 31000 Toulouse", quartier: "Carmes",
    moment: "journée", fourchette_prix: "€€", tags: "famille,histoire,art",
    latitude: 43.5936, longitude: 1.4485,
    note_edito_fr: "Muséum d'histoire naturelle, l'un des plus riches de France. Jardin des Plantes attenant — idéal pour une demi-journée famille au calme.",
    note_edito_en: "Natural history museum, one of the richest in France. Adjoining Jardin des Plantes — ideal for a quiet family half-day.",
    note_edito_es: "Museo de historia natural, uno de los más ricos de Francia. Junto al Jardin des Plantes — ideal para media jornada en familia.",
    acces_transport: "Métro B Carmes ou Palais de Justice, 5 min à pied",
    priorite_edito: 3, verifie_le: "2026-05-01", statut: "Publié" },

  // ── ÉGLISES & PATRIMOINE (compléments) ─────────────────────────
  { nom: "Cathédrale Saint-Étienne", categorie: "eglise", personas: "07,08",
    adresse: "Place Saint-Étienne, 31000 Toulouse", quartier: "Carmes",
    moment: "journée", fourchette_prix: "€", tags: "historique,religieux,patrimoine,gratuit",
    latitude: 43.6006, longitude: 1.4506,
    note_edito_fr: "Cathédrale composite unique — deux églises inachevées réunies, nef romane et chœur gothique désaxés. La plus étrange et attachante des églises toulousaines. Gratuite.",
    note_edito_en: "A unique composite cathedral — two unfinished churches joined, with misaligned Romanesque nave and Gothic choir. The strangest and most endearing church in Toulouse. Free.",
    note_edito_es: "Catedral compuesta única — dos iglesias inacabadas unidas, nave románica y coro gótico desalineados. Gratuita.",
    acces_transport: "Métro B François Verdier, 4 min à pied",
    priorite_edito: 4, verifie_le: "2026-05-01", statut: "Publié" },

  { nom: "Notre-Dame de la Daurade", categorie: "eglise", personas: "02,08",
    adresse: "1 place de la Daurade, 31000 Toulouse", quartier: "Capitole",
    moment: "journée", fourchette_prix: "€", tags: "historique,religieux,patrimoine,gratuit",
    latitude: 43.6002, longitude: 1.4396,
    note_edito_fr: "Basilique néoclassique face à la Garonne, Vierge noire vénérée. Sortir sur le quai au coucher du soleil : la plus belle lumière de Toulouse. Gratuite.",
    note_edito_en: "Neoclassical basilica facing the Garonne, home to a revered Black Madonna. Step onto the quay at sunset: the most beautiful light in Toulouse. Free.",
    note_edito_es: "Basílica neoclásica frente al Garona, Virgen negra venerada. Salga al muelle al atardecer: la luz más bella de Toulouse. Gratuita.",
    acces_transport: "Métro A Esquirol, 5 min à pied",
    priorite_edito: 3, verifie_le: "2026-05-01", statut: "Publié" },

  { nom: "Notre-Dame du Taur", categorie: "eglise", personas: "07,08",
    adresse: "12 rue du Taur, 31000 Toulouse", quartier: "Capitole",
    moment: "journée", fourchette_prix: "€", tags: "historique,religieux,patrimoine,gratuit",
    latitude: 43.6060, longitude: 1.4423,
    note_edito_fr: "Sur le chemin entre Capitole et Saint-Sernin — clocher-mur emblématique du gothique toulousain. Halte discrète que les guides oublient. Gratuite.",
    note_edito_en: "On the way between Capitole and Saint-Sernin — an iconic bell-wall of Toulouse Gothic. A discreet stop the guidebooks forget. Free.",
    note_edito_es: "En el camino entre Capitole y Saint-Sernin — campanario-muro emblemático del gótico tolosano. Gratuita.",
    acces_transport: "Métro A Capitole, 3 min à pied",
    priorite_edito: 3, verifie_le: "2026-05-01", statut: "Publié" },

  // ── SALLES DE SPORT (recherche web juillet 2026) ────────────────
  { nom: "Keepcool Toulouse Capitole", categorie: "salle_sport", personas: "01",
    adresse: "6 impasse Baour Lormian, 31000 Toulouse", quartier: "Capitole",
    moment: "matin,midi,soir", fourchette_prix: "€€", tags: "moderne",
    latitude: 43.6046, longitude: 1.4459,
    note_edito_fr: "Salle de sport en plein centre, 7j/7 de 6h à 23h. Séance d'essai possible — la solution pour le client business qui veut garder sa routine. Cardio, musculation, small groups.",
    note_edito_en: "City-centre gym, open 7/7 from 6am to 11pm. Trial session possible — the solution for business guests keeping their routine. Cardio, weights, small groups.",
    note_edito_es: "Gimnasio en pleno centro, 7/7 de 6h a 23h. Sesión de prueba posible — la solución para el cliente de negocios.",
    acces_transport: "Métro A Capitole, 2 min à pied",
    priorite_edito: 4, verifie_le: "2026-07-01", statut: "Publié" },

  { nom: "Basic-Fit Toulouse Jean Jaurès", categorie: "salle_sport", personas: "01,05",
    adresse: "Allées Jean Jaurès, 31000 Toulouse", quartier: "Capitole",
    moment: "matin,midi,soir", fourchette_prix: "€", tags: "moderne",
    latitude: 43.6063, longitude: 1.4497,
    note_edito_fr: "Grande enseigne accessible, 7 zones d'entraînement, ouverte 7j/7. Pass journée possible pour le client de passage. Proche gare et centre.",
    note_edito_en: "Accessible chain gym, 7 training zones, open 7/7. Day pass available for visiting guests. Near the station and centre.",
    note_edito_es: "Cadena accesible, 7 zonas de entrenamiento, abierta 7/7. Pase de día disponible para el cliente de paso.",
    acces_transport: "Métro A/B Jean Jaurès",
    priorite_edito: 3, verifie_le: "2026-07-01", statut: "Publié" },

  // ── LIEUX EMBLÉMATIQUES (visite) ────────────────────────────────
  { nom: "Place du Capitole", categorie: "visite", personas: "01,02,04,05,06,07,08",
    adresse: "Place du Capitole, 31000 Toulouse", quartier: "Capitole",
    moment: "matin,midi,soir", fourchette_prix: "€", tags: "historique,patrimoine,gratuit,animé",
    latitude: 43.6045, longitude: 1.4440,
    note_edito_fr: "Le cœur battant de Toulouse — façade du Capitole, croix occitane au sol, Salle des Illustres gratuite à l'étage (souvent ignorée des visiteurs). Point de départ de toute découverte.",
    note_edito_en: "The beating heart of Toulouse — the Capitole façade, the Occitan cross on the ground, and the free Salle des Illustres upstairs (often missed by visitors). The starting point of any visit.",
    note_edito_es: "El corazón de Toulouse — fachada del Capitole, cruz occitana en el suelo, Salle des Illustres gratuita arriba (a menudo ignorada).",
    acces_transport: "Métro A Capitole, sortie directe sur la place",
    priorite_edito: 5, verifie_le: "2026-05-01", statut: "Publié" },

  { nom: "Jardin Japonais Pierre Baudis", categorie: "visite", personas: "04,08",
    adresse: "Boulevard Lascrosses, 31000 Toulouse", quartier: "Compans",
    moment: "matin,midi", fourchette_prix: "€", tags: "calme,romantique,gratuit",
    latitude: 43.6108, longitude: 1.4358,
    note_edito_fr: "Havre zen au cœur de Compans-Caffarelli — pont rouge, pavillon de thé, carpes koï. Le spot le plus apaisant de la ville, gratuit et méconnu des touristes.",
    note_edito_en: "A zen haven in Compans-Caffarelli — red bridge, tea pavilion, koi carp. The most soothing spot in the city, free and unknown to tourists.",
    note_edito_es: "Refugio zen en Compans-Caffarelli — puente rojo, pabellón de té, carpas koi. El lugar más relajante de la ciudad, gratuito.",
    acces_transport: "Métro B Compans-Caffarelli, 3 min à pied",
    priorite_edito: 4, verifie_le: "2026-05-01", statut: "Publié" },

  { nom: "Prairie des Filtres", categorie: "visite", personas: "05,08",
    adresse: "Cours Dillon, 31300 Toulouse", quartier: "Saint-Cyprien",
    moment: "matin,midi,soir", fourchette_prix: "€", tags: "calme,famille,gratuit,vue",
    latitude: 43.5977, longitude: 1.4372,
    note_edito_fr: "Grand parc au bord de la Garonne, vue sur le Pont-Neuf et l'Hôtel-Dieu. Pique-nique, sieste, Rio Loco en juin. La respiration verte du centre-ville.",
    note_edito_en: "Large park on the Garonne, view of the Pont-Neuf and Hôtel-Dieu. Picnics, naps, Rio Loco festival in June. The green lung of the city centre.",
    note_edito_es: "Gran parque a orillas del Garona, vista al Pont-Neuf. Picnic, siesta, festival Rio Loco en junio. El pulmón verde del centro.",
    acces_transport: "Métro A Esquirol puis Pont-Neuf à pied, 8 min",
    priorite_edito: 4, verifie_le: "2026-05-01", statut: "Publié" },

  // ── BISTRONOMIE MICHELIN complémentaire (fichier V4) ────────────
  { nom: "Émile", categorie: "restaurant", personas: "03,07",
    adresse: "13 place Saint-Georges, 31000 Toulouse", quartier: "Capitole",
    moment: "midi,soir", fourchette_prix: "€€", tags: "gastronomique,terrasse,historique",
    latitude: 43.6034, longitude: 1.4472,
    note_edito_fr: "L'adresse de référence pour le cassoulet toulousain — la spécialité qu'un visiteur doit goûter une fois. Terrasse sur la jolie place Saint-Georges.",
    note_edito_en: "THE reference for Toulouse cassoulet — the local dish every visitor must try once. Terrace on pretty Place Saint-Georges.",
    note_edito_es: "LA referencia del cassoulet tolosano — el plato que todo visitante debe probar. Terraza en la plaza Saint-Georges.",
    acces_transport: "Métro A Capitole ou Jean Jaurès, 5 min à pied",
    priorite_edito: 5, verifie_le: "2026-05-01", statut: "Publié" },

  { nom: "L'Air de Famille", categorie: "restaurant", personas: "01,05",
    adresse: "6 rue Jules-Chalande, 31000 Toulouse", quartier: "Capitole",
    moment: "midi,soir", fourchette_prix: "€€", tags: "bistronomique,historique,accueillant",
    latitude: 43.6027, longitude: 1.4441,
    note_edito_fr: "Bistrot authentique au décor d'époque, sélection Michelin. Cuisine traditionnelle sincère, rapport qualité-prix imbattable. Tête de veau ravigote pour les connaisseurs.",
    note_edito_en: "Authentic bistro with a period interior, Michelin selected. Sincere traditional cuisine, unbeatable value.",
    note_edito_es: "Bistró auténtico con decoración de época, selección Michelin. Cocina tradicional sincera, relación calidad-precio imbatible.",
    acces_transport: "Métro A Capitole, 4 min à pied",
    priorite_edito: 4, verifie_le: "2026-05-01", statut: "Publié" },

  { nom: "Ma Biche sur le Toit", categorie: "restaurant", personas: "04,07",
    adresse: "4-8 rue Lieutenant-Colonel-Pélissier, 31000 Toulouse", quartier: "Capitole",
    moment: "midi,soir", fourchette_prix: "€€", tags: "vue,branché,terrasse",
    latitude: 43.6041, longitude: 1.4457,
    note_edito_fr: "Dernier étage des Galeries Lafayette, carte validée par Michel Sarran. L'une des plus belles vues sur les toits roses — réservez côté terrasse au coucher du soleil.",
    note_edito_en: "Top floor of Galeries Lafayette, menu endorsed by Michel Sarran. One of the finest views over the pink rooftops — book the terrace side at sunset.",
    note_edito_es: "Última planta de Galeries Lafayette, carta avalada por Michel Sarran. Una de las mejores vistas sobre los tejados rosas.",
    acces_transport: "Métro A Capitole, 2 min à pied",
    priorite_edito: 4, verifie_le: "2026-05-01", statut: "Publié" },

  { nom: "Le Pyrénéen", categorie: "restaurant", personas: "01,03",
    adresse: "14 allées Jean-Jaurès, 31000 Toulouse", quartier: "Capitole",
    moment: "midi,soir", fourchette_prix: "€€", tags: "historique,gastronomique,groupe",
    latitude: 43.6060, longitude: 1.4494,
    note_edito_fr: "Brasserie de 1925, plafond magnifique, peintures des Pyrénées. Huîtres, poissons et viandes dans un esprit d'antan. Institution centenaire pour dîner d'équipe ou d'affaires.",
    note_edito_en: "A 1925 brasserie with a magnificent ceiling and Pyrenees murals. Oysters, fish and meats in an old-world spirit. A century-old institution for team or business dinners.",
    note_edito_es: "Brasserie de 1925, techo magnífico, pinturas de los Pirineos. Institución centenaria para cenas de equipo o de negocios.",
    acces_transport: "Métro A/B Jean Jaurès, 2 min à pied",
    priorite_edito: 3, verifie_le: "2026-05-01", statut: "Publié" },

  { nom: "J'Go", categorie: "restaurant", personas: "03,05",
    adresse: "16 place Victor-Hugo, 31000 Toulouse", quartier: "Capitole",
    moment: "midi,soir", fourchette_prix: "€€", tags: "terrasse,animé,accueillant",
    latitude: 43.6064, longitude: 1.4462,
    note_edito_fr: "Terroir et circuit court à deux pas du marché Victor-Hugo — agneau, canard, produits de paysans partenaires. Convivial, généreux, très toulousain.",
    note_edito_en: "Terroir and short supply chains next to the Victor-Hugo market — lamb, duck, produce from partner farmers. Convivial, generous, very Toulouse.",
    note_edito_es: "Terruño y circuito corto junto al mercado Victor-Hugo — cordero, pato, productos de agricultores. Convivial y generoso.",
    acces_transport: "Métro A Jean Jaurès ou Capitole, 4 min à pied",
    priorite_edito: 3, verifie_le: "2026-05-01", statut: "Publié" },

  { nom: "La Faim des Haricots", categorie: "restaurant", personas: "05,08",
    adresse: "3 rue du Puits-Vert, 31000 Toulouse", quartier: "Capitole",
    moment: "midi,soir", fourchette_prix: "€", tags: "végétarien,famille,décontracté",
    latitude: 43.6027, longitude: 1.4446,
    note_edito_fr: "Végétarien avec buffet à volonté, moins de 20 €. Plats simples, colorés et équilibrés — la halte familiale futée où chacun compose son assiette.",
    note_edito_en: "Vegetarian with all-you-can-eat buffet, under €20. Simple, colourful, balanced dishes — the smart family stop where everyone builds their own plate.",
    note_edito_es: "Vegetariano con bufé libre, menos de 20 €. Platos simples, coloridos y equilibrados — la parada familiar inteligente.",
    acces_transport: "Métro A Capitole, 3 min à pied",
    priorite_edito: 3, verifie_le: "2026-05-01", statut: "Publié" },
];

/* ════════════════════════════════════════════════════════════════
   ÉVÉNEMENTS — festivals récurrents (Livret section 04), salons
   (section 05), saison rugby 2026-2027 (vérifiée web juillet 2026)
   ════════════════════════════════════════════════════════════════ */

const EVENEMENTS = [
  // ── Festivals récurrents (Livret) ────────────────────────────────
  { titre_fr: "Rio Loco — musiques du monde", titre_en: "Rio Loco World Music Festival", titre_es: "Rio Loco — músicas del mundo",
    categorie: "concert", personas: "07,08",
    date_debut: "2027-06-15", date_fin: "2027-06-20", recurrent: true,
    recurrence_note: "Chaque mi-juin, Prairie des Filtres, 5 jours, +100 000 visiteurs. Pic hôtelier majeur.",
    url_billetterie: "https://riolo.co.toulouse.fr", source: "Curation", verifie_le: "2026-05-01", statut: "Publié" },

  { titre_fr: "Marché de Noël de Toulouse", titre_en: "Toulouse Christmas Market", titre_es: "Mercado de Navidad de Toulouse",
    categorie: "concert", personas: "02,05,07,08",
    date_debut: "2026-11-27", date_fin: "2026-12-27", recurrent: true,
    recurrence_note: "Fin novembre à fin décembre, place du Capitole, 4 semaines, affluence forte.",
    url_billetterie: null, source: "Curation", verifie_le: "2026-05-01", statut: "Publié" },

  { titre_fr: "Toulouse les Orgues", titre_en: "Toulouse les Orgues Organ Festival", titre_es: "Toulouse les Orgues",
    categorie: "concert", personas: "04,08",
    date_debut: "2026-10-01", date_fin: "2026-10-15", recurrent: true,
    recurrence_note: "Chaque octobre — festival international d'orgue dans les églises de la ville.",
    url_billetterie: "https://toulouse-les-orgues.org", source: "Curation", verifie_le: "2026-05-01", statut: "Publié" },

  { titre_fr: "Cinespaña — festival du cinéma espagnol", titre_en: "Cinespaña Spanish Film Festival", titre_es: "Cinespaña — festival de cine español",
    categorie: "concert", personas: "02",
    date_debut: "2026-10-01", date_fin: "2026-10-11", recurrent: true,
    recurrence_note: "Chaque octobre — le rendez-vous du cinéma espagnol, très pertinent pour la clientèle ibérique.",
    url_billetterie: "https://cinespagnol.com", source: "Curation", verifie_le: "2026-05-01", statut: "Publié" },

  { titre_fr: "Le Printemps de Septembre", titre_en: "Le Printemps de Septembre Art Festival", titre_es: "Le Printemps de Septembre",
    categorie: "concert", personas: "04,07,08",
    date_debut: "2026-09-18", date_fin: "2026-10-18", recurrent: true,
    recurrence_note: "Septembre-octobre — festival d'art contemporain gratuit dans toute la ville.",
    url_billetterie: "https://printempsdeseptembre.com", source: "Curation", verifie_le: "2026-05-01", statut: "Publié" },

  { titre_fr: "Carnaval de Toulouse", titre_en: "Toulouse Carnival", titre_es: "Carnaval de Toulouse",
    categorie: "concert", personas: "05",
    date_debut: "2027-03-01", date_fin: "2027-03-31", recurrent: true,
    recurrence_note: "Chaque mars — grande parade en centre-ville, journée familiale.",
    url_billetterie: null, source: "Curation", verifie_le: "2026-05-01", statut: "Publié" },

  { titre_fr: "Marathon des Mots", titre_en: "Marathon des Mots Literary Festival", titre_es: "Marathon des Mots",
    categorie: "concert", personas: "04,08",
    date_debut: "2027-06-22", date_fin: "2027-06-27", recurrent: true,
    recurrence_note: "Chaque juin — festival international de littérature, lectures dans des lieux multiples.",
    url_billetterie: "https://lemarathondesmots.com", source: "Curation", verifie_le: "2026-05-01", statut: "Publié" },

  { titre_fr: "Toulouse Plages", titre_en: "Toulouse Beaches", titre_es: "Toulouse Playas",
    categorie: "concert", personas: "05,08",
    date_debut: "2026-07-10", date_fin: "2026-08-31", recurrent: true,
    recurrence_note: "Juillet-août — installation estivale familiale sur l'île du Ramier.",
    url_billetterie: null, source: "Curation", verifie_le: "2026-05-01", statut: "Publié" },

  { titre_fr: "Festival Toulouse d'Été", titre_en: "Toulouse Summer Festival", titre_es: "Festival Toulouse de Verano",
    categorie: "concert", personas: "07,08",
    date_debut: "2026-07-15", date_fin: "2026-08-15", recurrent: true,
    recurrence_note: "Juillet-août — tous styles musicaux, scènes multiples en ville.",
    url_billetterie: "https://toulousedete.org", source: "Curation", verifie_le: "2026-05-01", statut: "Publié" },

  { titre_fr: "Siestes Électroniques", titre_en: "Electronic Siestas", titre_es: "Siestas Electrónicas",
    categorie: "concert", personas: "07",
    date_debut: "2026-08-01", date_fin: "2026-08-31", recurrent: true,
    recurrence_note: "Chaque août — musiques électroniques au Jardin Compans-Caffarelli, gratuit.",
    url_billetterie: null, source: "Curation", verifie_le: "2026-05-01", statut: "Publié" },

  // ── Salons business (Livret section 05) ─────────────────────────
  { titre_fr: "Aeromart Toulouse 2026", titre_en: "Aeromart Toulouse 2026", titre_es: "Aeromart Toulouse 2026",
    categorie: "evenement_sportif", personas: "01",
    date_debut: "2026-12-01", date_fin: "2026-12-03", recurrent: false,
    recurrence_note: "Biennal — 16e édition. 5 000 participants, 800 exposants, 40 pays. Pic hôtelier majeur. MEETT.",
    url_billetterie: "https://toulouse.bciaerospace.com", source: "Curation", verifie_le: "2026-05-01", statut: "Publié" },

  { titre_fr: "Foire Internationale de Toulouse", titre_en: "Toulouse International Fair", titre_es: "Feria Internacional de Toulouse",
    categorie: "evenement_sportif", personas: "01",
    date_debut: "2026-11-07", date_fin: "2026-11-15", recurrent: true,
    recurrence_note: "Chaque novembre au MEETT — grand public, pic de fréquentation.",
    url_billetterie: "https://foiredetoulouse.com", source: "Curation", verifie_le: "2026-05-01", statut: "Publié" },

  // ── Saison rugby 2026-2027 (vérifiée juillet 2026) ──────────────
  { titre_fr: "Top 14 — reprise saison 2026-2027 à Ernest-Wallon", titre_en: "Top 14 — 2026-2027 season opener at Ernest-Wallon", titre_es: "Top 14 — inicio temporada 2026-2027",
    categorie: "evenement_sportif", personas: "03",
    date_debut: "2026-09-05", date_fin: "2027-06-05", recurrent: true,
    recurrence_note: "Saison régulière du 5 sept 2026 au 5 juin 2027, 26 journées, ~13 matchs domicile. Calendrier détaillé publié mi-juillet par la LNR — vérifier stadetoulousain.fr. Grands derbies (La Rochelle, Bordeaux, Toulon) = saturation hôtelière.",
    url_billetterie: "https://billetterie.stadetoulousain.fr", source: "Curation", verifie_le: "2026-07-01", statut: "Publié" },

  { titre_fr: "Finale Top 14 2027 — Stade de France", titre_en: "Top 14 Final 2027", titre_es: "Final Top 14 2027",
    categorie: "evenement_sportif", personas: "03",
    date_debut: "2027-06-27", date_fin: "2027-06-27", recurrent: false,
    recurrence_note: "Si Toulouse est en finale : soirée de folie en ville, écrans géants, saturation des brasseries.",
    url_billetterie: null, source: "Curation", verifie_le: "2026-07-01", statut: "Publié" },

  { titre_fr: "Fête de la Musique", titre_en: "Music Day", titre_es: "Fiesta de la Música",
    categorie: "concert", personas: "05,07,08",
    date_debut: "2027-06-21", date_fin: "2027-06-21", recurrent: true,
    recurrence_note: "Chaque 21 juin — toute la ville, scènes gratuites partout.",
    url_billetterie: null, source: "Curation", verifie_le: "2026-05-01", statut: "Publié" },
];

/* ════════════════════════════════════════════════════════════════
   PARCOURS — footing et visites à pied (curation TEFD)
   ════════════════════════════════════════════════════════════════ */

const PARCOURS = [
  { nom_fr: "Footing des Berges — boucle Garonne", nom_en: "Garonne Riverside Run", nom_es: "Footing de las orillas del Garona",
    type: "Footing", personas: "01,08",
    duree_min: 30, distance_km: 5.0, profil_ors: "foot-walking",
    point_depart: "Pont-Neuf (ou depuis l'hôtel)",
    description_fr: "La boucle classique : quai de la Daurade → Pont Saint-Pierre → rive gauche par la Prairie des Filtres → retour Pont-Neuf. Plat, éclairé, sûr — parfait avant le petit-déjeuner. Lumière dorée au lever du soleil.",
    description_en: "The classic loop: Daurade quay → Pont Saint-Pierre → left bank via Prairie des Filtres → back over the Pont-Neuf. Flat, lit, safe — perfect before breakfast. Golden light at sunrise.",
    description_es: "El circuito clásico: muelle de la Daurade → Pont Saint-Pierre → orilla izquierda por la Prairie des Filtres → regreso por el Pont-Neuf. Llano, iluminado, seguro.",
    verifie_le: "2026-05-01", statut: "Publié" },

  { nom_fr: "Footing du Canal du Midi", nom_en: "Canal du Midi Run", nom_es: "Footing del Canal du Midi",
    type: "Footing", personas: "01,08",
    duree_min: 45, distance_km: 8.0, profil_ors: "foot-walking",
    point_depart: "Port Saint-Sauveur (ou depuis l'hôtel)",
    description_fr: "Aller-retour sous les platanes du canal classé UNESCO — Port Saint-Sauveur vers Port de l'Embouchure. Ombragé l'été, au calme, sans dénivelé. Le footing signature de Toulouse.",
    description_en: "Out-and-back under the plane trees of the UNESCO-listed canal — Port Saint-Sauveur towards Port de l'Embouchure. Shaded in summer, calm, flat. Toulouse's signature run.",
    description_es: "Ida y vuelta bajo los plátanos del canal UNESCO — Port Saint-Sauveur hacia Port de l'Embouchure. Sombreado en verano, tranquilo, llano.",
    verifie_le: "2026-05-01", statut: "Publié" },

  { nom_fr: "Toulouse essentielle — 2 heures", nom_en: "Essential Toulouse — 2 hours", nom_es: "Toulouse esencial — 2 horas",
    type: "Visite à pied", personas: "01,06,07",
    duree_min: 120, distance_km: 3.5, profil_ors: "foot-walking",
    point_depart: "Place du Capitole",
    description_fr: "Le condensé parfait pour un premier contact : Capitole et Salle des Illustres → rue du Taur → Saint-Sernin → Jacobins → quai de la Daurade → Pont-Neuf. Les cinq monuments majeurs en une boucle courte, idéale entre deux rendez-vous.",
    description_en: "The perfect first-contact condensed tour: Capitole and Salle des Illustres → rue du Taur → Saint-Sernin → Jacobins → Daurade quay → Pont-Neuf. The five major monuments in one short loop, ideal between two meetings.",
    description_es: "El resumen perfecto para un primer contacto: Capitole → rue du Taur → Saint-Sernin → Jacobins → muelle de la Daurade → Pont-Neuf. Los cinco monumentos en un circuito corto.",
    verifie_le: "2026-05-01", statut: "Publié" },

  { nom_fr: "Toulouse secrète — cours cachées et hôtels particuliers", nom_en: "Secret Toulouse — hidden courtyards", nom_es: "Toulouse secreta — patios escondidos",
    type: "Visite à pied", personas: "07,08",
    duree_min: 150, distance_km: 4.0, profil_ors: "foot-walking",
    point_depart: "Hôtel d'Assézat",
    description_fr: "Hors des sentiers battus : hôtel d'Assézat → rue Pharaon et les Carmes → cour de la Maison de l'Occitanie → hôtel de Bernuy → détours par les ruelles du vieux Toulouse. La ville des pastels que les guides ne montrent pas.",
    description_en: "Off the beaten track: Hôtel d'Assézat → rue Pharaon and Les Carmes → the Maison de l'Occitanie courtyard → Hôtel de Bernuy → detours through old Toulouse's alleys. The pastel merchants' city the guides never show.",
    description_es: "Fuera de las rutas típicas: hôtel d'Assézat → rue Pharaon y Les Carmes → patio de la Maison de l'Occitanie → hôtel de Bernuy. La ciudad de los pasteles que las guías no muestran.",
    verifie_le: "2026-05-01", statut: "Publié" },

  { nom_fr: "Balade du soir — coucher de soleil sur la Garonne", nom_en: "Evening stroll — Garonne sunset", nom_es: "Paseo del atardecer — puesta de sol en el Garona",
    type: "Visite à pied", personas: "04,02",
    duree_min: 45, distance_km: 2.0, profil_ors: "foot-walking",
    point_depart: "Place de la Daurade",
    description_fr: "La plus belle heure de Toulouse : quai de la Daurade → Pont-Neuf → rive gauche → passerelle Viguerie → retour par le Pont Saint-Pierre. Les briques deviennent dorées puis roses. À proposer au couple avant le dîner — timing parfait avant une table à 20h30.",
    description_en: "Toulouse's finest hour: Daurade quay → Pont-Neuf → left bank → Viguerie footbridge → back over Pont Saint-Pierre. The bricks turn gold then pink. Suggest it to couples before dinner — perfect timing before an 8:30pm table.",
    description_es: "La hora más bella de Toulouse: muelle de la Daurade → Pont-Neuf → orilla izquierda → pasarela Viguerie → regreso por el Pont Saint-Pierre. Los ladrillos se vuelven dorados y luego rosas.",
    verifie_le: "2026-05-01", statut: "Publié" },
];

/* ════════════════════════════════════════════════════════════════ */

async function seedTable(tableId, rows, label, nameField = "nom") {
  console.log(`\n📦 ${label} — ${rows.length} entrées candidates`);
  const existing = await existingNames(tableId, nameField);
  let ok = 0, skip = 0, fail = 0;
  for (const row of rows) {
    const name = row[nameField] || row[`${nameField}_fr`];
    if (existing.has(name)) { console.log(`  ↩  ${name} existe déjà`); skip++; continue; }
    try { await createRow(tableId, row); console.log(`  ✓  ${name}`); ok++; }
    catch (e) { console.error(`  ❌  ${name} : ${e.message.slice(0, 120)}`); fail++; }
  }
  console.log(`   → ${ok} créées, ${skip} ignorées (doublons), ${fail} erreurs`);
}

async function main() {
  // Get JWT token first
  TOKEN = await getJWTToken();
  
  console.log("🚀 Alimentation TEFD — données Toulouse vérifiées (Livret V1 + Michelin V4 + web 07/2026)");
  await seedTable(T.adresses,   ADRESSES,   "ADRESSES",   "nom");
  await seedTable(T.evenements, EVENEMENTS, "ÉVÉNEMENTS", "titre_fr");
  await seedTable(T.parcours,   PARCOURS,   "PARCOURS",   "nom_fr");
  console.log("\n✅ Terminé. Relance : node scripts/export.mjs puis git add/commit/push.");
  console.log("   Rappel : résoudre les osm_id des nouvelles adresses (resolve-osm ou inject-osm).");
}

main().catch(e => { console.error(e); process.exit(1); });
