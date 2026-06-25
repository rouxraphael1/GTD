// moteur-reco.test.mjs — Vérifie le moteur sur un fixture app_data minimal.
//   node moteur-reco.test.mjs
import {
  recommanderDepuisData, momentCourant, affinitePersona, scoreProximite,
} from "./moteur-reco.js";

// ---------- Fixture (forme app_data.json) : 2 hôtels, 4 adresses ----------
const data = {
  hotels: [
    { nom: "Hôtel des Beaux-Arts", lat: 43.6007, lng: 1.4415 },
    { nom: "Hôtel Compans",        lat: 43.6125, lng: 1.4360 },
  ],
  personas: [
    { code: "04", nom: { fr: "Couple premium" }, categories_prioritaires: ["restaurant", "theatre"] },
    { code: "08", nom: { fr: "Slow tourism" },   categories_prioritaires: ["marche", "patrimoine"] },
  ],
  adresses: [
    { nom: "Py-r", categorie: "restaurant", personas: ["04", "07"], priorite_edito: 5,
      moment: ["soir"], marche_min: { "Hôtel des Beaux-Arts": 8,  "Hôtel Compans": 22 } },
    { nom: "Les Jardins de l'Opéra", categorie: "restaurant", personas: ["04"], priorite_edito: 4,
      moment: ["soir"], marche_min: { "Hôtel des Beaux-Arts": 6,  "Hôtel Compans": 18 } },
    { nom: "Marché Victor Hugo", categorie: "marche", personas: ["08", "02"], priorite_edito: 3,
      moment: ["matin"], marche_min: { "Hôtel des Beaux-Arts": 9,  "Hôtel Compans": 11 } },
    { nom: "Basilique Saint-Sernin", categorie: "patrimoine", personas: ["07", "08"], priorite_edito: 2,
      moment: ["journee"], marche_min: { "Hôtel des Beaux-Arts": 12, "Hôtel Compans": 3 } },
  ],
};

let ok = 0, ko = 0;
const check = (label, cond) => { (cond ? ok++ : ko++); console.log(`${cond ? "✓" : "✗"} ${label}`); };

const soir = new Date(); soir.setHours(20, 0, 0, 0);
const matin = new Date(); matin.setHours(9, 0, 0, 0);

// 1. Couple premium, le soir, depuis Beaux-Arts → un resto en tête (persona + moment + prio)
const r1 = recommanderDepuisData(data, { hotelNom: "Hôtel des Beaux-Arts", personaCode: "04", maintenant: soir });
check("Couple premium soir : un restaurant en tête", r1[0].categorie === "restaurant");
check("Rien n'est masqué (filtres OFF) : 4 adresses", r1.length === 4);

// 2. Même requête depuis Compans → l'ordre des restos change (marche_min par hôtel)
const r2 = recommanderDepuisData(data, { hotelNom: "Hôtel Compans", personaCode: "04", maintenant: soir });
check("marche_min par hôtel : Saint-Sernin remonte depuis Compans (3 min)",
  r2.findIndex(a => a.nom === "Basilique Saint-Sernin") < r1.findIndex(a => a.nom === "Basilique Saint-Sernin"));

// 3. Persona Slow tourism, le matin → le Marché doit dominer
const r3 = recommanderDepuisData(data, { hotelNom: "Hôtel des Beaux-Arts", personaCode: "08", maintenant: matin });
check("Slow tourism matin : Marché Victor Hugo en tête", r3[0].nom === "Marché Victor Hugo");

// 4. Filtre optionnel "ce persona seulement" → ne garde que les adresses taguées 04
const r4 = recommanderDepuisData(data, {
  hotelNom: "Hôtel des Beaux-Arts", personaCode: "04", maintenant: soir,
  reglages: { personaSeulement: true },
});
check("Filtre personaSeulement : ne reste que les adresses taguées 04", r4.every(a => a.personas.includes("04")));
check("Filtre personaSeulement : 2 adresses (Py-r, Jardins)", r4.length === 2);

// 5. Filtre optionnel "à pied ≤ X" → écarte ce qui dépasse le rayon
const r5 = recommanderDepuisData(data, {
  hotelNom: "Hôtel des Beaux-Arts", personaCode: "04", maintenant: soir,
  rayonMarcheMin: 8, reglages: { rayonActif: true },
});
check("Filtre rayon 8 min : Saint-Sernin (12) écarté", !r5.some(a => a.nom === "Basilique Saint-Sernin"));

// 6. Signaux unitaires
check("momentCourant(20h) = soir", momentCourant(soir) === "soir");
check("affinité persona par code = 1", affinitePersona(data.adresses[0], data.personas[0]) === 1.0);
check("affinité via catégorie prioritaire = 0.5",
  affinitePersona({ categorie: "theatre", personas: ["99"] }, data.personas[0]) === 0.5);
check("proximité null si pas de marche", scoreProximite({ marche_min: {} }, data.hotels[0]) === 0);

console.log(`\n${ok} OK · ${ko} KO`);

// Aperçu lisible du classement n°1
console.log("\nClassement — Couple premium, soir, depuis Beaux-Arts :");
r1.forEach((a, i) => console.log(`  ${i + 1}. ${a.nom.padEnd(26)} score ${a._score.toFixed(3)}  [${a.categorie}]`));

process.exit(ko ? 1 : 0);
