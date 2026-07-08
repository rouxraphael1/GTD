// inject-osm.mjs — Injecte osm_id + osm_type directement dans une ligne Baserow.
// Utile quand Nominatim ne trouve pas le lieu mais qu'on a l'ID OSM depuis openstreetmap.org
//
// Usage :
//   node scripts/inject-osm.mjs <baserow_row_id> <osm_type> <osm_id>
//
// Exemples :
//   node scripts/inject-osm.mjs 24 way 22718219
//   node scripts/inject-osm.mjs 22 way 987654321
//   node scripts/inject-osm.mjs 25 node 123456789

const API   = "https://api.baserow.io/api";
const TOKEN = process.env.BASEROW_TOKEN;
const TABLE = 1045799;

if (!TOKEN) { console.error("❌  BASEROW_TOKEN manquant."); process.exit(1); }

const [rowId, osmType, osmId] = process.argv.slice(2);
if (!rowId || !osmType || !osmId) {
  console.log("Usage : node scripts/inject-osm.mjs <row_id> <osm_type> <osm_id>");
  console.log("Exemple : node scripts/inject-osm.mjs 24 way 22718219");
  process.exit(0);
}

const res = await fetch(`${API}/database/rows/table/${TABLE}/${rowId}/?user_field_names=true`, {
  method: "PATCH",
  headers: { Authorization: `Token ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ osm_id: osmId, osm_type: osmType }),
});

if (!res.ok) { console.error("❌ Erreur :", res.status, await res.text()); process.exit(1); }
const data = await res.json();
console.log(`✓  Ligne ${rowId} (${data.nom}) → ${osmType}/${osmId}`);
console.log(`   https://www.openstreetmap.org/${osmType}/${osmId}`);
