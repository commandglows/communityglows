---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "communityglows"
created: "2026-08-20"
created_at: "2026-08-20 00:00:00 UTC"
updated: "2026-08-20"
updated_at: "2026-08-20 00:47:46 UTC"
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
next_step: "Run the Windows/Tauri visual drag, split, resize and restore checklist when a callable desktop runtime is available."
---

# CommunityGlows Desktop Bento Workspace

## Outcome

Le desktop affiche plusieurs réseaux simultanément dans un workspace dockable. Un réseau sélectionné depuis la navigation ouvre ou active son panneau. Les panneaux peuvent être déplacés, groupés en onglets, divisés horizontalement ou verticalement et redimensionnés. L'utilisateur peut enregistrer, charger, renommer, supprimer et réinitialiser des layouts locaux.

## Scope

- Desktop Vue/Tauri uniquement ; le rendu mobile et extension reste inchangé.
- Une WebView native isolée par couple profil/réseau et par panneau réseau.
- Dockview comme moteur de disposition, enveloppé par des composants CommunityGlows.
- Persistance locale versionnée avec validation défensive et restauration sûre.
- Layout courant autosauvegardé et layouts nommés gérés depuis une barre d'outils compacte.

## Invariants

- L'isolation de session existante `${profileId}-${networkId}` reste la frontière native.
- Les URLs de panneaux proviennent du catalogue de réseaux ou d'un lien personnalisé déjà validé.
- Une donnée locale corrompue ne bloque jamais le démarrage : elle est ignorée au profit d'un layout sain.
- Les overlays CommunityGlows masquent toutes les WebViews visibles avant de se placer au-dessus.
- Android conserve son expérience mono-réseau actuelle.
- Les valeurs visuelles sont consommées depuis les tokens du design system.

## Acceptance Criteria

- Sélectionner deux réseaux ouvre deux panneaux distincts sans détruire le premier.
- Le drag d'un onglet vers un bord crée un split et les séparateurs redimensionnent les zones.
- Fermer un panneau masque sa WebView et la conserve dans le pool existant.
- Le layout courant survit au rechargement local.
- Un layout nommé peut être créé, chargé, renommé et supprimé.
- Un layout invalide ou contenant un réseau inconnu est rejeté sans crash.
- Les raccourcis de docking au clavier restent activés et annoncés par le moteur maintenu.
- Tests ciblés, typecheck, build Tauri frontend, tests existants et contrôle de dérive passent.

## Proof Plan

- Tests unitaires du parseur, du stockage versionné et des opérations de layouts nommés.
- Test du calcul des bounds et des transitions WebView existantes.
- `pnpm test:once`, `pnpm typecheck:full`, `pnpm tauri:build`, `cargo check` quand le système le permet.
- Contrôle ShipGlows de dérive des tokens sur les fichiers UI modifiés.
- Inspection du bundle et preuve visuelle locale si le runtime est callable.

## Skill Run History

| Date UTC   | Skill          | Model | Action                                                                 | Result | Next step                              |
| ---------- | -------------- | ----- | ---------------------------------------------------------------------- | ------ | -------------------------------------- |
| 2026-08-20 | sg-development | GPT-5 | User-approved product contract, architecture and proof route recorded. | ready  | Implement the desktop bento workspace. |
| 2026-08-20 | sg-development | GPT-5 | Implemented Dockview workspace, concurrent native WebView hosts, defensive local persistence, named layouts and documentation. | implemented | Run automated verification. |
| 2026-08-20 | sg-development | GPT-5 | Ran 170 tests, core typecheck, Tauri frontend build, targeted lint, dependency audit and design drift scan. Browser and Cargo probes were unavailable in this host. | partial | Complete Windows visual proof before closing. |

## Current Chantier Flow

| Step      | Status      | Notes                                                             |
| --------- | ----------- | ----------------------------------------------------------------- |
| specify   | ready       | Scope, invariants, acceptance and proof are explicit.             |
| ready     | ready       | Existing WebView pool and design-system authority are compatible. |
| implement | implemented | Dockview integration, multi-WebView lifecycle and persistence are in place. |
| verify    | partial     | Automated checks pass; Windows/Tauri rendered drag, resize and restore proof remains unavailable in this host. |
| close     | pending     | Documentation and final status pending.                           |
