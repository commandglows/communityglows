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

🟠 [communityglows] task: Ajouter au bridge CommandGlows le démarrage serveur d’un essai CommunityGlows unique par compte et son exposition dans le snapshot d’entitlement, avec dates trusted, expiration idempotente, impossibilité de réinitialisation par réinstallation/appareil, et distinction trial_active/trial_expired/lifetime_active consommable par Windows et Android | status: reviewed | area: trial-entitlements | id: communityglows-trial-entitlement-bridge | impact: critical | effort: high | unblocks: public-30-day-trial | risk: access-bypass-and-inconsistent-cross-platform-state | depends_on: communityglows-suite-entitlement-adapter | acceptance: démarrage une seule fois par compte authentifié; trialStartedAt/trialEndsAt issus du ledger serveur; expiration basée sur l’horloge serveur; snapshot compatible avec l’adapter CommunityGlows; tests idempotence/réinstallation/multi-appareil; aucun accès accordé sur payload incomplet; migration des comptes existants documentée | proof: suite bridge tests 32/32, suite build:check 0 erreur, CommunityGlows tests 34/34, typecheck:core réussi; déploiement et device proof restant à faire
🟠 [communityglows] task: Ajouter une formule progressive sans engagement à 10 × 8 € en complément du paiement comptant à 79 €, avec accès actif pendant les mois réglés, arrêt possible sans nouvelle échéance, suspension de l’accès en cas d’arrêt, conservation du nombre de paiements acquis, reprise ultérieure et conversion automatique en licence à vie après le dixième paiement validé | status: todo | area: commerce-installment-entitlements | id: communityglows-progressive-10x8-payment | impact: high | effort: high | unblocks: flexible-founder-purchase | risk: payment-entitlement-reconciliation-refund-and-retry-errors | depends_on: sg-commerce-lemonsqueezy-testmode-smoke | acceptance: checkout affiche clairement 10 paiements de 8 € pour 80 € au total; aucune dette ni échéance après arrêt; accès suspendu sans supprimer les données; progression conservée et reprise possible; licence à vie après exactement 10 paiements capturés; échecs remboursements doublons et webhooks rejoués traités de façon idempotente; statut et prochaine échéance visibles; offre comptant à 79 € inchangée
🟠 [communityglows] task: Exécuter le smoke test de production du trial et du Lifetime Deal sur Windows et Android | status: todo | area: trial-device-release-proof | id: communityglows-trial-production-device-smoke | impact: critical | effort: medium | unblocks: public-30-day-trial | risk: cross-platform-access-regression | depends_on: communityglows-bridge-hosted-smoke | acceptance: même compte et mêmes dates sur Windows/Android; réinstallation et second appareil ne réinitialisent pas le trial; trial expiré bloque les actions protégées mais conserve récupération/export/achat; Lifetime réactive l’accès sans réinstallation
🟠 [communityglows] task: Renommer la configuration locale CommunityGlows et supprimer les derniers noms d’environnement `SOCIALGLOWZ_*` | status: todo | area: billing-configuration | id: communityglows-local-env-rename | impact: high | effort: low | unblocks: communityglows-bridge-hosted-smoke | risk: local-or-preview-bridge-misconfiguration | acceptance: `.env.example` et documentation opérationnelle utilisent uniquement `COMMUNITYGLOWS_*`; aucune référence active aux anciens noms dans l’application ou les scripts
🟡 [communityglows] task: Ajouter les rappels de fin d’essai J-7, J-3 et J-1, avec possibilité de les repousser | status: todo | area: trial-lifecycle-ux | id: communityglows-trial-reminders | impact: medium | effort: medium | unblocks: trial-conversion-ux | risk: notification-fatigue-or-missed-expiry
🟠 [socialglowz] task: Finish and validate Android app deeplink plus shared-link intake flow so `socialglowz://app/open` and Android `ACTION_SEND` reopen the right network/profile session without breaking OAuth callback hardening | status: in_progress | area: mobile-ingress | id: sg-android-deeplink-shared-link-flow | impact: high | effort: medium | unblocks: mobile-growth-entrypoints | risk: untracked-mobile-regression
🟠 [socialglowz] task: Run contextual-task manual smoke across Chrome/Firefox popup capture, desktop task board, and Android shared HTTPS links; verify internal/non-HTTPS rejection, URL redaction, metadata fallback, reopen flow, and no third-party page scraping | status: todo | area: contextual-task-qa | id: sg-contextual-task-smoke | impact: high | effort: medium | unblocks: contextual-task-release-proof | risk: missing-cross-platform-manual-proof
🟠 [socialglowz] task: Document remaining dependency overrides and plan major-line migrations for Vue Router, Vite, PrimeVue, Pinia, Tailwind, ESLint, and TypeScript | status: in_progress | area: deps | id: sg-extension-deps-major-migration-plan | impact: high | effort: high | unblocks: dependency-maintenance | risk: stale-framework-upgrade-plan
🟠 [socialglowz] task: Hide the active Windows native child WebView while desktop settings are open, then restore the same warm profile/network session when settings close | status: in_progress | area: windows-webview | id: sg-windows-settings-overlay | impact: high | effort: medium | unblocks: windows-settings-qa | risk: native-overlay-blocks-settings | evidence: shipglows_data/workflow/bugs/BUG-2026-08-02-002.md | note: implementation locale terminée; preuve visuelle et fonctionnelle sur un installeur Windows frais encore requise
🟠 [socialglowz] task: Expose a direct desktop action to create a new profile from the Windows profile panel | status: in_progress | area: windows-profiles | id: sg-windows-profile-create | impact: high | effort: low | unblocks: windows-profile-isolation-qa | risk: profile-qa-blocked | note: flux partagé de création et gestion implémenté localement; validation Windows installée encore requise

