---
artifact: design_system_authority
metadata_schema_version: "1.0"
artifact_version: "1.4.1"
project: "communityglows"
created: "2026-06-12"
updated: "2026-08-13"
status: "reviewed"
source_skill: 001-sg-build
scope: design-system-authority
owner: "Diane"
confidence: medium
risk_level: high
security_impact: none
docs_impact: yes
content_surfaces:
  - "communityglows"
  - "communityglows_site"
linked_systems:
  - "src/ui/setup/pages/CommunityGlows/assets/main.css"
  - "src/ui/setup/pages/CommunityGlows/components/ui/"
  - "src/ui/setup/pages/CommunityGlows/directives/tooltip.ts"
  - "src/utils/notifications.ts"
  - "vite.tauri.config.ts"
  - "package.json"
  - "src/assets/base.css"
  - "site/src/styles/global.css"
  - "/home/claude/communityglows/shipglows_data/business/branding.md"
depends_on:
  - artifact: "shipglows_data/business/branding.md"
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes: []
evidence:
  - "`design/tokens/reference.json` is the editable authority; the generator emits active Windows, site and Android carriers."
  - "`main.css` and `site/src/styles/global.css` compose layouts and compatibility aliases; they do not declare canonical visual values."
  - "Reka UI is the maintained headless primitive layer for migrated desktop controls; CommunityGlows wrappers own visual composition."
  - "The Windows source, generated declarations, and clean Tauri bundle contain zero PrimeVue runtime references; 109 tests, focused lint, Tauri frontend build, token validation and diff checks passed on 2026-08-04."
  - "Design token compliance is partial: the full scan on 2026-08-04 reports 160 candidates across legacy extension surfaces, un-migrated components and documented network-brand metadata."
next_review: "2026-09-03"
next_step: "/300-sg-docs update shipglows_data/technical/design-system-authority.md"
---

# CommunityGlows Design-System Authority

## Purpose

`communityglows` has a Vue/Tauri runtime and a marketing site. The public site's current dark-first language is the approved visual reference, while `design/tokens/reference.json` is the only editable cross-surface value authority. Generated Windows and site carriers are active; Windows and Android are converging on the canonical roles while preserving platform structure and interaction behavior.

## Surface Carriers

- Windows/Tauri app runtime:
  - `src/ui/setup/pages/CommunityGlows/assets/generated/tokens.css` (generated semantic colors, surfaces, typography, spacing, radii, elevation, focus and modes)
  - `src/ui/setup/pages/CommunityGlows/assets/main.css` (layout composition and compatibility aliases; not a value authority)
  - `src/assets/base.css` (legacy global base styles; it must consume, not redefine, desktop semantic intent)
  - `src/ui/setup/pages/CommunityGlows/components/ui/` (CommunityGlows wrappers: visual composition and token consumption)
  - `reka-ui` (maintained semantics, focus, keyboard, and overlay behavior for complex migrated controls)
- Compatibility dependencies:
  - PrimeVue remains installed for historical extension entries and is not loaded by the Windows/Tauri entry.
  - PrimeIcons is still imported by the Windows/Tauri entry for icon compatibility; it does not provide component behavior or semantic token authority.
  - PrimeFlex remains installed for historical extension consumers but is no longer imported or consumed by the Windows/Tauri entry; equivalent sidebar alignment is owned locally without changing layout.
- Site:
  - `site/src/styles/generated/tokens.css` (generated canonical roles and Tailwind mappings)
  - `site/src/styles/global.css` (component, animation and prose composition)
  - `site/src/components/ui/` (shared marketing UI atoms and reusable components)
- Brand contract:
  - `/home/claude/communityglows/shipglows_data/business/branding.md`

## Declaration

