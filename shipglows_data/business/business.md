---
artifact: business_profile
metadata_schema_version: "1.0"
artifact_version: "1.2.0"
project: communityglows
created: "2026-04-26"
status: reviewed
delivery_posture: development
source_skill: 300-sg-docs
scope: business
owner: "Diane"
updated: "2026-08-06"
confidence: medium
risk_level: medium
security_impact: low
docs_impact: high
depends_on: []
evidence:
  - "README.md"
  - "package.json"
  - "src/ui/setup/pages/CommunityGlows/App.vue"
supersedes: []
next_step: "/300-sg-docs audit shipglows_data/business/business.md"
---

# Business Context

## Business model

CommunityGlows is a unified social management platform with a cross-platform approach:

- Chrome and Firefox extensions
- Web application (Vercel-hosted)
- Tauri desktop app (Windows, macOS, Linux)
- Tauri mobile build targets (Android now, iOS planned)

This repository should be documented as an active product under continued development, not as a pure prototype or internal lab.

Core value:

- Manage and access multiple social networks from one interface.
- Preserve session continuity via controlled WebView + cookie/session persistence.
- Offer lightweight workflows for browsing, composing, and switching networks quickly.

## Target users

- Multi-account social media users
- Teams maintaining multiple community channels
- Professionals managing both personal and business profiles from one tool
- Mobile-first users needing consistent behavior across desktop and phone

## Monetization

- The current public offer is a **30-day trial**, then one-time purchase required to keep premium access. No perpetual free access and no legacy fallback path is maintained.
- A progressive 10 × €8 option was scoped separately and is not part of the active contract.
- Windows and Android are available now.
- Linux, macOS, and iPhone are planned for later, but development has not started and no release date is committed.
- Lightweight profile and preference sync is included. Login sessions remain local to each device.
- Le gestionnaire de tâches Kanban, inactive-page sleeping, and multiple tabs per network are in development, not shipped entitlements or dated guarantees.
- The price is intended to fund cross-platform compatibility, maintenance, and future platform releases rather than recurring cloud infrastructure.

## Key differentiation

- Single shared codebase reduces maintenance footprint versus separate native apps.
- Native WebView capabilities are better for session persistence and integration than web-only alternatives.
- Browser-extension continuity allows a smoother migration path between web, desktop, and browser workflows.

## Risks and constraints

- Native platform variance for social site behavior can shift quickly.
- Social platform policy changes can impact automation or cookie/session handling.
- iOS desktop/mobile expansion is not yet complete.

## Current priorities

1. Improve conversion from anonymous to authenticated users.
2. Reduce operational risk around cross-platform webview behavior.
3. Keep deployment and release paths simple for all five deployment surfaces.
