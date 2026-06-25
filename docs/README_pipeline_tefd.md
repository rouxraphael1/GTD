# Pipeline de données TEFD + maquette

Trois fichiers, deux usages : la **maquette de démo** et le **pipeline Baserow → appli**.

## 1. Maquette de démo — `maquette_tefd.html`

À ouvrir directement dans un navigateur (rien à installer). Carte OpenStreetMap, sélecteur des 8 personas, fiches avec note éditoriale, et boutons **« Y aller »** / **« Photos & avis sur Google »** qui ouvrent réellement Google Maps via des liens gratuits (Maps URLs, sans clé).

C'est le support à projeter devant le Club Hôtelier. Les données sont factices mais réelles (lieux du Livret) ; en production, ce bloc est remplacé par `app_data.json`.

## 2. Script d'export — `export.mjs`

Génère `public/app_data.json` depuis Baserow. Node 18+, sans dépendance.

À placer dans le dépôt sous `scripts/export.mjs`.

```bash
BASEROW_TOKEN=xxx \
T_ADRESSES=123 T_EVENEMENTS=124 T_PARCOURS=125 \
T_PERSONAS=126 T_CATEGORIES=127 T_HOTELS=128 \
node scripts/export.mjs
```

Variables :

| Variable | Rôle |
|---|---|
| `BASEROW_TOKEN` | Jeton API Baserow (Paramètres → jetons de base de données) |
| `BASEROW_API_URL` | Optionnel. Vide = `api.baserow.io`. À renseigner si Baserow auto-hébergé |
| `T_*` | ID numérique de chaque table (visible dans l'URL Baserow) |
| `OUT_PATH` | Optionnel. Défaut `public/app_data.json` |

**Filtre anti-hallucination** : les événements ne sont exportés que s'ils sont publiés **et** (récurrents **ou** `date_fin >= aujourd'hui`). La date de référence est calculée à Paris à chaque exécution.

## 3. Automatisation — `build-data.yml`

À placer sous `.github/workflows/build-data.yml`. Régénère le JSON :

- **chaque jour à 04h30 Paris** (garde le filtre de dates frais — un événement terminé aujourd'hui disparaît demain) ;
- **à la demande** (bouton Run workflow) ;
- **sur webhook Baserow** (événement `repository_dispatch` de type `baserow-update`).

Renseigner les secrets du dépôt (Settings → Secrets → Actions) : `BASEROW_TOKEN`, `T_ADRESSES`, etc.

### Brancher le webhook Baserow → rebuild

Baserow ne peut pas porter le token GitHub en clair. Le chemin propre :

```
Baserow (webhook sur modif) → Worker Cloudflare → POST api.github.com/.../dispatches
                                  (ajoute le token GitHub)   { "event_type": "baserow-update" }
```

Le Worker — celui qui héberge déjà la résolution `place_id` et le token Baserow — relaie le webhook en ajoutant l'en-tête d'autorisation GitHub. À défaut, le rebuild quotidien suffit largement au démarrage.

---

**Rappel coût :** aucun de ces éléments n'appelle l'API Google facturable. Les liens Maps sont gratuits ; la résolution `place_id` (Text Search) reste dans le quota gratuit et ne tourne qu'à la saisie.
