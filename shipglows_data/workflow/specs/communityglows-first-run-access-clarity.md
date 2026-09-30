---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: communityglows
created: "2026-09-29"
created_at: "2026-09-29 16:04:00 UTC"
updated: "2026-09-29"
updated_at: "2026-09-29 16:05:00 UTC"
status: ready
source_skill: sg-experience
source_model: "GPT-6 Codex"
scope: "first-run trial and access offer clarity"
owner: Diane
confidence: high
risk_level: medium
security_impact: none
docs_impact: yes
user_story: "En tant que nouvelle personne, je veux savoir avant de configurer l’application si j’ai droit à un essai, ce qu’il comprend, quand il commence et ce que coûtera la suite, afin de décider en connaissance de cause."
linked_systems:
  - src/ui/setup/pages/CommunityGlows/components/OnboardingFlow.vue
  - src/ui/setup/pages/CommunityGlows/components/SignupNudge.vue
  - src/ui/setup/pages/CommunityGlows/components/BillingAccessPanel.vue
  - src/ui/setup/pages/CommunityGlows/components/ProductAccessGate.vue
  - src/locales/fr.json
  - src/locales/en.json
  - shipglows_data/business/gtm.md
  - shipglows_data/workflow/specs/communityglows-single-price-public-contract.md
depends_on:
  - artifact: "shipglows_data/workflow/specs/unified-suite-commercial-entitlement-and-stripe.md"
    artifact_version: "1.3.3"
    required_status: "ready"
  - artifact: "shipglows_data/technical/design-system-authority.md"
    artifact_version: "1.5.0"
    required_status: "reviewed"
supersedes: []
evidence:
  - "The Vue onboarding is shown before the protected-access gate and does not disclose the trial or price."
  - "The suite contract grants an initial 30-day trial, allows up to two user-requested 30-day restarts, then requires purchase; permanent free access is prohibited."
  - "The CommunityGlows public price is EUR 149 incl. VAT as a one-time payment; the operator confirmed this price on 2026-09-29."
  - "The CommunityGlows access bridge requests the initial trial during authenticated access verification; no automatic payment is triggered."
  - "The current onboarding copy advertises a centralized notification feed, which the product offer classifies as planned rather than available."
next_step: "Operator review of rendered French and English onboarding, signup nudge, billing, and access states."
---

# CommunityGlows First-Run Access Clarity

## Status

Ready for a copy-only implementation. This contract does not change entitlement or payment behavior.

## User Story

As a new CommunityGlows user, I want to know before configuring the app whether access is conditional, what a trial includes, when it starts, and what continued access costs, so I can make an informed choice.

## Minimal Behavior Contract

When first-run onboarding opens, show a concise bilingual access summary before the user proceeds into profile and network setup. Explain that access is checked at sign-in; an eligible account receives the first 30-day trial automatically; the trial includes all of CommunityGlows and every feature currently available in the installed version; no card or automatic charge is involved; up to two 30-day restarts may follow an expired cycle; after the third cycle, access to the app pauses until the EUR 149 incl. VAT lifetime licence is purchased, paid once with no subscription. Existing purchased access remains recognized. Do not imply free access after the trial or a guaranteed trial for every account or installation.

The guest sign-up nudge must use the same terms. Billing and expired-access copy must describe the actual state, clearly separate a restart from a purchase, preserve recovery, and use calm non-coercive language.

## Success Behavior

New users can identify the access condition, trial start, full current product scope, maximum duration, no-card/no-auto-charge terms, post-trial price, and that there is no free access after the trial before configuration. Available features are not confused with roadmap work. French and English present equivalent facts and choices.

## Error Behavior

When access is absent or cannot be checked, state that plainly and offer retry, account recovery, or support as applicable. Never say to sign in to start a trial when a verified account has no eligible trial. Never present a technical lookup error as expiry.

## Problem

The existing first-run sequence describes setup and capabilities but omits access terms. The guest nudge promises a free month of a separate “Pro” plan, while CommunityGlows has a single one-time licence offer. The onboarding also describes a notification feed as available although current product truth puts it in the roadmap. Several expiry messages use pressure-oriented language.

## Solution

