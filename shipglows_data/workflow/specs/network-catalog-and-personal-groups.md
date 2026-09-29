---
artifact: specification
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: communityglows
created: "2026-09-05"
updated: "2026-09-05"
status: active
source_skill: sg-development
scope: network-catalog-and-personal-groups
owner: Diane
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
depends_on: []
supersedes: []
evidence:
  - "User approved categories in onboarding and existing in-app site selection controls, without adding checkboxes."
  - "User approved reuse of personal Bento tab groups with safe later additions."
  - "272 Vitest tests, core TypeScript check, ESLint and token freshness check passed on 2026-09-05."
next_step: "Verify the grouped catalogue and personal-group additions in the Windows native app."
---

# Catalogue de sites et groupes personnels

## Objectif et décisions approuvées

Faciliter le choix des sites parmi 58 entrées sans imposer le même rangement à tous. Les catégories du catalogue sont des modèles ; les groupes d'onglets du Bento appartiennent à l'utilisateur.

- Même interface et mêmes contrôles de sélection individuels ; extension du geste au groupe, sans nouvelle case à cocher.
- Catégories également présentes dans l'onboarding. Dex, Breakcold, ClarkUp et Clay sont traités comme les autres sites et classés dans CRM.
- Groupe vide ou partiel : sélectionner tous ses sites. Groupe complet : les désélectionner. Les choix extérieurs au groupe restent inchangés.
- Repli distinct de la sélection dans les modes d'édition ; en navigation normale, l'en-tête replie ou déplie les sites visibles.
- Sélectionner un groupe ne crée pas automatiquement tous ses panneaux.
- Nouvel onglet Bento : catégorie du site, nouveau groupe, groupe personnel existant ou sans groupe. Les onglets déjà présents ne sont jamais déplacés par ce mécanisme.
- Les noms personnels sont conservés. La destination choisie revient à la catégorie au changement de profil, au chargement de Scène ou à la création d'un brouillon.

## Périmètre livré dans le code

- `src/config/socialNetworkGroups.ts` : catégories et règles de sélection pures ; couverture unique du catalogue testée.
- `NetworkGroupHeader.vue` et les composants de sélection : sidebar, onboarding, profils, mobile, surfaces extension.
- `profiles.ts` : mutation groupée en une seule synchronisation ; `extensionState.ts` : mutation verrouillée et relecture avant écriture.
- `DesktopWorkspace.vue` et `bentoCatalogGroups.ts` : réutilisation des groupes Dockview et de leur persistance existante.
- Libellés FR/EN, README, contexte technique et changelog alignés.

## Invariants

- Les identifiants des sites et les préférences `hiddenNetworks` restent compatibles.
- Les catégories ne constituent pas une nouvelle autorité sur les dispositions personnalisées.
- L'identité de catégorie d'un groupe Bento réside dans `componentParams.communityGlowsCatalogGroupId`, jamais dans son nom.
- Les panels existants, épingles, dispositions, limites de 24 panneaux et frontières profil/Scène restent inchangés.
- Une destination personnelle disparue ne se recrée pas silencieusement : le nouvel onglet reste sans groupe.
- Les groupes des onglets fermés ne disposent pas d'une mémoire indépendante du layout courant.
- L'extension continue d'ouvrir des onglets navigateur. Les groupes Dockview restent propres au desktop ; la barre native Android reste mono-site.

## Preuves

- 272 tests Vitest passent, dont sélection partielle/totale, préservation inter-profils et concurrence des écritures extension.
- Roundtrip du stockage Bento vérifié avec catégorie CRM, nom personnel « Clients » et composition modifiée conservés.
- Typecheck cœur, ESLint ciblé, tokens à jour et contrôle du diff passent.
- Builds Chrome/Firefox passent. Extension chargée dans un profil Chromium isolé : Dex seul → CRM complet → rechargement → désélection, autres choix conservés, repli/dépli vérifiés.
- Composant réel d'onboarding rendu dans un harness navigateur isolé avec fixtures de stores : Dex seul → CRM partiel → quatre sites sélectionnés → quatre désélectionnés ; capture inspectée sans débordement à 1000 × 900.
- Le typecheck complet conserve des erreurs hors des composants et helpers de cette tranche ; aucune réussite globale n'est revendiquée.
- Preuve native Windows/Android et connexion aux sites CRM non effectuées. L'exécution navigateur ne prouve pas l'isolation ni le rendu des WebViews natives.

## Suite

Vérifier dans Windows : sélection d'une catégorie, ouverture de deux sites CRM, renommage et déplacement des onglets, ajout d'un troisième site dans la destination choisie, rechargement puis changement de profil. La sélection groupée côté mobile peut être vérifiée séparément sans promettre des groupes natifs Android.
