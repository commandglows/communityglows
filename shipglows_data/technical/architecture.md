---
artifact: architecture_context
metadata_schema_version: "1.0"
artifact_version: "1.0.3"
project: "communityglows"
created: "2026-04-26"
updated: "2026-08-04"
status: reviewed
source_skill: 300-sg-docs
scope: architecture
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
linked_systems:
  - "shipglows_data/technical/context.md"
  - "shipglows_data/technical/context-function-tree.md"
  - "README.md"
  - "shipglows_data/technical/README.md"
external_dependencies:
  - "Vue 3"
  - "Vite"
  - "Tauri 2"
  - "Convex"
  - "Browser extension APIs"
invariants:
  - "One shared Vue application layer serves extension, desktop, mobile, and web targets."
  - "Native WebView/session behavior stays isolated in Tauri/Rust and Android plugin surfaces."
  - "Cloud sync must remain optional when Convex configuration is absent."
depends_on:
  - artifact: "shipglows_data/technical/context.md"
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes:
  - "archi.md"
evidence:
  - "Legacy root archi.md was a pointer to shipglows_data/technical/architecture.md."
  - "Vite, Tauri, Convex, and manifest configs define CommunityGlows's distribution targets."
next_review: "2026-09-03"
next_step: "/300-sg-docs audit shipglows_data/technical/architecture.md"
---

# Architecture

- CommunityGlows repose sur une base Vue.js unique distribuée en 4 familles de cibles (extension, desktop, mobile, web).
- La couche domaine métier et les stores partagés vivent dans `src/` et `src/ui/setup/pages/CommunityGlows/`.
- La synchronisation cloud passe par Convex quand configurée; sinon, état local.
- Les fonctions natives critiques restent concentrées dans `src-tauri/src/lib.rs` et le plugin Android WebView.

## Références d'architecture

- Vue d’ensemble détaillée : `shipglows_data/technical/context.md`
- Arborescence fonctionnelle : `shipglows_data/technical/context-function-tree.md`
- Contrats techniques : `shipglows_data/technical/README.md`