### 🟡 P2 - Medium Priority

🟡 [socialglowz] task: Validate compact mobile network grid on narrow and standard device widths | status: todo | area: mobile-ui | id: sg-mobile-network-grid-qa | impact: medium | effort: low | unblocks: mobile-ui-polish | risk: layout-regression
🟡 [socialglowz] task: Benchmarker les fonctions createur Android 17 pour WisprFlow/SocialFlowz: Screen Reactions, qualite Instagram, Edits IA on-device, separation audio, Premiere tablette et APV comme inspirations shorts/mobile | status: todo | area: android-creator-workflow | id: sg-android17-creator-workflow-benchmark | impact: medium | effort: medium | unblocks: future-short-creation-ux | risk: platform-opportunity-missed
🟡 [socialglowz] task: Regrouper plusieurs pages et vues ouvertes sous leur réseau et leur profil afin de naviguer entre conversations, communautés et contenus sans perdre le contexte | status: todo | area: workspace-navigation | id: sg-network-page-grouping | impact: high | effort: high | unblocks: multi-page-community-workflows | risk: webview-state-and-session-complexity
🟡 [socialglowz] task: Créer une command bar globale accessible depuis partout par un raccourci clavier configurable, avec recherche et actions rapides sur tous les éléments possédés par l’application : onglets ouverts, réseaux, profils, contacts, notes, tâches, CRM, liens et paramètres | status: todo | area: workspace-search | id: sg-global-workspace-search | impact: high | effort: high | unblocks: fast-community-context-retrieval | risk: privacy-cross-source-index-drift-and-shortcut-conflicts | acceptance: ouverture sans perdre le contexte courant; raccourci desktop par défaut Ctrl/Cmd+K et configurable; résultats groupés et navigables au clavier; recherche tolérante et rapide; ouverture ou activation de l’élément sélectionné; actions disponibles selon le type; permissions et isolation des profils respectées; aucune collecte ni indexation du contenu des pages tierces non autorisées; état vide et erreurs explicites
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
