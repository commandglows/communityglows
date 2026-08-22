---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: communityglows
created: "2026-08-22"
updated: "2026-08-22"
status: ready
source_skill: sg-development
scope: trial-lifecycle-ux
owner: Diane
confidence: medium
risk_level: medium
security_impact: low
docs_impact: yes
user_story: "En tant qu'utilisatrice en période d'essai, je veux comprendre concrètement la valeur opérationnelle qui se mettra en pause à J-7, J-3 et J-1, afin de pouvoir conserver mon accès ou reporter ma décision sans surprise ni manipulation."
linked_systems:
  - src/composables/useTrialReminder.ts
  - src/ui/setup/pages/CommunityGlows/components/BillingAccessPanel.vue
  - src/ui/setup/pages/CommunityGlows/components/ProductAccessGate.vue
  - src/locales/fr.json
  - src/locales/en.json
depends_on:
  - artifact: shipglows_data/technical/context.md
    artifact_version: "1.1.1"
    required_status: reviewed
supersedes: []
evidence:
  - "The suite entitlement snapshot already exposes trusted trialStartedAt and trialEndsAt timestamps."
  - "The shared billing panel is rendered by desktop and mobile settings."
next_step: "Run the deferred focused tests, typecheck, token drift scan, and rendered desktop/mobile reminder smoke."
---

# CommunityGlows Trial Expiry Reminders

## Outcome

Surface one high-impact conversion reminder during the J-7, J-3 and J-1 windows of an active trusted trial. The reminder makes the loss of workflow convenience concrete, offers the confirmed one-time purchase, and lets the user postpone the decision for 24 hours without changing entitlement state or extending the trial.

## Behavior Contract

- Use only the trusted `trialStartedAt` and `trialEndsAt` snapshot fields.
- Show no reminder outside an active, valid, unexpired trial window.
- Select the nearest active milestone: J-1, otherwise J-3, otherwise J-7.
- Persist a 24-hour snooze locally for the exact trial cycle and milestone.
- A new trial cycle or a new milestone is not suppressed by stale state.
- Storage failure remains non-fatal and never changes product access.
- Keep French and English copy aligned in the shared desktop/mobile billing panel.
- Increase message intensity from J-7 to J-3 to J-1 while keeping the same factual product boundary.
- Show only evidenced benefits: unified network workspace, organized profiles with separated sessions, and faster cross-network navigation.
- State explicitly that user data remains safe; never imply deletion, irreversible loss, fake scarcity, or automatic billing.
- Offer the existing authenticated Stripe purchase path at the confirmed one-time price of €79 with no subscription.
- After expiry, recap the same evidenced value in the blocking gate while keeping data-safety, restart eligibility, export, support, purchase recovery and sign-out explicit.
- Include a sincere founder note about the long-term care invested in CommunityGlows, framed as gratitude and continued product commitment rather than guilt or purchase pressure.

## Scope

In scope: deterministic milestone logic, bounded local persistence, progressive conversion copy, a benefit-led shared billing UI, a value-led expired-access gate, the existing authenticated purchase CTA, translations, focused tests, and mapped technical documentation.

Out of scope: OS push notifications, email reminders, server-side scheduling, analytics, checkout or pricing changes, entitlement mutation, invented capabilities, coercive copy, and background execution while the application is closed.

## Experience Direction

- Critical moment: the user realizes that a calm, unified operating rhythm will pause when the trial ends.
- Desired emotion: strong anticipated regret followed by confidence that access can be preserved simply.
- Emotion to avoid: panic about data loss, shame, guilt, distrust, or pressure from false urgency.
- Visual hierarchy: countdown promise, truthful loss boundary, three evidenced benefit reminders, confirmed price, primary keep-access action, secondary postpone action.

## Proof Contract

Proof path: `exception-with-proof` because `#nolocal` forbids workload execution in this implementation run.

Deferred proof:

1. focused unit and component tests;
2. core typecheck;
3. changed-file design-token drift scan;
4. rendered desktop and mobile settings smoke at J-7, J-3, J-1, snoozed, expired, malformed-storage, and new-cycle states.

## ZOMBIES Coverage

- Zero: no access snapshot, inactive trial, or expired trial produces no reminder.
- One: J-1 selects the closest milestone and can be snoozed.
- Many: J-7 and J-3 transition without carrying suppression across milestones.
- Boundaries: exactly 7, 3 and 1 days; exact expiry; invalid timestamp order.
- Interfaces: trusted entitlement snapshot, local storage, shared billing panel, bilingual copy.
- Exceptions: unavailable or malformed storage is ignored without changing access.
- Simple: one stored record represents only the current cycle/milestone snooze.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-08-22 | sg-development | GPT-5 | Implemented milestone selection, cycle-scoped snooze, shared UI, translations and deferred tests under `#nolocal` | implemented — unverified | Run deferred proof contract |
| 2026-08-22 | sg-marketing | GPT-5 | Reframed the reminder around evidenced workflow loss, the confirmed one-time offer, and ethical urgency | implemented — unverified | Validate copy and conversion hierarchy in rendered context |
| 2026-08-22 | sg-design | GPT-5 | Upgraded the reminder to a benefit-led conversion card using canonical tokens and the existing checkout action | implemented — unverified | Run token drift, accessibility and rendered responsive proof |
| 2026-08-22 | sg-marketing | GPT-5 | Reframed the expired-access gate around recovered workflow value, the €79 lifetime offer and a sincere founder commitment without implying data loss | implemented — unverified | Validate tone and conversion comprehension with users |
| 2026-08-22 | sg-design | GPT-5 | Structured the expired-access gate with a value recap, prominent lifetime action, visible restart option and preserved recovery paths | implemented — unverified | Run accessibility and rendered responsive proof |

## Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| Spec and readiness | done | Bounded product contract and proof gaps are explicit. |
| Implementation | done | Static implementation and persuasive experience refinement completed under `#nolocal`. |
| Verification | pending | No tests, builds, lint, typecheck, server, browser or device workload was run. |
| Closure | pending | Forbidden until verification passes. |
| Ship | pending | No commit, push or release authorized in this posture. |
