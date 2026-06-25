# TEFD — Toulouse Experience Front Desk

Application PWA de recommandations touristiques pour la réception hôtelière à Toulouse.

**Restaurants, musées, théâtre, concert, église, salle de sport, événements sportifs, parcours footing, parcours de visite** — avec paramètres de temps et de distance, par profil client.

## Fonctionnalités

- **8 profils clients** (personas) : Business aéro, Client espagnol, Fan rugby, Couple premium, Parent étudiant, City break aéro, International, Slow tourism
- **Moteur de recommandation à 4 signaux** : affinité persona, proximité, moment, priorité éditoriale
- **Multi-hôtel** : chaque établissement a ses propres temps de marche précalculés
- **Trilingue** : français, anglais, espagnol (i18next)
- **PWA installable** : Android, iPhone, iPad
- **Zéro coût d'exploitation** : GitHub Pages + Cloudflare Workers, free tiers
- **Modèle tout-lien** : les boutons « Y aller » / « Photos & avis » ouvrent Google Maps gratuitement (aucun appel API facturé)
- **Règle anti-hallucination** : les événements passés disparaissent automatiquement

## Architecture

```
.github/workflows/build-data.yml   ← GitHub Actions (cron quotidien + webhook)
scripts/
  export.mjs                        ← Baserow → app_data.json
  precompute-walk.mjs               ← ORS Matrix → temps de marche par hôtel
public/                             ← servi par GitHub Pages
  index.html                        ← page de production (PWA)
  app_data.json                     ← généré automatiquement, ne pas éditer
  manifest.json
  sw.js
  icons/
maquette_tefd.html                  ← démo cliquable (données en dur, pour le Club)
docs/                               ← spécifications et procédures
```

## Déploiement

Voir `docs/procédure_deploiement_tefd.md` pour la procédure complète.

### Résumé rapide

1. **Baserow** : créer les 7 tables (schéma dans `docs/schema_baserow_tefd.md`)
2. **GitHub Secrets** : `BASEROW_TOKEN`, `T_ADRESSES`, `T_EVENEMENTS`, `T_PARCOURS`, `T_PERSONAS`, `T_CATEGORIES`, `T_HOTELS`, `ORS_API_KEY`
3. **GitHub Pages** : Settings → Pages → Source = branche `main`, dossier `/public`
4. **Cloudflare Worker** : pour la résolution `place_id` Google à la saisie

## Fichiers

| Fichier | Rôle |
|---|---|
| `maquette_tefd.html` | Démo cliquable pour le Club Hôtelier |
| `public/index.html` | Page de production (PWA, charge `app_data.json`) |
| `scripts/export.mjs` | Export Baserow → JSON |
| `scripts/precompute-walk.mjs` | Calcul ORS des temps de marche |
| `docs/schema_baserow_tefd.md` | Schéma complet du back-office Baserow |
| `docs/spec_moteur_reco_tefd.md` | Spécification du moteur de recommandation |
| `docs/deroule_demo_tefd.md` | Script de démo minute par minute |
| `docs/procedure_deploiement_tefd.md` | Procédure de déploiement complète |
