---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "communityglows"
created: "2026-08-20"
created_at: "2026-08-20 00:00:00 UTC"
updated: "2026-08-20"
updated_at: "2026-08-20 17:15:00 UTC"
status: ready
source_skill: sg-development
source_model: "GPT-5"
scope: desktop-bento-workspace
owner: "Diane"
confidence: high
user_story: "En tant qu'utilisateur desktop CommunityGlows, je veux organiser plusieurs réseaux en panneaux redimensionnables afin de garder plusieurs flux visibles dans un workspace adapté à mon activité."
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "src/ui/setup/pages/CommunityGlows/App.vue"
  - "src/ui/setup/pages/CommunityGlows/components/NetworkWebviewHost.vue"
  - "src/ui/setup/pages/CommunityGlows/composables/useNetworkWebview.ts"
  - "src-tauri/src/lib.rs"
  - "shipglows_data/technical/context.md"
depends_on:
  - artifact: "shipglows_data/workflow/specs/cross-platform-design-token-authority.md"
    artifact_version: "1.0.0"
    required_status: ready
supersedes: []
evidence:
  - "L'utilisateur a demandé explicitement des splits horizontaux et verticaux, du drag, du resize et des layouts enregistrables."
  - "Le desktop Tauri possède déjà un pool de WebViews isolées par profil et réseau."
  - "Dockview 8 fournit les panneaux Vue 3, le drag-and-drop, les splits, le resize et la sérialisation."
next_step: "Route Rust compilation and the Windows/Tauri visual checklist through CI or a dedicated Windows host without generating build artifacts in the code-only workspace."
---

# CommunityGlows Desktop Bento Workspace

## Outcome

Le desktop affiche plusieurs réseaux simultanément dans un workspace dockable. Un réseau sélectionné depuis la navigation ouvre ou active son panneau. Les panneaux peuvent être déplacés, groupés en onglets, divisés horizontalement ou verticalement et redimensionnés. Chaque profil possède ses propres Scènes autosauvegardées et synchronisées, ainsi que son propre brouillon autosauvegardé localement.

## Scope

- Desktop Vue/Tauri uniquement ; le rendu mobile et extension reste inchangé.
- Une WebView native isolée par couple profil/réseau et par panneau réseau.
- Dockview comme moteur de disposition, enveloppé par des composants CommunityGlows.
- Persistance locale versionnée avec validation défensive et restauration sûre.
- Layout courant autosauvegardé localement; après sa création et son nommage explicites, la Scène active est autosauvegardée après 800 ms d'inactivité puis synchronisée en arrière-plan.
- Modèles Colonnes, Lignes, Focus et Grille applicables aux panneaux déjà ouverts sans recréer leurs WebViews.
- Scènes synchronisées et cloisonnées par profil via le canal d'état workspace existant, avec file hors ligne et limite globale de 500 000 caractères ; cookies et brouillons courants exclus.

## Invariants

- L'isolation de session existante `${profileId}-${networkId}` reste la frontière native.
- Les URLs de panneaux proviennent du catalogue de réseaux ou d'un lien personnalisé déjà validé.
- Toute restauration exécutable est revalidée contre le catalogue du profil actif; les commandes natives revalident aussi l'identité, l'URL et les bounds avant d'accéder à une WebView ou à son répertoire de session.
- Une donnée locale corrompue ne bloque jamais le démarrage : elle est ignorée au profit d'un layout sain.
- Les overlays CommunityGlows masquent toutes les WebViews visibles avant de se placer au-dessus.
- Les changements de taille sont dédupliqués et coalescés par frame, sans plus d'une commande native en vol par panneau.
- Une session de drag se termine aussi sur annulation, `Escape`, perte de focus, document masqué ou watchdog.
- Les données de layout restent bornées en taille, profondeur, nombre de nœuds et nombre de panneaux avant toute restauration ou persistance.
- Android conserve son expérience mono-réseau actuelle.
- Les valeurs visuelles sont consommées depuis les tokens du design system.

## Acceptance Criteria

- Sélectionner deux réseaux ouvre deux panneaux distincts sans détruire le premier.
- Le drag d'un onglet vers un bord crée un split et les séparateurs redimensionnent les zones.
- Fermer un panneau masque sa WebView et la conserve dans le pool existant.
- Le layout courant survit au rechargement local.
- Une Scène peut être créée, chargée, renommée, supprimée puis retrouvée sur un autre appareil connecté.
- Déplacer, redimensionner, ajouter, fermer ou renommer dans une Scène active déclenche son autosave; la dernière modification est forcée avant de charger une autre Scène, de créer un nouveau brouillon, de changer de profil ou de fermer le workspace.
- Changer de profil sauvegarde le brouillon sortant et restaure uniquement le brouillon et les Scènes du profil entrant.
- Les anciennes Scènes globales et l'ancien autosave sont migrés une fois vers le profil actif final ; supprimer un profil purge ses Scènes et son brouillon.
- Un layout invalide ou contenant un réseau inconnu est rejeté sans crash.
- Un lien personnalisé supprimé ou appartenant à un autre profil ne peut pas être restauré; un domaine trompeur, des credentials intégrés ou un identifiant de chemin invalide sont rejetés.
- Masquer ou réafficher une WebView pooled utilise la visibilité native et expose un diagnostic du pool sans modifier l'isolation de session existante.
- Un autosave incohérent, excessif ou impossible à écrire est refusé sans exception; une action explicite d'enregistrement ou de suppression reçoit un avertissement honnête si elle ne peut pas être conservée.
- Les raccourcis de docking au clavier restent activés et annoncés par le moteur maintenu.
- Les contrôles locaux restent code-only et sans sortie persistante; la compilation, le bundle et la preuve Windows sont déportés vers la CI ou un hôte dédié.
- Les commandes rapides, raccourcis personnalisés et duplications de panneau constituent la tranche suivante et ne font pas partie de cette livraison.

