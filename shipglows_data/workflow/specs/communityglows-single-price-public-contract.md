---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.5.0"
project: "communityglows"
created: "2026-08-06"
updated: "2026-08-06"
status: reviewed
source_skill: "009-sg-marketing"
scope: "site-single-price-and-feature-status-contract"
owner: "Diane"
confidence: high
user_story: "As a prospective buyer, I want to try the complete currently available product for 30 days without a payment card or automatic charge, then choose a clear one-time price, so I can evaluate CommunityGlows without interpreting an inaccurate subscription or roadmap promise."
risk_level: high
security_impact: none
docs_impact: yes
linked_systems:
  - "site/src/components/Pricing.astro"
  - "site/src/pages/pricing.astro"
  - "site/src/pages/fr/pricing.astro"
  - "site/src/pages/lifetime-deal.astro"
  - "site/src/pages/fr/lifetime-deal.astro"
  - "site/src/i18n/"
depends_on:
  - artifact: "shipglows_data/business/product.md"
    artifact_version: "1.0.2"
    required_status: reviewed
supersedes: []
evidence:
  - "Operator decision: one-time price only for now."
  - "Operator decision on 2026-08-06: replace the indefinite free version with a 30-day full trial requiring no payment card and no automatic charge, followed by an optional €79 lifetime purchase."
  - "Operator approved a future progressive 10 × €8 route with no debt commitment, retained payment progress, resumability, and lifetime conversion after ten successful payments; it remains non-public until implemented and verified."
  - "Operator confirmed community support and unspecified future cloud features do not exist."
  - "Code and active tasks support classifying contextual tasks, Android link intake, task context reopening, direct Windows profile creation, CRM/Kanban, inactive-page sleeping, and multiple tabs per network as in development. Global search, configurable notifications, advanced Focus mode, browser extensions, Windows link intake with profile choice, local inactivity locking, Linux, macOS, and iPhone remain planned later without a guaranteed date."
next_step: "Await separate commit, push, checkout-provider configuration, or deployment authorization"
---

# CommunityGlows Single Price Public Contract

## Success Behavior

- Every pricing surface presents a 30-day full trial without a payment card or automatic charge, followed by an optional founder license at €79 paid once.
- “Full trial” covers capabilities available now, never roadmap items.
- Available capabilities and work in progress are visually and semantically separated.
- Windows and Android availability, configurable Windows shortcuts, text sizing, instant preserved-page switching on Windows, local sessions, profiles/preferences sync, focus controls, custom links, and backup/restore are represented honestly.
- CRM/Kanban, contextual tasks, Android link intake, task context reopening, direct Windows profile creation, inactive-page sleeping, and multiple tabs per network are labelled in development without delivery-date guarantees.
- Global search, configurable notifications, advanced Focus mode, Chrome/Firefox extensions, Windows link intake with profile choice, local inactivity locking, Linux, macOS, and iPhone are labelled planned for later, explicitly not yet in development.
- Subscription, recurring automatic billing, community-support, future-cloud, and already-shipped Kanban claims disappear from current public sales surfaces.
- The progressive 10 × €8 option remains absent from public sales surfaces until checkout, entitlement, retry, stopping, resumption, refund, and lifetime-conversion behavior are implemented and verified.

## Error Behavior

- Price, checkout, entitlement, and JSON-LD must agree.
- Roadmap work must not be included as a guaranteed shipped entitlement.
- Local session behavior and lightweight sync boundaries must remain explicit.

## Tasks

- [x] Replace homepage pricing with one €79 lifetime card and roadmap distinction.
- [x] Replace standalone EN/FR pricing plans and subscription FAQ with the single-price contract.
- [x] Align Lifetime Deal EN/FR inclusions, boundaries, and metadata.
- [x] Correct Kanban status across landing, Features, offer, and blog copy.
- [x] Build, scan public copy, and verify both locales in browser.
- [x] Align EN/FR acquisition CTAs and pricing surfaces around the 30-day no-card trial plus optional €79 lifetime purchase.

## Acceptance Criteria

- [x] No stale subscription, trial, community-support, future-cloud, or shipped-Kanban sales claim remains.
- [x] Price and status are equivalent in EN/FR and JSON-LD.
- [x] Site build, browser console, checkout destinations, mobile layout, and design drift checks pass.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
| --- | --- | --- | --- | --- | --- |
| 2026-08-06 | 009-sg-marketing | GPT-5 Codex | Converted the operator’s price and feature-status decisions into one claim-safe implementation contract. | ready | Implement and prove. |
| 2026-08-06 | 102-sg-start | GPT-5 Codex | Implemented the single-price card, available/roadmap distinction, feature-status corrections, offer metadata, and governance alignment. | implemented | Verify public routes and stale claims. |
| 2026-08-06 | 103-sg-verify | GPT-5 Codex | Verified six affected EN/FR routes, €79/EUR schemas, checkout host, mobile overflow, console, build, stale-claim scan, and design-system drift. | verified | Close locally without shipping. |
| 2026-08-05 | 007-sg-content | GPT-5 Codex | Added truthful bilingual link-opening roadmap copy: Android is in development with profile choice; Chrome-to-Windows is planned later; the Astro build passed. | verified | Await separate commit, push, or deployment authorization. |
| 2026-08-06 | 009-sg-marketing | GPT-5 Codex | Expanded the bilingual pricing roadmap from verified tasks and backlog evidence, and scoped instant preserved-page switching to Windows because Android pooling remains unresolved. | verified | Await separate commit, push, or deployment authorization. |
| 2026-08-06 | 011-sg-pilotage | GPT-5 Codex | Recorded the approved progressive 10 × €8 no-debt payment path as a separate implementation task and kept it off the public offer until verified. | planned | Implement checkout and entitlement lifecycle later. |
| 2026-08-06 | 007-sg-content | GPT-5 Codex | Aligned bilingual acquisition, pricing, feature, comparison, blog, and lifetime-offer copy around the 30-day no-card trial and optional €79 lifetime purchase while keeping the unimplemented 10 × €8 route private. | verified | Await separate commit, push, or deployment authorization. |

## Current Chantier Flow

- 009-sg-marketing: decision captured
- 100-sg-spec: completed
- 101-sg-ready: ready
- 102-sg-start: implemented
- 103-sg-verify: verified
- 007-sg-content: verified
- 005-sg-ship: not authorized
