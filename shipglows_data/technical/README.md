---
artifact: development_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: communityglows
created: "2026-04-26"
status: reviewed
source_skill: 300-sg-docs
scope: engineering-guidelines
owner: "Diane"
updated: "2026-08-03"
confidence: high
risk_level: medium
security_impact: medium
docs_impact: high
depends_on: []
evidence:
  - "README.md"
  - "package.json"
  - "vite.chrome.config.ts"
  - "vite.firefox.config.ts"
  - "vite.web.config.ts"
  - "vite.tauri.config.ts"
  - "src/ui/setup/pages/CommunityGlows/assets/main.css"
  - "src/ui/setup/pages/CommunityGlows/components/ui/"
  - "shipglows_data/technical/design-system-authority.md"
supersedes: []
next_step: "/300-sg-docs audit shipglows_data/technical/README.md"
---

# Technical Guidelines

## Technical standards

- Use existing stack conventions:
  - Windows/Tauri: Vue 3, TypeScript, Pinia, Reka UI, CommunityGlows wrappers/tokens and Notivue
  - Legacy extension surfaces: preserve existing PrimeVue/PrimeFlex/PrimeIcons consumers until a separately validated migration removes them
  - Site and historical web surfaces: Tailwind/DaisyUI only where already established; do not introduce them as a second Windows visual authority
  - Convex for persistence and auth
  - Tauri 2 for desktop/mobile
- Keep platform-specific build config in the root `vite.*.config.ts` files.
- Do not rewrite shared app logic for one platform unless it reduces duplication globally.

## Code practices

1. Prefer explicit names and small composables over inline monoliths.
2. Keep asynchronous auth/bootstrap flows fail-soft (offline-safe).
3. Guard optional features (e.g., Gmail integration) with graceful fallbacks.
4. Preserve existing hash-based routing in desktop/mobile compatibility paths.
5. Ensure webview and profile/session flows remain deterministic.
6. Route Windows visual values through `assets/main.css` and complex interactions through `components/ui/` with Reka UI where applicable.

## Quality rules

- Lint and typecheck before major changes.
- Keep user-facing strings in i18n.
- Minimize coupling between UI and native platform plumbing.
- Avoid new dependencies unless they reduce technical debt.
- For Windows UI changes, run the design drift check and preserve accessible names, visible focus, Escape/focus restoration and editable-field shortcut isolation.

## Data handling and privacy

- Treat cookies, localStorage, and persisted preferences as sensitive session state.
- Avoid logging secrets, tokens, or raw credentials.
- Keep backup and sync actions transparent to users.
- Treat redemption codes as bearer credentials: do not log raw codes, expose code tables to clients, or put billing admin secrets in browser/mobile builds.
- Keep product access processor-agnostic: UI and feature gates should read Convex entitlements through `billing.getProductAccess`, not direct provider payloads.

## Deployment and release

- Validate web, extension, and desktop builds for each change set where possible.
- Keep `.env.example` aligned with runtime consumption (`VITE_CONVEX_URL`, optional Gmail keys).
- Document any behavioral changes in changelog/task notes.