```yaml
design_system_authority:
  status: declared
  brand_contract: /home/claude/communityglows/shipglows_data/business/branding.md
  technology_carriers:
    - src/ui/setup/pages/CommunityGlows/assets/generated/tokens.css
    - site/src/styles/generated/tokens.css
    - site/src/components/ui/
    - src-tauri/plugins/android-webview/android/src/main/res/values/communityglows_tokens.xml
    - src-tauri/plugins/android-webview/android/src/main/res/values-night/communityglows_tokens.xml
  canonical_source: design/tokens/reference.json
  governed_contract: /home/claude/communityglows/shipglows_data/technical/design-system-authority.md
  component_bridge:
    interaction_owner: reka-ui for migrated complex controls
    visual_owner: src/ui/setup/pages/CommunityGlows/components/ui/
    forbidden: copied vendor implementations, provider theme overrides, arbitrary style/class escape hatches
  cross_surface_mapping:
    status: generated-and-consumed
    windows_carrier: src/ui/setup/pages/CommunityGlows/assets/generated/tokens.css
    site_carrier: site/src/styles/generated/tokens.css
    android_carrier: src-tauri/plugins/android-webview/android/src/main/res/values/communityglows_tokens.xml
    rule: generated carriers are active on every target; rendered Windows and Android proof is still required before a full parity claim.
  mandatory_scope:
    - color
    - typography
    - spacing
    - radius
    - shadows
    - motion
    - layout
  current_compliance_state:
    status: migration
    note: site-led semantic roles feed generated Windows/site/Android carriers; rendered and device proof remains required before parity is verified.
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

- Windows/Tauri and site load generated token carriers after legacy styles, preserving current resolved values while making canonical changes effective.
- `pnpm run design:tokens:check` is part of the quality workflow and generated headers are stable across supported Node versions.
- Android product chrome now consumes generated day/night color resources; remaining `Color.parseColor` values belong to the isolated social-network brand registry.

- Windows/Tauri source inventory: zero PrimeVue runtime imports or bootstrap configuration.
- Generated Tauri declarations: zero PrimeVue components.
- Clean Tauri bundle: zero PrimeVue or `@primeuix` runtime markers.
- PrimeVue is not removed globally because historical extension entries still consume it. PrimeIcons remains a direct Windows compatibility dependency until its active icon consumers are migrated without visual regression. PrimeFlex has zero Windows entry imports and consumers.
- Automated proof passed: token validation, focused lint of the migration surface, `typecheck:core`, 109 tests, clean Tauri frontend build and `git diff --check`.
- Manual executable proof remains pending for Windows focus/keyboard behavior, notifications, themes, splitters, sidebars and native WebViews.

## Drift Evidence And Exceptions

The migration scans still report remaining visual hardcoded values outside the canonical token source in addition to protocol boundaries. Full compliance is therefore partial.

Accepted protocol boundaries remain:

- Seven responsive breakpoints inside `@media` conditions. CSS custom properties cannot be used as media-query condition values.
- Three `window.open` feature strings. Their dimensions are browser API protocol text, not rendered component design values.
- The social-network brand registry. Its third-party brand colors and tile gradients are catalog metadata, not the CommunityGlows semantic UI palette.

Any additional non-protocol drift finding requires a semantic token path or a separately documented platform/protocol exception.

The full scan on 2026-08-04 reports 160 candidates. It does not reclassify every candidate as an exception and does not mean the runtime is zero-drift.
## Governing Rule

For app or site visual changes:

1. add or reuse semantic values in `design/tokens/reference.json`,
2. generate and verify the platform carriers before consuming the role through a wrapper or component CSS variable,
3. use Reka UI for complex interactive patterns rather than copying a vendor implementation,
4. avoid new hardcoded visual values (colors, sizes, radii, spacing, shadows, motion timing) unless documented as a platform-bound exception.

## Stop Conditions

- Any direct, non-exception visual value added in components without a tokenized source.
- Divergent treatment of spacing/typography between app and site that changes visual hierarchy.
- New animation timing constants added directly in component markup/styles.
- A cross-surface parity claim based on parallel token files with no mapping or generated output.
- A custom dialog, menu, select, switch, splitter, tooltip, or composite control that replaces maintained keyboard/focus behavior without equivalent proof.

## Maintenance Rule

When a token role, carrier or platform mapping changes, update this artifact before accepting a cross-surface parity claim. The Windows/Tauri inventory is already at zero PrimeVue component runtime and zero PrimeFlex usage; both packages remain available for legacy extension surfaces. PrimeIcons remains active in Windows and must not be removed until its consumer inventory reaches zero.

## User-controlled scaling

CommunityGlows keeps two independent accessibility preferences: `uiScale` scales the main application shell and product UI, while `textZoom` applies only to embedded social-network webviews. They use separate persisted and cloud-synced values so changing the app density never alters third-party content.
