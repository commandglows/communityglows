---
artifact: design_system_authority
metadata_schema_version: "1.0"
artifact_version: "1.2.2"
project: "socialglowz"
created: "2026-06-12"
updated: "2026-08-04"
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
  - "src/ui/setup/pages/SocialGlowz/components/ui/"
  - "src/ui/setup/pages/SocialGlowz/directives/tooltip.ts"
  - "src/utils/notifications.ts"
  - "vite.tauri.config.ts"
  - "package.json"
  - "src/assets/base.css"
  - "site/src/styles/global.css"
  - "/home/claude/socialglowz/shipglows_data/business/branding.md"
depends_on:
  - artifact: "shipglows_data/business/branding.md"
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes: []
evidence:
  - "The Vue desktop semantic tokens are declared in `src/ui/setup/pages/SocialGlowz/assets/main.css` and consumed by SocialGlowz-owned wrappers."
  - "The site has a separate Tailwind token carrier in `site/src/styles/global.css`; matching names do not prove a shared token pipeline."
  - "Reka UI is the maintained headless primitive layer for migrated desktop controls; SocialGlowz wrappers own visual composition."
  - "The Windows source, generated declarations, and clean Tauri bundle contain zero PrimeVue runtime references; automated tests, core typecheck, lint, Tauri frontend build, and diff checks passed on 2026-08-03."
  - "Design token compliance is partial: latest scans report remaining hardcoded visual values in the active migration scope (last known count: 508 findings), plus documented protocol-only exceptions."
next_review: "2026-09-03"
next_step: "/sf-docs update shipglows_data/technical/design-system-authority.md"
---

# SocialGlowz Design-System Authority

## Purpose

`socialglowz` has a Vue/Tauri runtime and a marketing site. The intended identity is shared, but the current token implementation is not generated from one cross-surface source. This document is the authority for that distinction: the Vue desktop semantic layer is canonical for the Windows application, while the site mapping remains a tracked convergence task rather than an assumed fact.

## Surface Carriers

- Windows/Tauri app runtime:
  - `src/ui/setup/pages/SocialGlowz/assets/main.css` (canonical semantic colors, surfaces, typography, spacing, radii, elevation, focus, motion, and theme values)
  - `src/assets/base.css` (legacy global base styles; it must consume, not redefine, desktop semantic intent)
  - `src/ui/setup/pages/SocialGlowz/components/ui/` (SocialGlowz wrappers: visual composition and token consumption)
  - `reka-ui` (maintained semantics, focus, keyboard, and overlay behavior for complex migrated controls)
- Compatibility dependencies:
  - PrimeVue remains installed for historical extension entries and is not loaded by the Windows/Tauri entry.
  - PrimeIcons is still imported by the Windows/Tauri entry for icon compatibility; it does not provide component behavior or semantic token authority.
  - PrimeFlex remains installed for historical extension consumers but is no longer imported or consumed by the Windows/Tauri entry; equivalent sidebar alignment is owned locally without changing layout.
- Site:
  - `site/src/styles/global.css` (`@theme inline` variables and shared animation/prose utility tokens)
- Brand contract:
  - `/home/claude/socialglowz/shipglows_data/business/branding.md`

## Declaration

```yaml
design_system_authority:
  status: declared
  brand_contract: /home/claude/socialglowz/shipglows_data/business/branding.md
  technology_carriers:
    - src/ui/setup/pages/SocialGlowz/assets/main.css
  canonical_source: src/ui/setup/pages/SocialGlowz/assets/main.css
  governed_contract: /home/claude/socialglowz/shipglows_data/technical/design-system-authority.md
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
  current_compliance_state:
    status: partial
    note: hardcoded visual literals remain outside the canonical token source until a dedicated cleanup wave is completed.
  validation:
    - python3 "${SHIPGLOWS_ROOT:-$HOME/shipglows}/tools/design_system_drift_check.py" --changed --format markdown
    - keyboard proof: Tab/Shift+Tab, pattern arrows/Home/End, Escape, focus restoration, accessible names/states, visible focus in light and dark themes
    - pnpm test:once
    - pnpm run typecheck:core
    - pnpm run tauri:build
    - clean Windows source/generated declaration/bundle PrimeVue inventory
  forbidden_bypass:
    - inline visual literals in production app/site screens and components
    - arbitrary Tailwind arbitrary values (ex. `max-w-[...]`, `min-h-[...]`, `rounded-[...]`)
    - ad-hoc `Color(...)`-style literals in component-local styles
    - one-off spacing/radius/shadow/font/motion additions without token path
```

## Runtime Migration Status

- Windows/Tauri source inventory: zero PrimeVue runtime imports or bootstrap configuration.
- Generated Tauri declarations: zero PrimeVue components.
- Clean Tauri bundle: zero PrimeVue or `@primeuix` runtime markers.
- PrimeVue is not removed globally because historical extension entries still consume it. PrimeIcons remains a direct Windows compatibility dependency until its active icon consumers are migrated without visual regression. PrimeFlex has zero Windows entry imports and consumers.
- Automated proof passed: lint of the migration surface, `typecheck:core`, 107 tests, clean Tauri frontend build and `git diff --check`.
- Manual executable proof remains pending for Windows focus/keyboard behavior, notifications, themes, splitters, sidebars and native WebViews.

## Drift Evidence And Exceptions

The migration scans still report remaining visual hardcoded values outside the canonical token source in addition to protocol boundaries. Full compliance is therefore partial.

Accepted protocol boundaries remain:

- Seven responsive breakpoints inside `@media` conditions. CSS custom properties cannot be used as media-query condition values.
- Three `window.open` feature strings. Their dimensions are browser API protocol text, not rendered component design values.

Any additional non-protocol drift finding requires a semantic token path or a separately documented platform/protocol exception.

Latest known residual from the active migration scan is 508 findings; this document does not reclassify those as exceptions.
This result was originally confirmed in migration diff checks and does not mean the full runtime is zero-drift.
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

If a shared token pipeline is introduced (for example a JSON token source with generated Vue and Tailwind outputs), update this artifact before accepting a cross-surface parity claim. The Windows/Tauri inventory is already at zero PrimeVue component runtime and zero PrimeFlex usage; both packages remain available for legacy extension surfaces. PrimeIcons remains active in Windows and must not be removed until its consumer inventory reaches zero.
