---
artifact: gtm_context
metadata_schema_version: "1.0"
artifact_version: "1.2.0"
project: "communityglows"
created: "2026-04-26"
updated: "2026-08-04"
status: reviewed
source_skill: manual
scope: gtm
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: low
docs_impact: yes
evidence:
  - "README.md and shipglows_data/workflow/TASKS.md describe current positioning, platforms, and roadmap."
  - "Build outputs in vite.* and src-tauri show concrete launch channels and packaging model."
  - "Feature set in src/ui and social network components demonstrates operational utility."
linked_artifacts:
  - shipglows_data/business/product.md
depends_on:
  - artifact: "shipglows_data/business/product.md"
    artifact_version: "1.0.1"
    required_status: reviewed
supersedes: []
next_review: "2026-09-03"
next_step: "/300-sg-docs audit shipglows_data/business/gtm.md"
target_segment: "independent operators, small marketing teams, and social operators managing multiple accounts across networks and devices"
offer: "a 30-day full trial without a payment card or automatic charge, followed by an optional €79 one-time founder license for a calm social operations workspace on Windows and Android; a progressive 10 × €8 path is approved but not public until implemented and verified"
channels: "developer and user documentation, landing pages, feature changelogs, social proof from update cadence, and onboarding walkthroughs"
proof_points: "shared multi-platform build pipeline, Convex-backed profile/session architecture, native webview support, and explicit roadmap visibility in shipglows_data/workflow/TASKS.md"
---

# GTM Context

## Target Segment

- Operators already active on several social channels who need faster switching and a consistent workflow.
- Teams running outreach, content production, and account operations in constrained teams.

## Offer

- CommunityGlows is positioned as a unified social operations workspace, not another fragmented extension or single-surface tool.
- The practical promise is consistency: one interface and one codebase behavior across browser extension, desktop, and web.
- The current commercial offer starts with a 30-day full trial without a card or automatic charge, followed by an optional one-time €79 payment. It is not a subscription and does not claim community support or unspecified future cloud services.
- A progressive 10 × €8 route is a planned commerce capability, not a current public option. It permits stopping without future charges, preserves paid-month progress, and converts to lifetime access after ten successful payments.
- Current features and roadmap work must be separated visibly on public sales pages.

## Positioning

- Not a replacement for full campaign planning platforms.
- Not a social analytics replacement suite.
- Not a standalone scheduler-only tool.
- It is a cross-platform execution layer for day-to-day social workflow.

## Channels

- Open documentation and public README as primary discovery surfaces.
- Product demos focused on profile switching, multi-network webviews, and setup flow.
- Landing and pricing pages in `en/` and `fr/` for conversion exploration.
- Community and founder-to-founder promotion around reliability and platform consistency.

## Conversion Path

- Discover intent through documentation and feature pages.
- Validate utility on one use case (profile switching + multi-platform access).
- Convert through clear usage outcome, visible release progress, and trust in privacy/state reliability.

## Proof Points

- Concrete build/release evidence by platform target in repo scripts.
- Multi-target architecture described in `shipglows_data/technical/architecture.md` and implemented in shared stores.
- Active roadmap transparency through `shipglows_data/workflow/TASKS.md`.

## KPIs (Initial)

- Activation of first-time users across at least one desktop/web target.
- Reduction in support/repeat questions about account/session behavior.
- Faster time to first successful workflow completion across at least two social networks.
