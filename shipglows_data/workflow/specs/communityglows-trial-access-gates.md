---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "2.0.0"
project: communityglows
created: "2026-08-06"
updated: "2026-08-11"
status: superseded
superseded_by: "/home/claude/shipglows/shipglows_data/workflow/specs/unified-suite-commercial-entitlement-and-stripe.md"
source_skill: shipglows
scope: "shared trial entitlement and cross-platform access gates"
owner: Diane
confidence: medium
user_story: "As a new CommunityGlows user, I want to try every currently available feature for 30 days without a card or automatic billing, then understand exactly how to keep access, so the same entitlement state is respected on Windows and Android."
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "convex/billing.ts"
  - "src/composables/useBillingAccess.ts"
  - "src/ui/setup/pages/CommunityGlows/components/BillingAccessPanel.vue"
  - "src/locales/en.json"
  - "src/locales/fr.json"
  - "CommandGlows suite entitlement bridge"
depends_on:
  - artifact: "shipglows_data/workflow/specs/communityglows-single-price-public-contract.md"
    artifact_version: "1.5.0"
    required_status: reviewed
supersedes: []
evidence:
  - "CommunityGlows billing adapter consumes the suite entitlement snapshot and normalizes trialExpiresAt/trialEndsAt."
  - "Operator approved a 30-day no-card trial with no automatic billing and requested shared Windows/Android gates and recovery UX."
  - "Operator decision later on 2026-08-11: CommunityGlows receives the same two restart allowance and Stripe-only provider contract as every suite product."
next_step: "Implement the canonical suite spec; retain this document as historical single-cycle provenance only."
---

# CommunityGlows Trial Access Gates

> **Superseded on 2026-08-11.** The single-cycle CommunityGlows contract below
> is historical. The sole active authority is
> `/home/claude/shipglows/shipglows_data/workflow/specs/unified-suite-commercial-entitlement-and-stripe.md`:
> 30 days per cycle, two maximum restarts, purchase mandatory after three
> cycles, no permanent freemium, and Stripe Managed Payments only.

## Contract

CommunityGlows offers one full trial per account: 30 calendar days, no payment card, no automatic charge. “Full” means all currently available product capabilities; roadmap and in-development items are excluded. The €79 lifetime purchase is voluntary after or during the trial.

The entitlement ledger remains the source of truth. Windows and Android consume the same access snapshot and must fail closed for protected actions while preserving a bounded local grace window when the bridge is temporarily unavailable.

## Access states

- `trial_active`: access until `trialEndsAt`.
- `trial_expired`: read-only recovery state; data remains available for export, sign-in, purchase, and support.
- `lifetime_active`: full access with no expiry unless revoked or refunded.
- `installment_active`, `installment_paused`, `installment_complete`: reserved for the separately planned 10 × €8 path; do not expose until its provider and ledger lifecycle is verified.
- `bridge_unavailable`: never silently downgrade an entitled user; show retry and last-known-state messaging.

## UX invariants

- First-run explains the 30-day trial, what “full” includes, and that no card is required.
- Remaining time is visible but quiet; reminders at seven, three, and one day are dismissible.
- Expiry explains the reason, preserves local data, and offers lifetime purchase plus restore/retry/support actions.
- Windows and Android use equivalent wording and state labels, adapted to platform layout.
- No gate blocks sign-out, account recovery, data export, privacy controls, or purchase recovery.

## Acceptance criteria

- [ ] Trial start is recorded once against an authenticated account with a trusted server timestamp.
- [ ] Trial cannot be reset by reinstalling, changing device, or clearing local storage.
- [ ] All protected app entry points use the shared entitlement guard.
- [ ] Windows and Android show the same state for the same account within the documented sync/grace policy.
- [ ] Expired trial cannot access protected product actions but preserves recovery and data paths.
- [ ] Lifetime purchase changes access without requiring a reinstall.
- [ ] Bridge failure never grants unverified access and never unexpectedly removes a recently verified entitlement during the grace window.
- [ ] Unit, integration, and device-level Windows/Android tests cover state transitions and recovery.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
| --- | --- | --- | --- | --- | --- |
| 2026-08-06 | shipglows | GPT-5 Codex | Formalized the shared 30-day trial, access states, cross-platform gate, UX invariants, and proof obligations after inspecting the current free/active billing adapter. | draft | Readiness review and suite bridge contract |
| 2026-08-06 | sg-engineering access | GPT-5 Codex | Added trusted trial snapshot handling, fail-closed access interpretation, bounded bridge grace, and shared Windows/Android recovery gate UI. | partial | Implement unique trial start in the CommandGlows bridge/ledger |
| 2026-08-06 | sg-engineering access | GPT-5 Codex | Added idempotent 30-day server trial creation in the suite bridge, paid-entitlement precedence, expired-trial timestamps, CommunityGlows route alias, and shared secret header compatibility. | reviewed | Run deployed bridge smoke and Windows/Android device proof |
| 2026-08-11 | sg-development | GPT-5 Codex | Renamed the CommunityGlows checkout contract from WinFlowz to CommandGlows, aligned active environment templates with runtime `COMMUNITYGLOWS_*` keys, documented that the 30-day trial has no permanent-free fallback, and passed the site build, billing tests, core typecheck, metadata lint, and generated-checkout URL check. | implemented | Run the existing deployed bridge and Windows/Android device proof |
| 2026-08-11 | sg-docs | GPT-5 Codex | Marked the single-cycle/product-provider exception superseded and transferred active authority to the unified suite 30-day × three-cycle, Stripe-only contract. | superseded | Implement the canonical suite spec before hosted/device proof. |

## Current Chantier Flow

- historical product chantier: superseded; prior local implementation remains evidence
- canonical authority: unified suite commercial entitlement and Stripe spec
- implementation: add two CommunityGlows restarts and replace Lemon Squeezy with Stripe
- verification: rerun local contract tests before deferred hosted/device proof