Add a compact, readable access disclosure to the existing welcome step and align guest, settings, and access-gate wording to the suite entitlement contract and EUR 149 public offer. Keep the access summary informational; do not add a forced consent control or alter when access is checked. Restore Diane's first-person voice as the independent maker behind the product: warm, specific, and proud of the care invested, with the offer and its limits stated before the personal note. Persuade through the currently available product value and the maker's real presence, never through guilt, unsupported promises, or roadmap claims.

## Scope In

- French and English first-run disclosure before setup actions.
- First-person founder voice in onboarding and relevant offer/recovery moments, consistent across French and English.
- Guest sign-up nudge terms.
- Accurate shipped-feature descriptions in the onboarding.
- Billing active/expired/exhausted/no-access copy and expired gate wording.
- Current business offer and public-price contract documentation.

## Scope Out

- Entitlement, trial, identity, eligibility, checkout, tax, or payment code.
- Pricing-page layout or new marketing pages; current public site already displays EUR 149.
- Trial duration/restart policy, analytics, notifications feature work, or roadmap dates.
- Changes to archived copy or historical run records.

## Constraints

- Canonical design authority: `shipglows_data/technical/design-system-authority.md`; reuse existing onboarding hierarchy and project tokens, with no new visual literals.
- Access authority: the active suite commercial contract and server-issued access snapshot. Authentication is not itself an entitlement.
- Public offer: EUR 149 incl. VAT as one lifetime payment, no subscription. Trial: 30 days per cycle, access to all current CommunityGlows features, no card, no automatic charge, at most two user-requested restarts; after the third cycle, purchase is required to keep using the app.
- The trial is granted during authenticated access verification when eligible. Copy must not promise eligibility or imply that browsing the onboarding consumes a trial.
- Do not claim planned capabilities as included. When a trial period ends, make clear that access to the app pauses unless a restart is available; do not imply that locally stored user data is deleted.

## Test Contract

Proof path: evidence-first, copy-only.

- Automated: no entitlement or payment behavior changes; inspect bilingual locale JSON validity and changed translation-key references if project commands are run.
- Rendered: review the first-run welcome step, guest sign-up nudge, active trial, expired trial with restart available, exhausted trial, no-access, and lookup-unavailable states in French and English at desktop and narrow/mobile widths.
- Manual/provider/device: not required because no provider, entitlement, native, or payment behavior changes.
- Limitation: without an authorized live runtime, report source-level implementation separately from rendered user proof.

## Dependencies

- Active suite trial policy in `shipglows_data/workflow/specs/unified-suite-commercial-entitlement-and-stripe.md`.
- Current CommunityGlows one-time offer at EUR 149 incl. VAT.
- Existing bilingual localization and design-system tokens.

## Invariants

- Server entitlement remains the only authority for access.
- The interface never guarantees trial eligibility.
- The artisan-founder story is expressed as the maker's own voice, without invented customer outcomes or commercial guarantees.
- No payment card or automatic payment is implied.
- At most three 30-day cycles are described; only eligible expired cycles can be restarted.
- Local data and recovery remain available as defined by existing product behavior.
- No permanent free tier, separate Pro plan, or future capability is implied.

## Links & Consequences

- `useBillingAccess.ts` and `convex/billing.ts` remain unchanged; the access bridge behavior is not modified.
- `Pricing.astro` and current FR/EN pricing pages remain at EUR 149; copy is aligned with them.
- The old public-price contract and business GTM offer must be reconciled to EUR 149 without rewriting historical run-history entries.

## Documentation Coherence

Update `shipglows_data/business/gtm.md` and the current portions of `communityglows-single-price-public-contract.md`. Preserve historical history rows and archives. No public help article changes are required because the current pricing pages already state the price and trial duration.

## Edge Cases

- Returning user with a purchased licence: disclose the access check without suggesting that the trial replaces their licence.
- Ineligible account or installation: do not promise the trial; the later access state provides the reason and recovery path.
- Active trial: show its trusted remaining time and restart allowance in settings.
- Expired but restart-eligible: expose restart and purchase choices without claiming purchase is yet mandatory.
- Exhausted: state purchase requirement and exact price; preserve retry, support, and data recovery.
- Lookup unavailable: offer retry/support; do not label the user free, expired, or ineligible.
- French/English, narrow layout, keyboard navigation, and skipped onboarding retain usable disclosure and controls.

## Implementation Tasks

