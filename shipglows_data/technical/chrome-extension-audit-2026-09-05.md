---
artifact: documentation
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: communityglows
created: "2026-09-05"
updated: "2026-09-05"
status: active
scope: chrome-extension-audit
owner: Diane
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
---

# Audit et corrections de l'extension Chrome — 5 septembre 2026

Le plan de correction a été validé par Diane. La revue couvre le service worker, les API navigateur, les interfaces popup/options/setup/panneau, la persistance, les tâches, le routage, les dépendances et la chaîne de vérification. Elle ne constitue pas une certification de sécurité du backend.

| Réf. | Défaut constaté | Traitement |
|---|---|---|
| F01 | Illegal invocation pendant l'installation | Méthodes liées à leur objet API ; aucune suppression du stockage à l'installation ; erreur lisible. |
| F02 | Un deuxième document écrasait les liens enregistrés par le premier | Web Lock partagé, relecture avant chaque mutation et propagation entre documents. |
| F03 | Faux succès et tâches fantômes après échec de stockage | Persistance avant publication, formulaires conservés, erreurs accessibles ; données illisibles non écrasées. |
| F04 | Copie/coupe/Ctrl+A bloqués globalement | Protection globale retirée des quatre entrées d'extension. |
| F05 | L'URL capturée remplaçait l'URL éditée | La valeur validée du formulaire est enregistrée ; une URL peut aussi être effacée. |
| F06 | Pas de repli manuel ni de gestion des tâches | Saisie manuelle et route Mes tâches : création, édition, état/priorité et suppression. Liens modifiables et supprimables. |
| F07 | Parité auth/cloud/profils non définie | Décision produit distincte, non implémentée. La documentation décrit la portée locale réelle. |
| F08 | Débordement à 320 px | Largeurs et grilles adaptées ; largeur propre au popup. |
| F09 | FR/EN, langue HTML et retours incomplets | Libellés et champs accessibles, retours status/alert, langue réactive entre pages et messages existants. |
| F10 | 92 routes générées à partir des composants desktop | Sept pages publiques explicites ; 16 chunks JavaScript au lieu de 142. |
| F11 | Six alertes élevées de dépendances | fast-uri 3.1.6 : quatre corrigées. Deux alertes image-size sans version corrigée publiée restent dans web-ext, outil de validation absent du runtime Chrome. |
| F12 | Typecheck extension et CI manquants | Configuration vue-tsc dédiée, tests de persistance/API, test Chromium reproductible et job CI build Chrome/Firefox. Initialisation du service Kanban partagée corrigée. |
| F13 | Course initiale et suppression ignorée dans un ancien composable | Code historique non embarqué, conservé ; ne pas l'utiliser comme couche active sans traitement dédié. |
| F14 | Documentation et métadonnées du starter | Nom/repository, routes publiques, procédure de rechargement et carte de persistance corrigés. |
| F15 | Overrides pnpm contradictoires | Autorité package.json pour pnpm 8.11.0, workspace simplifié, lockfile actualisé et frozen vérifié. |
| F16 | ZIP/succès annoncés même après échec du build | Archivage et message de production exécutés dans writeBundle après succès de compilation. |

## Vérification

- 45 fichiers de tests, 257 tests réussis.
- Typecheck extension réussi ; ne pas confondre avec le typecheck global desktop, qui conserve des erreurs hors de ce périmètre.
- Builds Chrome et Firefox ; manifeste Firefox : zéro erreur, un avertissement innerHTML dans le runtime Vue généré. Aucun v-html utilisateur dans les surfaces concernées.
- Test Playwright sur Chromium 153 avec extension réellement chargée : installation, deux documents concurrents, refus de stockage, édition d'URL, CRUD tâches, repli manuel, Ctrl+A, langues et largeur 320 px.
- Les scénarios injectent des données synthétiques et simulent les refus de quota ; ils ne remplissent pas le stockage personnel.
- Le test se lance avec corepack pnpm test:extension ; les captures et le JSON de preuves sont écrits dans le répertoire annoncé (ou EXTENSION_EVIDENCE_DIR).

## Limites explicites

Le profil Chrome personnel n'est pas modifié : recharger l'extension existante depuis dist/chrome reste nécessaire. La preuve étroite utilise une page d'extension à 320 px, pas une inspection du panneau personnel. Firefox a été compilé et linté, sans preuve d'interaction réelle à jour. Chrome 116 et les lecteurs d'écran restent non testés. Permissions tabs/activeTab, polices tierces et auth/cloud/profils demandent une décision distincte. Les deux alertes de dépendances non corrigibles et le composable historique sont conservés comme éléments ouverts.
