# Plan: Création des options de sélection dans Baserow

## Problème
Le token de base de données Baserow (`bKXWgHUDlBLfvAS1n6Kx4awInQLbLRCd`) ne peut effectuer que des opérations CRUD sur les lignes (données). Pour modifier les champs (opérations de schéma) comme la création d'options de sélection, nous avons besoin d'un token JWT qui nécessite une authentification email/mot de passe.

## Solutions possibles

### Option 1: Authentification JWT (recommandée)
1. **Obtenir un token JWT** en fournissant l'email et le mot de passe Baserow
2. **Utiliser le token JWT** pour modifier les champs et créer les options de sélection
3. **Avantages**: Automatisation complète, reproductibilité
4. **Inconvénients**: Nécessite les identifiants de connexion

### Option 2: Création manuelle dans l'interface Baserow
1. **Se connecter à Baserow** via l'interface web
2. **Modifier chaque champ** de sélection manuellement
3. **Ajouter les options** une par une
4. **Avantages**: Pas besoin d'identifiants supplémentaires
5. **Inconvénients**: Processus manuel, chronophage, risque d'erreur

## Recommandation
**Option 1: Authentification JWT** - Plus fiable et automatisable.

## Prochaines étapes si Option 1 est choisie

### Étape 1: Fournir les identifiants Baserow
- Email utilisé pour se connecter à Baserow
- Mot de passe Baserow

### Étape 2: Script d'automatisation
Je créerai un script qui:
1. Obtient un token JWT via `/api/user/token-auth/`
2. Récupère les informations des champs existants
3. Ajoute les options de sélection pour chaque champ
4. Met à jour les lignes existantes avec les nouvelles options

### Étape 3: Options à créer

#### Pour la table Adresses:
- **quartier** (sélection simple): Capitole, Saint-Cyprien, Carmes, Compans-Caffarelli, Amidonniers, Saint-Aubin, Jean Jaurès, Saint-Michel, Minimes, Rangueil, Montaudran, Blagnac, Sept Deniers
- **moment** (sélection multiple): matin, midi, soir, journée
- **fourchette_prix** (sélection simple): €, €€, €€€, €€€€
- **tags** (sélection multiple): gastronomique, étoilé, bistronomique, terrasse, romantique, art, contemporain, histoire, gratuit, famille, rugby, stade, footing, historique, religieux, patrimoine, culturel, moderne, branché, chic, élégant, décontracté, accueillant, chaleureux, calme, animé
- **source** (sélection simple): Livret, Bibliothèque, DATAtourisme, OpenAgenda, Curation terrain, OSM
- **statut** (sélection simple): Publié, Brouillon, À revérifier, Archivé

#### Pour la table Événements:
- **source** (sélection simple): OpenAgenda, OpenData Toulouse, DATAtourisme, Curation
- **statut** (sélection simple): Publié, Brouillon, Archivé

## Alternative: Création manuelle dans Baserow

Si vous préférez l'option manuelle, voici les étapes:

1. **Connectez-vous à Baserow**: https://baserow.io
2. **Ouvrez la base "Back-office TEFD"**
3. **Pour chaque champ de sélection**:
   - Cliquez sur l'en-tête du champ
   - Sélectionnez "Modifier le champ"
   - Ajoutez les options une par une
   - Cliquez sur "Enregistrer"

4. **Champs à modifier**:

**Table Adresses:**
- quartier: Ajouter les 13 options de quartiers
- moment: Ajouter les 4 options de moments
- fourchette_prix: Ajouter les 4 options de prix
- tags: Ajouter les 25 options de tags
- source: Ajouter les 6 options de source
- statut: Ajouter les 4 options de statut

**Table Événements:**
- source: Ajouter les 4 options de source
- statut: Ajouter les 3 options de statut

## Questions pour vous
1. Quelle option préférez-vous? (JWT ou manuelle)
2. Si JWT: quel est votre email et mot de passe Baserow?
3. Avez-vous déjà créé certaines options de sélection dans Baserow?
