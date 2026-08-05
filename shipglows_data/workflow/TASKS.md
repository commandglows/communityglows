# Tasks — socialglowz

> **Priority:** 🔴 P0 blocker · 🟠 P1 high · 🟡 P2 normal · 🟢 P3 low · ⚪ deferred
> **Status:** 📋 todo · 🔄 in progress · ✅ done · ⛔ blocked · 💤 deferred

---

## Priority Queue

### 🔴 P0 - Critical

🔴 [socialglowz] task: Remediate Google Play Android compliance blockers before public submission: remove automated consent and anti-bot behavior, implement account deletion, align privacy and Data Safety, and define an authorized third-party WebView and UGC architecture | status: in_progress | area: google-play-compliance | id: sg-google-play-compliance-remediation | impact: critical | effort: high | unblocks: android-public-release | risk: rejection-policy-legal-security | evidence: shipglows_data/workflow/audits/2026-07-15-google-play-android-compliance.md | note: public WebView automation removal and copy alignment implemented; device/CI proof and remaining release blockers still open
🔴 [socialglowz] task: Fix Android WebView pooling reloads so same-profile network returns reuse a warm host instead of visibly reloading | status: todo | area: android-webview | id: BUG-2026-05-24-001 | impact: high | effort: medium | unblocks: mobile-release-proof | risk: high-user-facing-regression
🔴 [socialglowz] task: Run sf-verify for extension parity: Chrome popup/side panel/options/install/update, Firefox popup/options, web-ext innerHTML warnings, and targeted Tauri regression proof | status: todo | area: extension-qa | id: sg-extension-parity-verify | impact: high | effort: medium | unblocks: dependency-migration-ship | risk: unverified-cross-surface-release
🔴 [socialglowz] task: Run Lemon Squeezy test-mode buyer smoke for the direct Lifetime Deal path: checkout, success return, activation/status path, and no public AppSumo fallback | status: blocked | area: commerce | id: sg-commerce-lemonsqueezy-testmode-smoke | impact: high | effort: medium | unblocks: paid-ltd-launch | risk: money-access-regression

### 🟠 P1 - High Priority

🟠 [socialglowz] task: Finish and validate Android app deeplink plus shared-link intake flow so `socialglowz://app/open` and Android `ACTION_SEND` reopen the right network/profile session without breaking OAuth callback hardening | status: in_progress | area: mobile-ingress | id: sg-android-deeplink-shared-link-flow | impact: high | effort: medium | unblocks: mobile-growth-entrypoints | risk: untracked-mobile-regression
🟠 [socialglowz] task: Run contextual-task manual smoke across Chrome/Firefox popup capture, desktop task board, and Android shared HTTPS links; verify internal/non-HTTPS rejection, URL redaction, metadata fallback, reopen flow, and no third-party page scraping | status: todo | area: contextual-task-qa | id: sg-contextual-task-smoke | impact: high | effort: medium | unblocks: contextual-task-release-proof | risk: missing-cross-platform-manual-proof
🟠 [socialglowz] task: Document remaining dependency overrides and plan major-line migrations for Vue Router, Vite, PrimeVue, Pinia, Tailwind, ESLint, and TypeScript | status: in_progress | area: deps | id: sg-extension-deps-major-migration-plan | impact: high | effort: high | unblocks: dependency-maintenance | risk: stale-framework-upgrade-plan
🟠 [socialglowz] task: Hide the active Windows native child WebView while desktop settings are open, then restore the same warm profile/network session when settings close | status: in_progress | area: windows-webview | id: sg-windows-settings-overlay | impact: high | effort: medium | unblocks: windows-settings-qa | risk: native-overlay-blocks-settings | evidence: shipglows_data/workflow/bugs/BUG-2026-08-02-002.md
🟠 [socialglowz] task: Expose a direct desktop action to create a new profile from the Windows profile panel | status: in_progress | area: windows-profiles | id: sg-windows-profile-create | impact: high | effort: low | unblocks: windows-profile-isolation-qa | risk: profile-qa-blocked

### 🟡 P2 - Medium Priority

