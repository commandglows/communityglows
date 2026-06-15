---
artifact: design_system_authority
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "socialglowz"
created: "2026-06-12"
updated: "2026-06-12"
status: "draft"
source_skill: 300-sf-docs
scope: design-system-authority
owner: "Diane"
confidence: medium
risk_level: high
security_impact: none
docs_impact: yes
content_surfaces:
  - "socialglowz"
  - "socialglowz_site"
linked_systems:
  - "src/ui/setup/pages/SocialGlowz/assets/main.css"
  - "src/assets/base.css"
  - "site/src/styles/global.css"
  - "/home/claude/socialglowz/shipflow_data/business/branding.md"
depends_on:
  - artifact: "shipflow_data/business/branding.md"
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes: []
evidence:
  - "App UI tokens and semantic colors are declared in `src/ui/setup/pages/SocialGlowz/assets/main.css` and used via CSS variables."
  - "`src/assets/base.css` is the primary global surface for shared primitives and input styles."
  - "Site styles are centralized in `site/src/styles/global.css` via `@theme inline` token variables."
next_review: "2026-07-12"
next_step: "/sf-docs update shipflow_data/technical/design-system-authority.md"
---

# SocialGlowz Design-System Authority

## Purpose

`socialglowz` has a main Vue/Tauri/Firebase runtime and a marketing site (`socialglowz/site`). Both must share one design authority so no screen-level custom visual values are added ad-hoc.

## Surface Carriers

- App/desktop extension runtime:
  - `src/assets/base.css` (global UI shell, shared classes + base controls)
  - `src/ui/setup/pages/SocialGlowz/assets/main.css` (brand variables: primary/text/background/surface/border + dark-theme overrides)
  - `src/ui/setup/pages/SocialGlowz/style.css` (fallback app shell styles; should defer to variables)
- Site:
  - `site/src/styles/global.css` (`@theme inline` variables and shared animation/prose utility tokens)
- Brand contract:
  - `/home/claude/socialglowz/shipflow_data/business/branding.md`

## Declaration

```yaml
design_system_authority:
  status: declared
  brand_contract: /home/claude/socialglowz/shipflow_data/business/branding.md
  technology_carriers:
    - src/ui/setup/pages/SocialGlowz/assets/main.css
    - src/assets/base.css
    - site/src/styles/global.css
  canonical_source: /home/claude/socialglowz/shipflow_data/technical/design-system-authority.md
  mandatory_scope:
    - color
    - typography
    - spacing
    - radius
    - shadows
    - motion
    - layout
  validation:
    - python3 /home/claude/shipflow/tools/design_system_drift_check.py --root /home/claude/socialglowz/src --warn-only --format markdown
    - python3 /home/claude/shipflow/tools/design_system_drift_check.py --root /home/claude/socialglowz/site --warn-only --format markdown
  forbidden_bypass:
    - inline visual literals in production app/site screens and components
    - arbitrary Tailwind arbitrary values (ex. `max-w-[...]`, `min-h-[...]`, `rounded-[...]`)
    - ad-hoc `Color(...)`-style literals in component-local styles
    - one-off spacing/radius/shadow/font/motion additions without token path
```

## Governing Rule

For app or site visual changes:

1. add or reuse tokens in the declared carriers,
2. consume via variables / existing utility aliases,
3. avoid new hardcoded visual values (colors, sizes, radii, spacing, shadows, motion timing) unless documented as a temporary exception.

## Stop Conditions

- Any direct, non-exception visual value added in components without a tokenized source.
- Divergent treatment of spacing/typography between app and site that changes visual hierarchy.
- New animation timing constants added directly in component markup/styles.

## Maintenance Rule

If a shared token pipeline is introduced (e.g., json token file + generated outputs), update this artifact before accepting visual PRs.