1. Add bilingual access terms to the existing welcome step; preserve the pre-existing disabled-future-progress-dot change. User story: disclose terms before configuration. Dependency: this spec. Validation: inspect exact FR/EN copy and existing step navigation.
2. Correct the guest sign-up nudge and remove the unsupported notification-feed claim; make available-feature copy precise. User story: avoid misleading signup and capability claims. Dependency: task 1. Validation: inspect locale keys and call sites.
3. Align billing, reminder, and gate text with current access state and EUR 149 terms; keep restart/recovery choices distinct and remove guilt framing. User story: understand continued access and recover safely. Dependency: active suite contract. Validation: trace every changed key to its rendering branch.
4. Align active business/offer documentation with EUR 149 and record the new first-run contract. User story: ensure product truth has one source. Dependency: tasks 1–3. Validation: focused search of active surfaces for contradictory current prices/claims; ignore archived and explicitly historical evidence.

## Acceptance Criteria

- FR and EN first-run disclosure appears before profile/network setup and distinguishes eligible trial, actual trial duration, scope, no card, no auto-charge, restarts, and post-trial EUR 149 price.
- Copy says an existing licence is respected and trial eligibility is checked rather than guaranteed.
- No onboarding surface advertises “Pro”, a permanent free offer, or a planned notification feed as currently available.
- Active, expired, exhausted, no-access, and lookup-error wording matches the state and does not obscure a valid restart or recovery path.
- Billing/offer/business current statements consistently show EUR 149; historical logs and archives retain their original values.
- Only existing design-system tokens/components are used; the onboarding remains navigable by keyboard and usable at narrow widths.

## ZOMBIES Coverage

- Zero: no entitlement, absent/failed lookup, unsupported offer.
- One: first-run eligible user and returning licensed user.
- Many: first, restarted, and exhausted trial cycles; French and English.
- Boundaries: exactly three 30-day cycles; payment only after the last cycle is exhausted.
- Interfaces: onboarding, signup nudge, billing panel, product gate, locales, current business contract.
- Exceptions: lookup unavailable, ineligible account/installation, unsupported device scope.
- Simple: copy-only; entitlement and checkout implementations remain untouched.

## Risks

- Incorrect eligibility wording could make a commercial promise; mitigate by saying access is checked and trial may be unavailable.
- Overlong disclosure could obscure onboarding; use concise paragraphs and keep setup action visible.
- Historical offer records may resemble current policy; update current sections only and retain dated history.
- Static copy inspection cannot prove rendered layout or actual entitlement grant behavior.

## Execution Notes

First-read: onboarding component and locales; signup nudge; billing panel and gate; active suite contract; project design tokens; GTM and single-price contract. Use Doppler for any later build or runtime. Do not start, publish, or deploy as part of this scope.

## Open Questions

None. The operator confirmed EUR 149 incl. VAT as the current price; trial scope and lifecycle are set by the active suite contract.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-09-29 | 100-sg-spec | GPT-6 Codex | Defined first-run trial and continued-access disclosure; reconciled scope to suite policy and operator-confirmed price | reviewed | Confirm readiness before implementation |
| 2026-09-29 | 101-sg-ready | GPT-6 Codex | Confirmed scope, authoritative terms, copy-only boundary, localization, recovery states, and a proportional proof path | ready | Implement the bilingual first-run and access copy |
| 2026-09-29 | 102-sg-experience | GPT-6 Codex | Updated bilingual onboarding, signup, billing, and recovery copy; no entitlement logic changed | implemented — unverified | Operator review of rendered states |
| 2026-09-29 | 103-sg-marketing | GPT-6 Codex | Restored first-person independent-maker voice and benefit-led one-time offer copy while keeping eligibility, price, and roadmap boundaries explicit | implemented — unverified | Operator review of rendered French and English copy |

## Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| Spec | done | Copy-only access clarity contract, authoritative lifecycle, and exact price captured. |
| Readiness | ready | Scope, truth, proof, localization, and preserved behavior are resolved. |
| Implementation | done | Bilingual access disclosures, benefit-led price framing, and first-person maker voice updated; entitlement logic unchanged. |
| Verification | pending | Operator will review rendered French and English states; tests, build, and visual checks were not run at the operator's request. |
| Ship | not authorized | No publication, commit, or deployment in scope. |
