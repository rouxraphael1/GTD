# Déroulé de démo — TEFD devant le Club Hôtelier

**Durée cible : 10 minutes.** Support : `maquette\\\_tefd.html` projetée plein écran (Chrome ou Edge, mode présentation). Rien à installer. Aucun appel facturé pendant la démo : le modèle est **tout-lien** (les boutons ouvrent Google Maps gratuitement, sans clé).

**Fil rouge à tenir :** *« On ne remplace pas le réceptionniste, on lui donne la mémoire d'un concierge — sourcée, datée, multilingue, sans risque de se tromper. »*

\---

## Avant de commencer (30 s, écran encore noir)

* Maquette ouverte sur **persona non sélectionné**, langue **FR**, interrupteur « Masquer le hors-persona » **activé** (état par défaut).
* Une phrase d'accroche : *« Aujourd'hui, quand un client demande "où dîner ?", la réponse dépend de qui est au comptoir. Je vais vous montrer comment elle dépend désormais de votre référentiel. »*

\---

## Le déroulé minute par minute

|Temps|Ce que tu dis|Ce que tu cliques|Ce que ça prouve|
|-|-|-|-|
|**0:00–1:00**|« Voici l'outil tel qu'un réceptionniste l'ouvre le matin. Carte de Toulouse, fond OpenStreetMap, sa position. »|Tu laisses la carte se charger, tu montres la géoloc / le point hôtel.|Familier, instantané, pas de logiciel lourd.|
|**1:00–2:00**|« Un couple arrive, dîner premium ce soir. Je choisis le profil. »|Sélectionne **04 Couple premium**. Tout l'écran se réaccorde.|Les 8 personas sont le cœur de la propriété TEFD — l'outil pense par profil.|
|**2:00–3:30** ⭐|« Et voici ce qui nous distingue d'un guide en ligne. » Tu ouvres une fiche étoilée. « Ce n'est pas une note de foule : c'est **votre** note éditoriale, et elle est **datée**. »|Ouvre une fiche (ex. un étoilé). Pointe la **note éditoriale en héros** et le **badge « ★★ vérifié mars 2026 »**.|**Le moment clé.** La crédibilité éditoriale + la fraîcheur sourcée = l'anti-improvisation.|
|**3:30–4:30**|« Le client ne navigue pas dans notre appli, il repart avec l'itinéraire sur son téléphone. »|Clique **« Y aller »** → Google Maps s'ouvre réellement. Mentionne le **QR / lien SMS**.|Navigation temps réel native, **zéro coût**, geste premium au comptoir.|
|**4:30–5:30** 🆕|*« Une question qu'on me pose toujours : est-ce que l'outil me cache des choses ? Regardez. »*|**Bascule l'interrupteur « Masquer le hors-persona » sur OFF.**|Voir le bloc dédié ci-dessous.|
|**5:30–6:30**|« Et je règle la distance comme au comptoir. »|Fais glisser le **curseur "à pied"** (ex. 10 min). Les temps de marche sont **précalculés** par hôtel.|Paramètre temps/distance concret, tri instantané (zéro appel runtime).|
|**6:30–7:30**|« Le client est espagnol ? L'outil l'est aussi. »|Sélectionne **02 Client espagnol**, bascule la langue sur **ES** en haut à droite.|Multilingue **prouvé en direct** — pas une promesse de brochure.|
|**7:30–8:30**|« Et il ne ment jamais sur les dates. Un match passé, une expo terminée : ils ont déjà disparu. »|Montre la section événements (filtrée sur aujourd'hui).|Garantie **anti-hallucination** : *ce qui ne se vérifie pas ne s'affiche pas.*|
|**8:30–10:00**|« Tout ça tourne sur GitHub + un petit relais Cloudflare. Coût d'exploitation : zéro. Vous saisissez une fois dans le back-office, ça alimente l'appli **et** votre livret PDF. »|Reviens à la carte, écran de synthèse.|Le **modèle économique** : une saisie, deux livrables, aucune facture.|

\---

## 🆕 Le moment de bascule de l'interrupteur (4:30–5:30)

C'est le moment qui désamorce la peur du « l'algorithme décide à ma place ». Répliques calées sur le comportement réel de la maquette :

1. **Réplique d'ouverture** (interrupteur encore sur ON) :

> \\\*« Là, je vous montre la vue resserrée : seules les adresses qui collent au profil. Pratique pour aller vite. Mais une crainte légitime, c'est : "est-ce que la machine m'enterre des bonnes adresses ?" »\\\*

2. **Le geste** — tu bascules **« Masquer le hors-persona » sur OFF** :

> \\\*« Regardez : je ne cache rien. »\\\*

Ce qui se passe à l'écran : les adresses hors-profil **réapparaissent, grisées, étiquetées "hors profil"** ; les pertinentes **restent en tête**. L'indice à droite du switch passe de **« filtre actif »** à **« tout visible · profil en tête »**.

3. **La phrase qui ancre la philosophie** :

> \\\*« L'outil ne décide pas à votre place. Il ordonne, il met le bon profil devant — mais tout reste visible, et c'est vous qui tranchez. Le réceptionniste garde la main, toujours. »\\\*

4. **Retour à l'état de démo** — rebascule sur **ON** :

> \\\*« Au quotidien, on garde la vue resserrée : une liste courte et juste, c'est ce qui fait gagner du temps au comptoir. »\\\*

   **Pourquoi ce moment vaut de l'or devant des hôteliers :** il transforme la principale objection psychologique (« je vais perdre mon expertise / mon rôle ») en argument de confiance, en un seul clic, sous leurs yeux.

   \---

   ## Parade aux objections (à garder en poche)

|Objection|Réponse courte|
|-|-|
|**« Combien ça coûte à faire tourner ? »**|« Zéro. GitHub Pages + Cloudflare Workers, free tiers. Les boutons Google sont des liens gratuits, pas des appels d'API. Le seul appel Google — la résolution d'adresse — n'a lieu qu'à la saisie d'une nouvelle fiche, dans une limite gratuite de 5 000/mois. »|
|**« Qui maintient les données ? »**|« Votre référent, dans Baserow — qui **est** l'interface admin, rien à développer. Une ligne ajoutée = appli + livret PDF à jour. C'est exactement la discipline de votre livret, automatisée. »|
|**« Et le RGPD ? »**|« L'appli ne collecte aucune donnée client. La géoloc est celle du navigateur, en local, jamais stockée. Les liens ouvrent Google côté client : rien ne transite par nous. »|
|**« Si le wifi tombe au comptoir ? »**|« Choix assumé : l'appli va toujours chercher la donnée fraîche en ligne — c'est ce qui garantit qu'un événement terminé n'apparaît jamais. Pas de cache de données périmées. »|
|**« Combien d'hôtels ça gère ? »**|« Autant que vous voulez. Chaque hôtel a ses propres temps de marche précalculés depuis sa position — un seul référentiel sert tout le Club. »|

\---

## Aide-mémoire (les 4 moments qui font mouche)

1. **Couple premium → la note éditoriale datée** (2:00) : votre différence vs un guide.
2. **La bascule de l'interrupteur** (4:30) : « je ne cache rien, c'est vous qui décidez ».
3. **Le passage à l'espagnol** (6:30) : le multilingue prouvé, pas promis.
4. **Le coût zéro** (8:30) : l'argument qui clôt.

> Ordre conseillé si tu dois couper court : garde \\\*\\\*1\\\*\\\* et \\\*\\\*2\\\*\\\*. Ce sont les deux moments qui retournent une salle d'hôteliers.