🟡 [socialglowz] task: Validate compact mobile network grid on narrow and standard device widths | status: todo | area: mobile-ui | id: sg-mobile-network-grid-qa | impact: medium | effort: low | unblocks: mobile-ui-polish | risk: layout-regression
🟡 [socialglowz] task: Benchmarker les fonctions createur Android 17 pour WisprFlow/SocialFlowz: Screen Reactions, qualite Instagram, Edits IA on-device, separation audio, Premiere tablette et APV comme inspirations shorts/mobile | status: todo | area: android-creator-workflow | id: sg-android17-creator-workflow-benchmark | impact: medium | effort: medium | unblocks: future-short-creation-ux | risk: platform-opportunity-missed
🟡 [socialglowz] task: Regrouper plusieurs pages et vues ouvertes sous leur réseau et leur profil afin de naviguer entre conversations, communautés et contenus sans perdre le contexte | status: todo | area: workspace-navigation | id: sg-network-page-grouping | impact: high | effort: high | unblocks: multi-page-community-workflows | risk: webview-state-and-session-complexity
🟡 [socialglowz] task: Rendre la recherche globale opérationnelle sur les données possédées par SocialGlowz, notamment réseaux, profils, contacts, notes, tâches et conversations autorisées, sans scraper les pages tierces | status: todo | area: workspace-search | id: sg-global-workspace-search | impact: high | effort: medium | unblocks: fast-community-context-retrieval | risk: privacy-and-cross-source-index-drift
🟡 [socialglowz] task: Ajouter des notifications configurables par réseau ou application avec activation, silence, priorité et plage horaire, en respectant les capacités officielles de chaque source | status: todo | area: notification-controls | id: sg-per-app-notification-controls | impact: high | effort: medium | unblocks: community-response-workflow | risk: noisy-or-unsupported-third-party-notifications
🟡 [socialglowz] task: Étendre le mode focus existant au-delà des niveaux de gris avec sélection des réseaux autorisés, silence temporaire des notifications et durée de session visible | status: todo | area: focus-mode | id: sg-guided-focus-mode | impact: medium | effort: medium | unblocks: distraction-controlled-community-work | risk: hidden-urgent-community-items
🟡 [socialglowz] task: Mettre en veille les services et WebViews inactifs avec reprise fiable de la bonne session et exemptions configurables pour les réseaux communautaires prioritaires | status: todo | area: service-hibernation | id: sg-inactive-service-hibernation | impact: high | effort: high | unblocks: scalable-multi-network-workspaces | risk: missed-events-or-session-reload-regression | depends_on: BUG-2026-05-24-001

### 🟢 Completed

🟢 [socialglowz] task: Audit WebView DOM-injection and third-party platform compliance before public traction: banner hiding, auto-click scripts, network terms, consent, session/cookie handling, and safer native-only alternatives | status: done | area: legal-platform-risk | id: sg-webview-platform-compliance-audit | impact: high | effort: medium | unblocks: public-launch-risk-review | risk: third-party-terms-or-legal-exposure | evidence: shipglows_data/workflow/audits/2026-07-15-google-play-android-compliance.md
🟢 [socialglowz] task: Compact mobile network list into four-column square tiles | status: done | area: mobile-ui | id: sg-mobile-network-grid-compact
🟢 [socialglowz] task: Retest and close fast-uri security advisory fix after lockfile regeneration | status: done | area: security-deps | id: BUG-2026-05-10-001
🟢 [socialglowz] task: Remove stale web/Vercel target references from project docs and scripts | status: done | area: docs | id: sg-docs-remove-stale-web-target
🟢 [socialglowz] task: Fix extension dependency audit findings: remove unused vite-plugin-pwa path or patch its transitive Babel/brace-expansion advisories, upgrade Convex/ws safely, and re-run extension builds | status: done | area: deps | id: sg-extension-deps-audit-fixes
🟢 [socialglowz] task: Clean unused extension/dev dependencies and package metadata gaps: remove stale direct deps and add license/engines metadata | status: done | area: deps | id: sg-extension-deps-hygiene
🟢 [socialglowz] task: Add processor-agnostic entitlements plus Lifetime Deal/manual code redemption foundation | status: done | area: billing | id: sg-billing-entitlements-foundation
🟢 [socialglowz] task: Add SocialGlowz UI for entering Lifetime Deal/early-bird activation codes and reading billing.getProductAccess | status: done | area: billing | id: sg-billing-redemption-ui
🟢 [socialglowz] task: Add operator script or Convex runbook for importing partner/direct Lifetime Deal code batches with SOCIALGLOWZ_BILLING_ADMIN_SECRET | status: done | area: billing | id: sg-billing-code-import-runbook

## Priority Notes

- Priority last updated: 2026-08-03
- Prioritization criteria: balanced impact, blockers, security/money risk, and bounded effort.
- Immediate start recommendation: run extension parity verification next; `BUG-2026-05-10-001` is now closed locally, and the remaining security pressure sits in the broader dependency migration/hardening backlog (`shell-quote`, `vite`, `undici`, `ws`).

---

## Setup

| Pri | Task | Status |
|-----|------|--------|
| 🟠 | [Task backlog was migrated; validate project tracker entries] | ✅ done |
| 🟡 | [Quand un vrai flow OAuth existe, tester le callback positif Android: connexion lancée depuis l'app, state/nonce attendus, callback accepté, faux deep links toujours rejetés] | 💤 deferred |

---

## Historical completed work

(Keep existing project history entries here if available from legacy tracker.)

- 2026-05-23: Completed Android WebView storage isolation for CinderReels profile sessions. Includes per-session cookies/localStorage snapshots, declarative network storage origins, bottom bar propagation, backup/delete wiring, docs, and user-reported Android APK A/B/A QA pass.

## Audit Findings

- 2026-05-11: ShipFlow layout aligned. Legacy root docs were removed or moved into `shipglows_data/`; specs, bugs, research, competitors/inspirations, and audit log now use canonical paths.
- 2026-05-11: Task notes were updated after full layout migration; site assets and legacy root web artifacts were consolidated under shipglows_data/ and site split finalized.
