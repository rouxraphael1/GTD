// bootstrap-baserow.mjs — Crée les champs TEFD dans les 7 tables Baserow
// et pré-remplit Personas + Catégories.
// Node 18+. Lancement :
//   set BASEROW_TOKEN=ton_nouveau_token
//   node scripts/bootstrap-baserow.mjs

const API   = "https://api.baserow.io/api";
const TOKEN = process.env.BASEROW_TOKEN;

const TABLES = {
  adresses:   1045799,
  evenements: 1045800,
  parcours:   1045801,
  personas:   1045802,
  categories: 1045803,
  suggestions:1045804,
  hotels:     1045805,
};

if (!TOKEN) {
  console.error("❌  BASEROW_TOKEN manquant. Lance : set BASEROW_TOKEN=ton_token");
  process.exit(1);
}

// ---------- helpers ----------

async function req(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Token ${TOKEN}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

// Récupère les champs existants d'une table
async function existingFields(tableId) {
  const data = await req("GET", `/database/fields/table/${tableId}/`);
  return data.map(f => f.name);
}

// Crée un champ seulement s'il n'existe pas déjà
async function field(tableId, existing, spec) {
  if (existing.includes(spec.name)) {
    console.log(`  ↩  ${spec.name} existe déjà`);
    return;
  }
  await req("POST", `/database/fields/table/${tableId}/`, spec);
  console.log(`  ✓  ${spec.name} (${spec.type})`);
}

// Crée une ligne
async function row(tableId, data) {
  return req("POST", `/database/rows/table/${tableId}/?user_field_names=true`, data);
}

// Vérifie si une table a déjà des lignes
async function isEmpty(tableId) {
  const data = await req("GET", `/database/rows/table/${tableId}/?size=1`);
  return data.count === 0;
}

// ---------- définition des champs par table ----------

async function createFields() {

  // ── ADRESSES ──────────────────────────────────────────────
  console.log("\n📍 Adresses");
  const eA = await existingFields(TABLES.adresses);
  const adresseFields = [
    { name:"nom",              type:"text" },
    { name:"note_edito_fr",    type:"long_text" },
    { name:"note_edito_en",    type:"long_text" },
    { name:"note_edito_es",    type:"long_text" },
    { name:"adresse",          type:"text" },
    { name:"latitude",         type:"number", number_decimal_places:6 },
    { name:"longitude",        type:"number", number_decimal_places:6 },
    { name:"osm_id",           type:"text" },
    { name:"osm_type",         type:"text" },
    { name:"acces_transport",  type:"long_text" },
    { name:"fourchette_prix",  type:"single_select",
      select_options:[{value:"€",color:"green"},{value:"€€",color:"yellow"},{value:"€€€",color:"orange"},{value:"€€€€",color:"red"}] },
    { name:"moment",           type:"multiple_select",
      select_options:[{value:"matin",color:"blue"},{value:"midi",color:"yellow"},{value:"soir",color:"purple"},{value:"journée",color:"green"}] },
    { name:"accessible_pmr",   type:"boolean" },
    { name:"source",           type:"single_select",
      select_options:[{value:"Livret",color:"blue"},{value:"DATAtourisme",color:"green"},{value:"OSM",color:"orange"},{value:"Curation terrain",color:"purple"}] },
    { name:"priorite_edito",   type:"number", number_decimal_places:0 },
    { name:"verifie_le",       type:"date", date_format:"ISO" },
    { name:"valide_jusqu_au",  type:"date", date_format:"ISO" },
    { name:"quartier",         type:"single_select",
      select_options:[
        {value:"Capitole",color:"red"},{value:"Carmes",color:"orange"},
        {value:"Saint-Cyprien",color:"blue"},{value:"Sept Deniers",color:"green"},
        {value:"Compans",color:"yellow"},{value:"Borderouge",color:"purple"},
        {value:"Île du Ramier",color:"cyan"},{value:"Rangueil",color:"pink"},
      ] },
    { name:"statut",           type:"single_select",
      select_options:[{value:"Publié",color:"green"},{value:"Brouillon",color:"yellow"},{value:"À revérifier",color:"orange"},{value:"Archivé",color:"red"}] },
    { name:"tags",             type:"multiple_select",
      select_options:[
        {value:"terrasse",color:"green"},{value:"végétarien",color:"lime"},
        {value:"romantique",color:"pink"},{value:"groupe",color:"blue"},
        {value:"vue",color:"cyan"},{value:"tardif",color:"purple"},
        {value:"étoilé",color:"yellow"},{value:"PMR",color:"orange"},
      ] },
  ];
  for (const f of adresseFields) await field(TABLES.adresses, eA, f);

  // ── ÉVÉNEMENTS ────────────────────────────────────────────
  console.log("\n📅 Événements");
  const eE = await existingFields(TABLES.evenements);
  const evenementFields = [
    { name:"titre_fr",         type:"text" },
    { name:"titre_en",         type:"text" },
    { name:"titre_es",         type:"text" },
    { name:"date_debut",       type:"date", date_format:"ISO" },
    { name:"date_fin",         type:"date", date_format:"ISO" },
    { name:"recurrent",        type:"boolean" },
    { name:"recurrence_note",  type:"text" },
    { name:"url_billetterie",  type:"url" },
    { name:"source",           type:"single_select",
      select_options:[{value:"OpenAgenda",color:"blue"},{value:"OpenData Toulouse",color:"green"},{value:"DATAtourisme",color:"orange"},{value:"Curation",color:"purple"}] },
    { name:"verifie_le",       type:"date", date_format:"ISO" },
    { name:"statut",           type:"single_select",
      select_options:[{value:"Publié",color:"green"},{value:"Brouillon",color:"yellow"},{value:"Archivé",color:"red"}] },
  ];
  for (const f of evenementFields) await field(TABLES.evenements, eE, f);

  // ── PARCOURS ──────────────────────────────────────────────
  console.log("\n🗺  Parcours");
  const eP = await existingFields(TABLES.parcours);
  const parcoursFields = [
    { name:"nom_fr",           type:"text" },
    { name:"nom_en",           type:"text" },
    { name:"nom_es",           type:"text" },
    { name:"type",             type:"single_select",
      select_options:[{value:"Footing",color:"green"},{value:"Visite à pied",color:"blue"}] },
    { name:"duree_min",        type:"number", number_decimal_places:0 },
    { name:"distance_km",      type:"number", number_decimal_places:1 },
    { name:"profil_ors",       type:"single_select",
      select_options:[{value:"foot-walking",color:"green"},{value:"foot-hiking",color:"orange"}] },
    { name:"description_fr",   type:"long_text" },
    { name:"description_en",   type:"long_text" },
    { name:"description_es",   type:"long_text" },
    { name:"point_depart",     type:"text" },
    { name:"verifie_le",       type:"date", date_format:"ISO" },
    { name:"statut",           type:"single_select",
      select_options:[{value:"Publié",color:"green"},{value:"Brouillon",color:"yellow"},{value:"Archivé",color:"red"}] },
  ];
  for (const f of parcoursFields) await field(TABLES.parcours, eP, f);

  // ── PERSONAS ──────────────────────────────────────────────
  console.log("\n👤 Personas");
  const ePe = await existingFields(TABLES.personas);
  const personaFields = [
    { name:"code",             type:"text" },
    { name:"nom_fr",           type:"text" },
    { name:"nom_en",           type:"text" },
    { name:"nom_es",           type:"text" },
    { name:"bibliotheque",     type:"text" },
    { name:"ressort_emotionnel", type:"long_text" },
    { name:"ton",              type:"long_text" },
    { name:"description",      type:"long_text" },
  ];
  for (const f of personaFields) await field(TABLES.personas, ePe, f);

  // ── CATÉGORIES ────────────────────────────────────────────
  console.log("\n🏷  Catégories");
  const eC = await existingFields(TABLES.categories);
  const categorieFields = [
    { name:"cle",              type:"text" },
    { name:"label_fr",         type:"text" },
    { name:"label_en",         type:"text" },
    { name:"label_es",         type:"text" },
    { name:"icone",            type:"text" },
    { name:"type_donnee",      type:"single_select",
      select_options:[{value:"Lieu",color:"blue"},{value:"Événement",color:"orange"},{value:"Parcours",color:"green"}] },
  ];
  for (const f of categorieFields) await field(TABLES.categories, eC, f);

  // ── SUGGESTIONS ───────────────────────────────────────────
  console.log("\n💡 Suggestions");
  const eS = await existingFields(TABLES.suggestions);
  const suggestionFields = [
    { name:"nom",              type:"text" },
    { name:"adresse",          type:"text" },
    { name:"commentaire",      type:"long_text" },
    { name:"propose_par",      type:"text" },
    { name:"statut_moderation", type:"single_select",
      select_options:[{value:"Nouvelle",color:"blue"},{value:"En revue",color:"yellow"},{value:"Acceptée",color:"green"},{value:"Refusée",color:"red"}] },
  ];
  for (const f of suggestionFields) await field(TABLES.suggestions, eS, f);

  // ── HÔTELS ────────────────────────────────────────────────
  console.log("\n🏨 Hôtels");
  const eH = await existingFields(TABLES.hotels);
  const hotelFields = [
    { name:"nom",              type:"text" },
    { name:"adresse",          type:"text" },
    { name:"latitude",         type:"number", number_decimal_places:6 },
    { name:"longitude",        type:"number", number_decimal_places:6 },
    { name:"referent_tefd",    type:"text" },
    { name:"actif",            type:"boolean" },
  ];
  for (const f of hotelFields) await field(TABLES.hotels, eH, f);
}

// ---------- pré-remplissage ----------

async function seed() {

  // ── 8 PERSONAS TEFD ───────────────────────────────────────
  console.log("\n🌱 Remplissage Personas...");
  if (await isEmpty(TABLES.personas)) {
    const personas = [
      { code:"01", nom_fr:"Business aéronautique", nom_en:"Aerospace business", nom_es:"Negocios aéreo",
        bibliotheque:"Toulouse iconique",
        ressort_emotionnel:"Efficacité reconnue, anticipation logistique",
        ton:"Direct, factuel, sans bavardage. Anticipe les besoins logistiques (taxi, horaires, wifi). Ne retient pas inutilement.",
        description:"Cadre Airbus, mission technique, 35 % des nuitées semaine. Sensible à l'efficacité et à la discrétion." },
      { code:"02", nom_fr:"Client espagnol", nom_en:"Spanish guest", nom_es:"Cliente español",
        bibliotheque:"Toulouse espagnole",
        ressort_emotionnel:"Proximité émotionnelle, discrétion culturelle",
        ton:"Chaleureux sans folklore. Valorise le cousinage culturel (Retirada, architecture commune). Jamais de clichés.",
        description:"Catalogne, Madrid, Aragon, Pays basque en city break. Sensible à la proximité culturelle franco-espagnole." },
      { code:"03", nom_fr:"Fan rugby", nom_en:"Rugby fan", nom_es:"Aficionado rugby",
        bibliotheque:"Toulouse rugby",
        ressort_emotionnel:"Fraternité ovale, sans imitation",
        ton:"Complice, connaisseur. Cite les bons chiffres (24 titres, triplé 2023-2024-2025). Ne simule pas la passion.",
        description:"Stade Toulousain, équipe adverse, anglo-saxon Champions Cup. 17-22 matchs par saison." },
      { code:"04", nom_fr:"Couple premium", nom_en:"Premium couple", nom_es:"Pareja premium",
        bibliotheque:"Toulouse gastronomie",
        ressort_emotionnel:"Considération discrète, jamais familiarité",
        ton:"Sobre, précis, élégant. Propose sans insister. Connaît les étoilés Michelin et la programmation du Capitole.",
        description:"Anniversaire, célébration, week-end gastronomique haut de gamme. 11 étoilés Michelin 2026." },
      { code:"05", nom_fr:"Parent étudiant", nom_en:"Student's parent", nom_es:"Padre de estudiante",
        bibliotheque:"Toulouse universitaire",
        ressort_emotionnel:"Réassurance silencieuse",
        ton:"Bienveillant, rassurant, pratique. Connaît les écoles et les 5 pics calendaires. Ne dramatise pas l'anxiété parentale.",
        description:"120 000+ étudiants à Toulouse, 1ère ville étudiante de France. 3 à 4 séjours par an." },
      { code:"06", nom_fr:"City break aéronautique", nom_en:"Aviation city break", nom_es:"Escapada aérea",
        bibliotheque:"Toulouse aéronautique loisir",
        ressort_emotionnel:"Émerveillement précis, expertise reconnue",
        ton:"Précis, passionné, pédagogue. Cite les bons repères (Aeroscopia, Cité de l'Espace, Concorde, A380).",
        description:"Aeroscopia, Cité de l'Espace, tour Airbus. 3 temps forts : Space Festival, Nuit des étoiles, Aeromart." },
      { code:"07", nom_fr:"International", nom_en:"International", nom_es:"Internacional",
        bibliotheque:"Toulouse secrète",
        ressort_emotionnel:"1 client = 3 à 5 prescriptions internationales",
        ton:"Bilingue, pédagogue, storyteller. Raconte la ville hors guides. Valorise l'Aéropostale, la brique rose, le Canal.",
        description:"Anglo-saxon, Asiatique, Moyen-Orient — tour européen ou escale prolongée. Fort potentiel de prescription." },
      { code:"08", nom_fr:"Slow tourism", nom_en:"Slow tourism", nom_es:"Slow tourism",
        bibliotheque:"Toulouse confidentielle",
        ressort_emotionnel:"Lenteur autorisée, retour saisonnier",
        ton:"Calme, sans agenda imposé. Propose des découvertes progressives sur 5 à 10 nuits. Valorise la régularité.",
        description:"Couple senior actif, 5 à 10 nuits, refuse le city break. Fort potentiel de retour saisonnier." },
    ];
    for (const p of personas) {
      await row(TABLES.personas, p);
      console.log(`  ✓  Persona ${p.code} — ${p.nom_fr}`);
    }
  } else {
    console.log("  ↩  Personas déjà remplis, ignoré.");
  }

  // ── 9 CATÉGORIES ──────────────────────────────────────────
  console.log("\n🌱 Remplissage Catégories...");
  if (await isEmpty(TABLES.categories)) {
    const categories = [
      { cle:"restaurant",        label_fr:"Restaurant",          label_en:"Restaurant",        label_es:"Restaurante",       icone:"🍽", type_donnee:"Lieu" },
      { cle:"musee",             label_fr:"Musée",               label_en:"Museum",            label_es:"Museo",             icone:"🏛", type_donnee:"Lieu" },
      { cle:"theatre",           label_fr:"Théâtre / Opéra",     label_en:"Theatre / Opera",   label_es:"Teatro / Ópera",    icone:"🎭", type_donnee:"Lieu" },
      { cle:"concert",           label_fr:"Concert / Musique",   label_en:"Concert / Music",   label_es:"Concierto / Música",icone:"🎵", type_donnee:"Événement" },
      { cle:"eglise",            label_fr:"Église / Patrimoine", label_en:"Church / Heritage", label_es:"Iglesia / Patrimonio",icone:"⛪",type_donnee:"Lieu" },
      { cle:"salle_sport",       label_fr:"Salle de sport",      label_en:"Sports facility",   label_es:"Instalación deportiva",icone:"🏋",type_donnee:"Lieu" },
      { cle:"evenement_sportif", label_fr:"Événement sportif",   label_en:"Sports event",      label_es:"Evento deportivo",  icone:"🏉", type_donnee:"Événement" },
      { cle:"footing",           label_fr:"Parcours footing",    label_en:"Running route",     label_es:"Ruta de footing",   icone:"🏃", type_donnee:"Parcours" },
      { cle:"visite",            label_fr:"Parcours de visite",  label_en:"Walking tour",      label_es:"Ruta de visita",    icone:"🗺", type_donnee:"Parcours" },
    ];
    for (const c of categories) {
      await row(TABLES.categories, c);
      console.log(`  ✓  ${c.cle}`);
    }
  } else {
    console.log("  ↩  Catégories déjà remplies, ignoré.");
  }
}

// ---------- main ----------

async function main() {
  console.log("🚀 Bootstrap TEFD — Baserow");
  console.log(`   Base : 476360 | Tables : ${Object.values(TABLES).join(", ")}\n`);

  try {
    await createFields();
    await seed();
    console.log("\n✅ Bootstrap terminé. Ta base Baserow est prête.");
    console.log("   Prochaine étape : ajouter la première adresse depuis l'outil admin,");
    console.log("   ou saisir directement dans Baserow en suivant le schéma TEFD.");
  } catch (e) {
    console.error("\n❌ Erreur :", e.message);
    process.exit(1);
  }
}

main();
