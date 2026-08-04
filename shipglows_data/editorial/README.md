---
artifact: editorial_governance
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: socialglowz
created: "2026-06-11"
updated: "2026-06-11"
status: draft
source_skill: 300-300-sg-docs
scope: editorial_governance
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: medium
docs_impact: high
depends_on:
  - artifact: "shipglows_data/business/product.md"
    artifact_version: "1.0.1"
    required_status: reviewed
  - artifact: "shipglows_data/business/gtm.md"
    artifact_version: "1.0.1"
    required_status: reviewed
supersedes: []
evidence:
  - "shipglows_data/editorial/content-map.md"
  - "shipglows_data/business/product.md"
  - "shipglows_data/business/branding.md"
next_step: "/300-sg-docs technical"
next_review: "2026-09-11"
---

# Editorial Governance

This folder defines the public/content governance surface for SocialGlowz.

## Scope

- Public surfaces and claims are tracked here.
- Docs and pages must stay aligned with implementation truth in `README.md`, `shipglows_data/technical/context.md`, and `shipglows_data/workflow/specs/*`.
- Runtime content handled by Astro is governed by site schemas and should not receive incompatible frontmatter.

## Core contracts

- `shipglows_data/editorial/content-map.md` lists where content lives.
- `shipglows_data/editorial/public-surface-map.md` must define public surfaces and ownership.
- `shipglows_data/business/product.md` and `shipglows_data/business/branding.md` bound offer, audience, and tone.
- `shipglows_data/business/gtm.md` aligns user-facing promises and conversion framing.

## Maintenance

- Keep this layer synchronized when adding/changing public pages, claims, or landing content.
- Add or update `Editorial Update Plan` in `300-sf-docs` outputs when docs-impacting code changes are made.
- Avoid adding governance frontmatter to runtime Astro content unless it preserves runtime schema.