## Proof Plan

- Tests unitaires du parseur, du stockage versionné et des opérations de layouts nommés.
- Test du calcul des bounds et des transitions WebView existantes.
- Tests ciblés Vitest, typecheck cœur, lint ciblé et contrôle statique du diff sans build local.
- Compilation Rust, bundle Tauri et checklist visuelle sur la CI ou un hôte Windows dédié.

## Skill Run History

| Date UTC   | Skill          | Model | Action                                                                                                                                                                                                                                                                                                                    | Result      | Next step                                                             |
| ---------- | -------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------- |
| 2026-08-20 | sg-development | GPT-5 | User-approved product contract, architecture and proof route recorded.                                                                                                                                                                                                                                                    | ready       | Implement the desktop bento workspace.                                |
| 2026-08-20 | sg-development | GPT-5 | Implemented Dockview workspace, concurrent native WebView hosts, defensive local persistence, named layouts and documentation.                                                                                                                                                                                            | implemented | Run automated verification.                                           |
| 2026-08-20 | sg-development | GPT-5 | Ran 170 tests, core typecheck, Tauri frontend build, targeted lint, dependency audit and design drift scan. Browser and Cargo probes were unavailable in this host.                                                                                                                                                       | partial     | Complete Windows visual proof before closing.                         |
| 2026-08-20 | sg-development | GPT-5 | Started the approved hardening pass for resize pressure, native visibility, drag recovery and restored-layout trust boundaries.                                                                                                                                                                                           | in progress | Implement and run focused regression proof.                           |
| 2026-08-20 | sg-development | GPT-5 | Hardened resize scheduling, drag recovery, native visibility/preload, pool diagnostics and frontend/Rust trust boundaries. Ran 174 tests, 11 focused tests, core typecheck, targeted lint, token drift check and Tauri frontend build; full Vue typecheck retains 129 unrelated baseline errors and Cargo is unavailable. | partial     | Compile and exercise the native Windows/Tauri runtime before closing. |
| 2026-08-20 | sg-development | GPT-5 | Added explicit layout budgets, semantic grid/panel reference validation, bounded storage reads/writes and honest UI warnings for unavailable, invalid or oversized persistence. Ran 13 focused tests, core typecheck, targeted lint and diff checks without build output; no changed-file Vue type errors remain. | partial | Route native proof outside this code-only workspace. |
| 2026-08-20 | sg-development | GPT-5 | Added deterministic Columns, Rows, Focus and Grid presets that preserve all open panels and reuse their always-rendered WebViews. All 12 focused layout tests, core typecheck, targeted lint, design-token drift and diff checks passed without a build or generated artifact. | partial | Exercise preset switching with native Windows WebViews outside this code-only workspace. |
| 2026-08-20 | sg-development | GPT-5 | Renamed saved bentos to Scenes and connected their bounded state to the existing offline-first workspace sync and encrypted backup path; live autosave and sessions remain local. All 28 focused sync/layout/backup tests, core typecheck, targeted lint, token drift and diff checks passed without a build or generated artifact. | partial | Verify the deployed Convex mutation and native scene switching outside this code-only workspace. |
| 2026-08-20 | sg-development | GPT-5 | Scoped Scenes, selection and local drafts by profile; added v1 migration, profile-switch isolation, deletion cleanup and bounded v2 cloud acceptance. All 38 focused tests, core typecheck, targeted lint, token drift and diff checks passed without a build or generated artifact; the full Vue check has no errors in changed implementation files. | partial | Verify the deployed Convex mutation and native profile switching outside this code-only workspace. |
| 2026-08-20 | sg-planning | GPT-5 | Recorded the Convex v2 deployment as a P0 CI-only task with an explicit no-local-install constraint and secret boundary. | blocked | Add the GitHub deployment secret, then implement and run the manual CI workflow. |
| 2026-08-20 | sg-development | GPT-5 | Prepared a master-only manual GitHub Actions workflow for the Convex backend with explicit DEPLOY confirmation, least-privilege permissions, secret preflight and no application build. Static review only; no workflow, build, test, install or deployment was run. | implemented | Add CONVEX_DEPLOY_KEY, dispatch the workflow, then verify a profiled Scene roundtrip. |
| 2026-08-20 | sg-development | GPT-5 | Added 800 ms autosave for the active named Scene, forced flushes before Scene/profile/workspace transitions, background cloud queueing and a discreet local/sync status. Static review only; no build, install, test or artifact was run. | implemented | Verify rapid edits and Scene/profile switches through CI or a desktop runtime. |
| 2026-08-20 | sg-design | GPT-5 | Audited the full Bento commit range and current workspace against the canonical design authority; replaced the last raw font weight and duplicated Dockview panel minima with canonical tokens and a runtime CSS-to-numeric bridge. Static drift scan reports zero defects; no build, token generation or rendered proof was run. | partial | Verify generated-token consistency and rendered Bento density through CI or a desktop runtime. |

## Current Chantier Flow

| Step      | Status      | Notes                                                                                                          |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| specify   | ready       | Scope, invariants, acceptance and proof are explicit.                                                          |
| ready     | ready       | Existing WebView pool and design-system authority are compatible.                                              |
| implement | implemented | Approved Dockview and native WebView hardening is implemented and documented.                                  |
| verify    | partial     | Automated checks pass; Windows/Tauri rendered drag, resize and restore proof remains unavailable in this host. |
| close     | pending     | Documentation and final status pending.                                                                        |
