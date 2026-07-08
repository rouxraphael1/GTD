// resolve-osm.mjs — Résout un nom + adresse en osm_id + osm_type + lat/lng via Nominatim (OSM).
// Gratuit, sans clé, 100 % open source.
// Lancement interactif :
//   node scripts/resolve-osm.mjs "Py-r" "19 descente de la Halle aux Poissons, Toulouse"
//
// En mode batch (fichier CSV) :
//   node scripts/resolve-osm.mjs --batch scripts/adresses-a-resoudre.csv
//
// Nominatim Usage Policy : max 1 requête/seconde, User-Agent obligatoire.
// Pour un usage batch, le script respecte ce délai automatiquement.

import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "TEFD-Toulouse/1.0 (contact@tefd.local)"; // à personnaliser
const DELAY_MS   = 1100; // respecte la policy Nominatim (1 req/s)

const BASEROW_API  = "https://api.baserow.io/api";
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;
const TABLE_ADRESSES = 1045799;

// ---------- helpers ----------

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function searchNominatim(query) {
  const url = `${NOMINATIM}?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=5&countrycodes=fr`;
  const res  = await fetch(url, { headers:{ "User-Agent": USER_AGENT, "Accept-Language": "fr" } });
  if (!res.ok) throw new Error(`Nominatim → ${res.status}`);
  return res.json();
}

function formatResult(r, i) {
  return `  ${i+1}. [${r.osm_type}/${r.osm_id}] ${r.display_name.slice(0,90)}
     lat: ${r.lat}  lng: ${r.lon}  type: ${r.type}`;
}

async function askUser(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

async function writeToBaserow(rowId, osmId, osmType, lat, lng) {
  if (!BASEROW_TOKEN) { console.log("  ⚠  BASEROW_TOKEN absent — résultat non écrit dans Baserow."); return; }
  const endpoint = rowId
    ? `${BASEROW_API}/database/rows/table/${TABLE_ADRESSES}/${rowId}/?user_field_names=true`
    : `${BASEROW_API}/database/rows/table/${TABLE_ADRESSES}/?user_field_names=true`;
  const method = rowId ? "PATCH" : "POST";
  const res = await fetch(endpoint, {
    method,
    headers:{ Authorization:`Token ${BASEROW_TOKEN}`, "Content-Type":"application/json" },
    body: JSON.stringify({ osm_id: osmId, osm_type: osmType, latitude: parseFloat(lat), longitude: parseFloat(lng) }),
  });
  if (!res.ok) throw new Error(`Baserow → ${res.status} ${await res.text()}`);
  console.log(`  ✓  Écrit dans Baserow (ligne ${rowId || "nouvelle"})`);
}

// ---------- mode interactif (un lieu à la fois) ----------

async function resolveOne(nom, adresse, baserowRowId) {
  const query = adresse ? `${nom}, ${adresse}` : `${nom}, Toulouse, France`;
  console.log(`\n🔍 Recherche Nominatim : "${query}"`);

  const results = await searchNominatim(query);
  if (!results.length) { console.log("  ❌  Aucun résultat. Essaie une requête plus précise."); return; }

  console.log("\n  Résultats :");
  results.forEach((r,i) => console.log(formatResult(r,i)));

  const choice = await askUser(`\n  Choisir (1-${results.length}), ou 0 pour ignorer : `);
  const idx = parseInt(choice) - 1;
  if (isNaN(idx) || idx < 0 || idx >= results.length) { console.log("  ↩  Ignoré."); return; }

  const r = results[idx];
  console.log(`\n  ✓  Sélectionné : ${r.osm_type}/${r.osm_id}`);
  console.log(`     lat: ${r.lat}  lng: ${r.lon}`);
  console.log(`     URL OSM : https://www.openstreetmap.org/${r.osm_type}/${r.osm_id}`);

  const confirm = await askUser("  Écrire dans Baserow ? (o/n) : ");
  if (confirm.toLowerCase() === "o") {
    await writeToBaserow(baserowRowId || null, r.osm_id, r.osm_type, r.lat, r.lon);
  }
}

// ---------- mode batch CSV ----------
// Format CSV attendu : nom,adresse,baserow_row_id (row_id optionnel)
// Exemple :
//   Py-r,"19 descente de la Halle aux Poissons Toulouse",42
//   Théâtre du Capitole,"Place du Capitole Toulouse",

async function resolveBatch(csvPath) {
  const text  = await readFile(csvPath, "utf8");
  const lines = text.split("\n").filter(l => l.trim() && !l.startsWith("#"));

  console.log(`\n📋 Batch : ${lines.length} lieux à résoudre\n`);
  const out = ["nom,adresse,baserow_row_id,osm_type,osm_id,latitude,longitude,osm_url"];

  for (const line of lines) {
    const [nom, adresse, rowId] = line.split(",").map(s => s.replace(/^"|"$/g,"").trim());
    const query = adresse ? `${nom}, ${adresse}` : `${nom}, Toulouse, France`;
    console.log(`🔍 ${nom}`);

    await sleep(DELAY_MS); // respecte Nominatim policy
    const results = await searchNominatim(query).catch(e => { console.log(`  ❌  ${e.message}`); return []; });
    if (!results.length) { console.log("  ❌  Aucun résultat"); out.push(`"${nom}","${adresse}","${rowId||""}",,,,,`); continue; }

    // Prend le meilleur résultat automatiquement (index 0)
    const r = results[0];
    const osmUrl = `https://www.openstreetmap.org/${r.osm_type}/${r.osm_id}`;
    console.log(`  ✓  ${r.osm_type}/${r.osm_id} — ${r.display_name.slice(0,60)}`);
    out.push(`"${nom}","${adresse}","${rowId||""}","${r.osm_type}","${r.osm_id}","${r.lat}","${r.lon}","${osmUrl}"`);

    if (BASEROW_TOKEN && rowId) {
      await writeToBaserow(rowId, r.osm_id, r.osm_type, r.lat, r.lon).catch(e => console.log(`  ⚠  Baserow : ${e.message}`));
    }
  }

  const outPath = csvPath.replace(".csv", "-resolved.csv");
  await writeFile(outPath, out.join("\n"), "utf8");
  console.log(`\n✅ Résultats écrits dans : ${outPath}`);
}

// ---------- main ----------

const args = process.argv.slice(2);

if (args[0] === "--batch") {
  if (!args[1]) { console.error("Usage : node scripts/resolve-osm.mjs --batch chemin/vers/fichier.csv"); process.exit(1); }
  resolveBatch(args[1]).catch(e => { console.error(e); process.exit(1); });
} else if (args.length >= 1) {
  const [nom, adresse, rowId] = args;
  resolveOne(nom, adresse, rowId).catch(e => { console.error(e); process.exit(1); });
} else {
  console.log(`
🗺  resolve-osm.mjs — Résolution Nominatim (OSM) · TEFD

Usage :
  node scripts/resolve-osm.mjs "Nom du lieu" "adresse optionnelle" [baserow_row_id]
  node scripts/resolve-osm.mjs --batch scripts/adresses-a-resoudre.csv

Exemples :
  node scripts/resolve-osm.mjs "Py-r" "19 descente de la Halle aux Poissons Toulouse"
  node scripts/resolve-osm.mjs "Basilique Saint-Sernin" "" 
  node scripts/resolve-osm.mjs --batch scripts/adresses-a-resoudre.csv

Format CSV batch (une ligne par lieu) :
  nom,"adresse",baserow_row_id
  Py-r,"19 descente de la Halle aux Poissons Toulouse",42
  Théâtre du Capitole,"Place du Capitole Toulouse",
  `);
}
