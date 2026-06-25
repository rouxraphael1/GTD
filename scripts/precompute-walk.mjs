// precompute-walk.mjs — Calcule les temps de marche hôtel → adresses (ORS Matrix)
// et les injecte dans app_data.json sous adresse.marche_min[<hôtel>].
// À lancer APRÈS export.mjs. Node 18+ (fetch natif).
//
//   ORS_API_KEY=xxx node scripts/precompute-walk.mjs
//
// Les positions étant fixes, ce calcul ne tourne qu'au build : zéro appel ORS
// au runtime, tri instantané côté appli.

import { readFile, writeFile } from "node:fs/promises";

const KEY  = process.env.ORS_API_KEY;
const FILE = process.env.OUT_PATH || "app_data.json";
const ORS  = "https://api.openrouteservice.org/v2/matrix/foot-walking";

// Limite Matrix ORS : sources × destinations ≤ 3500 par requête.
// On découpe les destinations pour rester sous ce plafond quel que soit le nb d'hôtels.
const SAFE_PAIRS = 3000;

if (!KEY) { console.error("ORS_API_KEY manquant."); process.exit(1); }

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function matrix(locations, sources, destinations) {
  const res = await fetch(ORS, {
    method: "POST",
    headers: { Authorization: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ locations, sources, destinations, metrics: ["duration"] }),
  });
  if (!res.ok) throw new Error(`ORS Matrix → ${res.status} ${await res.text()}`);
  return (await res.json()).durations; // secondes, [source][destination]
}

async function main() {
  const data = JSON.parse(await readFile(FILE, "utf8"));
  const hotels = (data.hotels || []).filter(h => h.lat != null && h.lng != null);
  const adresses = (data.adresses || []);
  const adrGeo = adresses.filter(a => a.lat != null && a.lng != null);

  if (!hotels.length || !adrGeo.length) {
    console.log("Rien à calculer (hôtels ou adresses manquants).");
    return;
  }

  // ORS attend [lng, lat]
  const hotelLoc = hotels.map(h => [h.lng, h.lat]);
  const adrLoc   = adrGeo.map(a => [a.lng, a.lat]);

  // Découpage des destinations pour respecter le plafond Matrix
  const batchSize = Math.max(1, Math.floor(SAFE_PAIRS / hotels.length));
  const batches = chunk(adrGeo.map((_, i) => i), batchSize);

  // marche[hotelIndex][adrIndex] = minutes | null
  const marche = hotels.map(() => new Array(adrGeo.length).fill(null));

  for (const batch of batches) {
    const locations = [...hotelLoc, ...batch.map(i => adrLoc[i])];
    const sources = hotels.map((_, i) => i);
    const destinations = batch.map((_, j) => hotels.length + j);
    const durations = await matrix(locations, sources, destinations);

    durations.forEach((row, hi) => {
      row.forEach((sec, dj) => {
        const adrIdx = batch[dj];
        marche[hi][adrIdx] = sec == null ? null : Math.round(sec / 60);
      });
    });
  }

  // Injection dans chaque adresse : marche_min = { "<nom hôtel>": minutes }
  adrGeo.forEach((a, ai) => {
    a.marche_min = {};
    hotels.forEach((h, hi) => { a.marche_min[h.nom] = marche[hi][ai]; });
  });

  data.marche_calcule_le = new Date().toISOString();
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf8");

  const total = hotels.length * adrGeo.length;
  console.log(`✓ Temps de marche calculés : ${hotels.length} hôtel(s) × ${adrGeo.length} adresses = ${total} trajets, en ${batches.length} requête(s) Matrix.`);
}

main().catch(e => { console.error(e); process.exit(1); });
