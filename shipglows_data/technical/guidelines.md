---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: "communityglows"
created: "2026-05-12"
updated: "2026-08-03"
status: reviewed
source_skill: 300-sg-docs
scope: technical
owner: "Diane"
confidence: high
risk_level: medium
docs_impact: yes
security_impact: low
linked_systems:
  - "shipglows_data/technical/context.md"
  - "shipglows_data/technical/context-function-tree.md"
  - "shipglows_data/technical/architecture.md"
  - "shipglows_data/technical/README.md"
  - "shipglows_data/technical/design-system-authority.md"
  - "README.md"
  - "vite.config.ts"
  - "vite.chrome.config.ts"
  - "vite.firefox.config.ts"
  - "vite.web.config.ts"
  - "vite.tauri.config.ts"
  - "manifest.config.ts"
depends_on:
  - artifact: "shipglows_data/technical/context.md"
    artifact_version: "1.3.0"
    required_status: reviewed
  - artifact: "shipglows_data/technical/architecture.md"
    artifact_version: "1.0.2"
    required_status: reviewed
evidence:
  - "README.md"
  - "package.json"
  - "vite.config.ts"
  - "vite.chrome.config.ts"
  - "vite.firefox.config.ts"
  - "vite.web.config.ts"
  - "vite.tauri.config.ts"
  - "src/ui/setup/pages/CommunityGlows/main.ts"
  - "src/ui/setup/pages/CommunityGlows/assets/main.css"
  - "src/ui/setup/pages/CommunityGlows/components/ui/"
  - "src-tauri/src/lib.rs"
  - "convex/schema.ts"
supersedes: []
next_review: "2026-09-03"
next_step: "/300-sg-docs update shipglows_data/technical/guidelines.md"
---

# Technical Guidelines

## Technical stack conventions

- Windows/Tauri UI: Vue 3 + TypeScript + Pinia + Reka UI + wrappers/tokens CommunityGlows + Notivue; aucun runtime PrimeVue dans cette entrée.
- Legacy extension UI: preserve PrimeVue/PrimeFlex/PrimeIcons only where historical extension entries still consume them.
- Backend: Convex Auth + Convex schema layer.
- Native host: Tauri 2 (Rust + Kotlin/Swift), including Android WebView plugin.
- Build targets: `vite.web.config.ts`, `vite.chrome.config.ts`, `vite.firefox.config.ts`, `vite.tauri.config.ts`.

## Implementation rules

1. Préférer les abstractions communes (`src/`, stores, composables) avant les branchements spécifiques plateforme.
2. Pour les flux asynchrones critiques (`auth`, bootstrap, sync), garantir un état visible (`loading`, `error`, `ready`) avant d'exposer les vues sensibles.
3. Vérifier la cohérence des pages dédiées (extension, desktop, mobile, web) sur la même logique de state global.
4. Gérer les états mobiles et desktop via les flux standards de `main.ts`, `App.vue`, `router/index.ts`, sans contourner les guards métier.
5. Eviter d'introduire des dépendances nouvelles sans bénéfice de sécurité, de dette technique, ou de couverture de flux.

## Security and persistence rules

- Les données de session et cookies sont sensibles: pas de persistance transparente non explicitée.
- Tout changement de chemin d'authentification doit être observé côté UI et, le cas échéant, réversible.
- Ne jamais logger de secrets (tokens, credentials, clés privées).
- Les commandes natives et ponts IPC doivent exposer des actions bornées et explicites.

## Delivery and release constraints

- Toute modification touchant `src-tauri/` ou `convex/*` doit passer par une revue spec-first.
- Les changements affectant le packaging multiplateforme doivent mettre à jour `shipglows_data/workflow/specs/` si le comportement change.
- Mettre à jour `shipglows_data/technical/context.md` et `shipglows_data/technical/context-function-tree.md` dès qu'un flux d'entrée/sortie majeur change.

## Validation and maintenance

- Maintenir la cohérence entre:
  - `shipglows_data/technical/context.md`
  - `shipglows_data/technical/context-function-tree.md`
  - `shipglows_data/technical/architecture.md`
  - `README.md`
- Lancer les validations pertinentes (lint/typecheck/build selon la surface touchée) avant clôture de chantiers.
