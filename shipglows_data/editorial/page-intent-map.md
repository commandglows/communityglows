---
artifact: editorial_page_intent_map
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: communityglows
created: "2026-06-11"
updated: "2026-06-11"
status: draft
source_skill: 300-300-sg-docs
scope: editorial
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: medium
docs_impact: high
linked_systems:
  - "shipglows_data/editorial/content-map.md"
  - "shipglows_data/business/product.md"
  - "shipglows_data/business/branding.md"
  - "shipglows_data/business/gtm.md"
depends_on:
  - artifact: "shipglows_data/editorial/content-map.md"
    artifact_version: "1.1.0"
    required_status: reviewed
  - artifact: "shipglows_data/business/product.md"
    artifact_version: "1.0.1"
    required_status: reviewed
supersedes: []
evidence:
  - "Existing landing pages and site routing files"
  - "README.md"
next_step: "/300-sg-docs editorial"
next_review: "2026-09-11"
---

# Editorial Page Intent Map

## Purpose

Map public surfaces to editorial intent so content changes stay aligned with product behavior and governance.

## Surface intent matrix

- `README.md` → Onboarding and product truth index.
- `en/*` → Global landing and conversion surface for English-speaking users.
- `fr/*` → Localized landing and positioning (same offer assumptions, adapted language).
- `site/src/pages/` → Marketing, legal, and conversion routes that must match claims and proofs.
- `site/src/pages/blog/*` + `site/src/content/blog/*` → Long-form content, release notes, and educational posts.
- `site/src/components/*` → Shared public UI components; avoid hardcoded product promises.
- `CHANGELOG.md` → Public milestone summary; factual only.

## Editorial workflow

When intent changes:
- Update the owning artifact in `shipglows_data/editorial` first.
- Update implementation-linked docs if behavior changed (`shipglows_data/technical/context.md`, `shipglows_data/technical/code-docs-map.md`, related specs).
- Apply `Editorial Update Plan` and, if needed, `Claim Impact Plan` before publishing.

## Maintenance rule

Reconcile this map when adding/removing public surfaces or modifying claim boundaries in `branding`/`gtm` or `product` context.
