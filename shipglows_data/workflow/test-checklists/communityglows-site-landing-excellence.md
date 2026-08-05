---
artifact: manual_test_checklist
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "communityglows"
created: "2026-08-05"
updated: "2026-08-05"
status: reviewed
source_skill: "103-sg-verify"
scope: "site-landing-design-copy-and-locale-convergence"
owner: "Diane"
confidence: high
target_scope: "local Astro landing routes in English and French"
stack_profile: "Astro 6 + Tailwind CSS 4"
proof_profile: "build -> responsive browser -> interaction -> accessibility -> design drift"
risk_level: medium
security_impact: none
docs_impact: yes
depends_on:
  - "shipglows_data/workflow/specs/communityglows-site-landing-excellence.md"
supersedes: []
evidence:
  - "Playwright accessibility snapshots for desktop and mobile routes"
  - "Browser DOM, console, keyboard and reduced-motion checks"
  - "Astro production build and design-system drift checks"
next_step: "Operator visual review or separate ship authorization"
---

# CommunityGlows Site Landing Excellence Checklist

## Contract

- Environment: local Astro development server at 2026-08-05 source state.
- Routes: `/` and `/fr`.
- Viewports: desktop `1280 × 900`; mobile `390 × 844`.
- Status vocabulary: `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN`, `N/A`.

## Scenarios

| Scenario ID | Surface | Scenario | Required | Expected | Status | Observed | Evidence pointer | Notes | Bug Link |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LAND-EN-DESKTOP | English landing | Render and scan the shared landing at desktop width. | yes | Complete English narrative, coherent centered-card system, no mixed locale or console error. | PASS | English title, hero, section sequence, pricing, CTA and footer rendered; console reported 0 errors. | `communityglows-en-desktop.md`; browser console check | Local browser proof. | |
| LAND-FR-DESKTOP | French landing | Render and scan the shared landing at desktop width. | yes | Same component hierarchy in French with localized accessible names and no console error. | PASS | French title, hero, sections, pricing, CTA, footer and newsletter label rendered; console reported 0 errors. | `communityglows-fr-desktop.md`; browser console check | Local browser proof. | |
| LAND-EN-MOBILE | English landing | Render at `390 × 844` and operate the mobile menu. | yes | No horizontal overflow; menu exposes English navigation and correct open/close state. | PASS | `scrollWidth = clientWidth = 390`; menu label changed from `Open menu` to `Close menu`; `aria-expanded` became `true`. | `communityglows-en-mobile.md`; browser DOM check | Local browser proof. | |
| LAND-FR-MOBILE | French landing | Render at `390 × 844` and inspect localized controls. | yes | No horizontal overflow; long French copy fits; mobile and newsletter controls are localized. | PASS | `scrollWidth = clientWidth = 390`; hero and `Adresse e-mail` label rendered; mobile menu opened with French links. | `communityglows-fr-mobile.md`; browser DOM check | Local browser proof. | |
| LAND-MOTION-REDUCE | Motion | Emulate `prefers-reduced-motion: reduce`. | yes | Continuous and entrance motion stop while content remains visible and scrolling remains usable. | PASS | Media query matched; marquee animation was `none`; reveal transition was effectively disabled; scroll behavior was `auto`. | Playwright reduced-motion evaluation | All page content remained in the accessibility tree. | |
| LAND-KEYBOARD | Accessibility | Enter the page and pricing control with the keyboard. | yes | First focus target is the visible skip link; interactive controls have clear names and native keyboard activation. | PASS | First Tab focused `Skip to content` with browser outline; Enter activated the focused yearly billing button. | Playwright focus and key evaluation | Pricing buttons expose `aria-pressed`. | |
| LAND-MARQUEE | Platform strip | Inspect loop geometry and animation state. | yes | Two equal contiguous groups animate as one double-width track without page overflow. | PASS | Track `3584px`; groups `1792px + 1792px`; marquee animation active; page width remained `1280px`. | Browser geometry evaluation | Duplicate group is hidden from assistive technology. | |
| LAND-PRICING | Pricing | Toggle from monthly to yearly using Enter. | yes | Values and annual notes update; selected cycle is announced; plan contents stay unchanged. | PASS | Prices changed `€0/€9/€19` → `€0/€6/€15`; yearly notes became visible; pressed states changed to `false/true`. | Playwright pricing evaluation | Rounded monthly equivalents preserve stored annual totals. | |

## Automated Evidence

- Canonical token carrier check: `PASS`.
- Astro production build: `PASS` (15 static pages).
- Changed-file design-system drift scan: `PASS` (19 files, 0 findings at execution time).
- Whitespace/error diff check: `PASS`.
- Browser console: `PASS` (0 errors after a clean dev-server restart).

## Acceptance Gate

- All required scenarios are `PASS`.
- No production, preview deployment, commit, or push claim is included in this checklist.
- Overall local result: `PASS`.

## Execution Record

- Source state: uncommitted local working tree.
- Browser runtime: Playwright Chromium.
- Tester: GPT-5 Codex.
- Executed at: 2026-08-05 UTC.
- Overall result: `PASS`.
