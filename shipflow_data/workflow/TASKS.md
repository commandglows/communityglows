# Tasks — socialglowz

> **Priority:** 🔴 P0 blocker · 🟠 P1 high · 🟡 P2 normal · 🟢 P3 low · ⚪ deferred
> **Status:** 📋 todo · 🔄 in progress · ✅ done · ⛔ blocked · 💤 deferred

---

## Priority Queue

### 🔴 P0 - Critical

🔴 [socialglowz] task: Fix Android WebView pooling reloads so same-profile network returns reuse a warm host instead of visibly reloading | status: todo | area: android-webview | id: BUG-2026-05-24-001 | impact: high | effort: medium | unblocks: mobile-release-proof | risk: high-user-facing-regression
🔴 [socialglowz] task: Retest and close fast-uri security advisory fix after lockfile regeneration | status: todo | area: security-deps | id: BUG-2026-05-10-001 | impact: high | effort: low | unblocks: dependency-ship-readiness | risk: unresolved-security-advisory
🔴 [socialglowz] task: Run sf-verify for extension parity: Chrome popup/side panel/options/install/update, Firefox popup/options, web-ext innerHTML warnings, and targeted Tauri regression proof | status: todo | area: extension-qa | id: sg-extension-parity-verify | impact: high | effort: medium | unblocks: dependency-migration-ship | risk: unverified-cross-surface-release
🔴 [socialglowz] task: Run Lemon Squeezy test-mode buyer smoke for the direct Lifetime Deal path: checkout, success return, activation/status path, and no public AppSumo fallback | status: blocked | area: commerce | id: sg-commerce-lemonsqueezy-testmode-smoke | impact: high | effort: medium | unblocks: paid-ltd-launch | risk: money-access-regression

### 🟠 P1 - High Priority

🟠 [socialglowz] task: Finish and validate Android app deeplink plus shared-link intake flow so `socialglowz://app/open` and Android `ACTION_SEND` reopen the right network/profile session without breaking OAuth callback hardening | status: in_progress | area: mobile-ingress | id: sg-android-deeplink-shared-link-flow | impact: high | effort: medium | unblocks: mobile-growth-entrypoints | risk: untracked-mobile-regression
🟠 [socialglowz] task: Audit WebView DOM-injection and third-party platform compliance before public traction: banner hiding, auto-click scripts, network terms, consent, session/cookie handling, and safer native-only alternatives | status: todo | area: legal-platform-risk | id: sg-webview-platform-compliance-audit | impact: high | effort: medium | unblocks: public-launch-risk-review | risk: third-party-terms-or-legal-exposure
🟠 [socialglowz] task: Document remaining dependency overrides and plan major-line migrations for Vue Router, Vite, PrimeVue, Pinia, Tailwind, ESLint, and TypeScript | status: in_progress | area: deps | id: sg-extension-deps-major-migration-plan | impact: high | effort: high | unblocks: dependency-maintenance | risk: stale-framework-upgrade-plan

### 🟡 P2 - Medium Priority

🟡 [socialglowz] task: Validate compact mobile network grid on narrow and standard device widths | status: todo | area: mobile-ui | id: sg-mobile-network-grid-qa | impact: medium | effort: low | unblocks: mobile-ui-polish | risk: layout-regression
🟡 [socialglowz] task: Benchmarker les fonctions createur Android 17 pour WisprFlow/SocialFlowz: Screen Reactions, qualite Instagram, Edits IA on-device, separation audio, Premiere tablette et APV comme inspirations shorts/mobile | status: todo | area: android-creator-workflow | id: sg-android17-creator-workflow-benchmark | impact: medium | effort: medium | unblocks: future-short-creation-ux | risk: platform-opportunity-missed

### 🟢 Completed

🟢 [socialglowz] task: Compact mobile network list into four-column square tiles | status: done | area: mobile-ui | id: sg-mobile-network-grid-compact
🟢 [socialglowz] task: Remove stale web/Vercel target references from project docs and scripts | status: done | area: docs | id: sg-docs-remove-stale-web-target
🟢 [socialglowz] task: Fix extension dependency audit findings: remove unused vite-plugin-pwa path or patch its transitive Babel/brace-expansion advisories, upgrade Convex/ws safely, and re-run extension builds | status: done | area: deps | id: sg-extension-deps-audit-fixes
🟢 [socialglowz] task: Clean unused extension/dev dependencies and package metadata gaps: remove stale direct deps and add license/engines metadata | status: done | area: deps | id: sg-extension-deps-hygiene
🟢 [socialglowz] task: Add processor-agnostic entitlements plus Lifetime Deal/manual code redemption foundation | status: done | area: billing | id: sg-billing-entitlements-foundation
🟢 [socialglowz] task: Add SocialGlowz UI for entering Lifetime Deal/early-bird activation codes and reading billing.getProductAccess | status: done | area: billing | id: sg-billing-redemption-ui
🟢 [socialglowz] task: Add operator script or Convex runbook for importing partner/direct Lifetime Deal code batches with SOCIALGLOWZ_BILLING_ADMIN_SECRET | status: done | area: billing | id: sg-billing-code-import-runbook

## Priority Notes

- Priority last updated: 2026-07-10
- Prioritization criteria: balanced impact, blockers, security/money risk, and bounded effort.
- Immediate start recommendation: finish a bounded validation pass on `sg-android-deeplink-shared-link-flow` first because the work is already in the tree and currently untracked; once that branch is either validated or parked cleanly, retest `BUG-2026-05-10-001` as the next highest-ROI P0, then run extension parity verification.

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

- 2026-05-11: ShipFlow layout aligned. Legacy root docs were removed or moved into `shipflow_data/`; specs, bugs, research, competitors/inspirations, and audit log now use canonical paths.
- 2026-05-11: Task notes were updated after full layout migration; site assets and legacy root web artifacts were consolidated under shipflow_data/ and site split finalized.
