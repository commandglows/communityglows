---
artifact: design_system_authority
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: "socialglowz"
created: "2026-06-12"
updated: "2026-08-03"
status: "reviewed"
source_skill: 001-sg-build
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
  - "The Vue desktop semantic tokens are declared in `src/ui/setup/pages/SocialGlowz/assets/main.css` and consumed by SocialGlowz-owned wrappers."
  - "The site has a separate Tailwind token carrier in `site/src/styles/global.css`; matching names do not prove a shared token pipeline."
  - "Reka UI is the maintained headless primitive layer for migrated desktop controls; SocialGlowz wrappers own visual composition."
next_review: "2026-07-12"
next_step: "/sf-docs update shipflow_data/technical/design-system-authority.md"
---

# SocialGlowz Design-System Authority

## Purpose

`socialglowz` has a Vue/Tauri runtime and a marketing site. The intended identity is shared, but the current token implementation is not generated from one cross-surface source. This document is the authority for that distinction: the Vue desktop semantic layer is canonical for the Windows application, while the site mapping remains a tracked convergence task rather than an assumed fact.

## Surface Carriers

- App/desktop extension runtime:
  - `src/ui/setup/pages/SocialGlowz/assets/main.css` (canonical semantic colors, surfaces, typography, spacing, radii, elevation, focus, motion, and theme values)
  - `src/assets/base.css` (legacy global base styles; it must consume, not redefine, desktop semantic intent)
  - `src/ui/setup/pages/SocialGlowz/components/ui/` (SocialGlowz wrappers: visual composition and token consumption)
  - `reka-ui` (maintained semantics, focus, keyboard, and overlay behavior for complex migrated controls)
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
  canonical_source: src/ui/setup/pages/SocialGlowz/assets/main.css
  governed_contract: /home/claude/socialglowz/shipflow_data/technical/design-system-authority.md
  component_bridge:
    interaction_owner: reka-ui for migrated complex controls
    visual_owner: src/ui/setup/pages/SocialGlowz/components/ui/
    forbidden: copied vendor implementations, provider theme overrides, arbitrary style/class escape hatches
  cross_surface_mapping:
    status: incomplete
    site_carrier: site/src/styles/global.css
    rule: no app/site token-parity claim without a generated source or a documented resolved-value mapping
  mandatory_scope:
    - color
    - typography
    - spacing
    - radius
    - shadows
    - motion
    - layout
  validation:
    - python3 "${SHIPGLOWS_ROOT:-$HOME/shipglows}/tools/design_system_drift_check.py" --changed --format markdown
    - keyboard proof: Tab/Shift+Tab, pattern arrows/Home/End, Escape, focus restoration, accessible names/states, visible focus in light and dark themes
  forbidden_bypass:
    - inline visual literals in production app/site screens and components
    - arbitrary Tailwind arbitrary values (ex. `max-w-[...]`, `min-h-[...]`, `rounded-[...]`)
    - ad-hoc `Color(...)`-style literals in component-local styles
    - one-off spacing/radius/shadow/font/motion additions without token path
```

## Governing Rule

For app or site visual changes:

1. add or reuse semantic values in `main.css`,
2. consume them through a SocialGlowz wrapper or component CSS variable,
3. use Reka UI for complex interactive patterns rather than copying a vendor implementation,
4. avoid new hardcoded visual values (colors, sizes, radii, spacing, shadows, motion timing) unless documented as a platform-bound exception.

## Stop Conditions

- Any direct, non-exception visual value added in components without a tokenized source.
- Divergent treatment of spacing/typography between app and site that changes visual hierarchy.
- New animation timing constants added directly in component markup/styles.
- A cross-surface parity claim based on parallel token files with no mapping or generated output.
- A custom dialog, menu, select, switch, splitter, tooltip, or composite control that replaces maintained keyboard/focus behavior without equivalent proof.

## Maintenance Rule

If a shared token pipeline is introduced (for example a JSON token source with generated Vue and Tailwind outputs), update this artifact before accepting a cross-surface parity claim. PrimeVue remains a temporary migration dependency until the active production import inventory reaches zero; it is not a visual authority for newly migrated Windows controls.
