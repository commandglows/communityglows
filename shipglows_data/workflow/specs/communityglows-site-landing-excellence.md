---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: "communityglows"
created: "2026-08-05"
created_at: "2026-08-05 21:28:06 UTC"
updated: "2026-08-05"
updated_at: "2026-08-05 21:47:00 UTC"
status: reviewed
source_skill: 100-sg-spec
source_model: "GPT-5 Codex"
scope: "site-landing-design-copy-and-locale-convergence"
owner: "Diane"
confidence: high
user_story: "En tant que visiteuse de CommunityGlows, je veux comprendre rapidement la valeur du produit dans une landing calme, cohérente et équivalente en français et en anglais, afin de décider avec confiance si je souhaite commencer gratuitement."
risk_level: medium
security_impact: none
docs_impact: yes
linked_systems:
  - "site/src/pages/index.astro"
  - "site/src/pages/fr/index.astro"
  - "site/src/components/"
  - "site/src/i18n/"
  - "site/src/styles/generated/tokens.css"
  - "site/src/styles/global.css"
  - "design/tokens/reference.json"
depends_on:
  - artifact: "shipglows_data/business/branding.md"
    artifact_version: "1.1.0"
    required_status: active
  - artifact: "shipglows_data/technical/design-system-authority.md"
    artifact_version: "1.4.0"
    required_status: reviewed
  - artifact: "shipglows_data/workflow/specs/cross-platform-design-token-authority.md"
    artifact_version: "1.0.1"
    required_status: ready
supersedes: []
evidence:
  - "The English landing uses shared components while the French landing duplicates the full page inline, creating structural and copy drift."
  - "The current landing repeats profile isolation, network access, focus controls and synchronization across multiple sections."
  - "The site-wide design drift scan reports 69 candidates, including landing-local arbitrary dimensions, colors and motion values."
  - "The operator selected the centered large-icon card treatment and approved the reduced section flow."
next_step: "Await separate commit, push, or deployment authorization"
---

# CommunityGlows Site Landing Excellence

## Title

CommunityGlows Site Landing Excellence

## Status

Implemented and locally verified in excellence mode. Commit, push, preview and production deployment remain outside this chantier.

## User Story

En tant que visiteuse de CommunityGlows, je veux comprendre rapidement la valeur du produit dans une landing calme, cohérente et équivalente en français et en anglais, afin de décider avec confiance si je souhaite commencer gratuitement.

Primary actor: a creator, community manager, founder-operator, or small-team member evaluating CommunityGlows.

Trigger: the visitor opens `/` or `/fr` on desktop or mobile and scans from the hero to pricing and the final call to action.

Observable result: both locales present the same ordered narrative, card system, supported-platform proof, feature depth, pricing and CTA hierarchy without duplicate promises or placeholder social proof.

## Minimal Behavior Contract

The public landing renders one shared section structure in English and French, with localized copy supplied from the locale dictionaries and every section performing one distinct persuasive job. It preserves working navigation, pricing behavior, newsletter behavior, canonical metadata and reduced-motion support. If a locale key is missing, the build must fail rather than silently mix languages; the easy edge case is allowing the inline French page to drift while the shared English components continue changing.

## Success Behavior

- `/` and `/fr` render the same section order and component hierarchy.
- The hero states one outcome, gives one primary and one secondary action, and uses no fake avatars or unverified user-count claim.
- A platform strip follows the hero and loops without exposing an empty horizontal region.
- Problem cards and the merged solution/benefit cards use a coherent icon, spacing, alignment and motion treatment.
- The feature grid adds implementation depth without repeating the exact promises from the preceding section.
- The use-case section is labelled as use cases unless real attributable testimonials are supplied.
- Pricing behavior and plan contents remain unchanged except for locale correctness and visual consistency.
- Desktop, mobile and reduced-motion browser checks expose all content and preserve focus visibility.
- `npm run build` succeeds for all static routes.

## Error Behavior

- Missing translation keys, invalid component props or locale mismatches fail type/build validation.
- Animation initialization failure never hides content or prevents navigation.
- Reduced-motion mode disables continuous and entrance motion while keeping every section visible.
- Marquee content remains readable and does not create a blank scroll region at any supported viewport.
- No public user count, testimonial identity, network count, pricing promise or platform availability claim is strengthened without product evidence.

## Problem

The landing has a coherent dark visual base but lacks a single persuasive and component structure across locales. The English route uses shared components while the French route duplicates the page inline. Several consecutive sections repeat profile isolation, network switching, distraction control and sync. Card layouts, icon treatments and motion motifs vary, weakening rhythm. Landing components also contain design literals outside the declared token authority.

## Solution

Use one locale-aware landing composition for both routes. Keep the approved flow of hero, supported-platform proof, problem, merged centered-card solution, feature depth, use cases, pricing, final CTA, newsletter and footer. Route copy through `src/i18n`, preserve verified product claims, and migrate landing-local visual literals to existing or new canonical semantic tokens before consuming them through generated site roles.

## Scope In

- Share the landing component tree between `/` and `/fr`.
- Localize all shared landing components from typed translation data.
- Align section order, anchors, CTA destinations and pricing behavior across locales.
- Preserve the centered large-icon solution card direction.
- Remove duplicate benefit-section composition and redundant copy.
- Treat current testimonial-shaped cards honestly as use cases.
- Tokenize landing-local dimensions, colors and motion values through the canonical token source and generated site carrier.
- Validate desktop, mobile, keyboard focus, reduced motion, marquee continuity and static build.

## Scope Out

- Changing prices, plan entitlements, checkout behavior or payment providers.
- Inventing customer names, quotes, usage counts, ratings or performance metrics.
- Redesigning blog, legal, comparison, pricing-detail or application surfaces.
- Completing every pre-existing site-wide drift candidate outside landing consumption.
- Changing the CommunityGlows brand palette or introducing a new visual identity.
- Shipping, pushing or deploying without separate authorization.

## Constraints

- `design/tokens/reference.json` remains the only editable cross-surface value authority.
- `site/src/styles/generated/tokens.css` is generated and must not be edited manually.
- `site/src/styles/global.css` composes components and animation but must consume canonical roles.
- Preserve Astro static output, canonical URLs, hreflang, Open Graph and JSON-LD behavior.
- Preserve the app CTA destination through `src/config/site.ts`.
- Keep English and French aligned in meaning, not word-for-word syntax.
- Maintain WCAG-conscious contrast, focus visibility and reduced-motion behavior.
- Preserve unrelated dirty files.

## Test Contract

- `surface`: public Astro landing routes `/` and `/fr`.
- `proof_profile`: Astro static build + non-auth browser + accessibility and motion states.
- `proof_order`: canonical token check → static build → desktop/mobile browser proof → reduced-motion/focus proof → changed-file drift scan.
- `checklist_path`: `shipglows_data/workflow/test-checklists/communityglows-site-landing-excellence.md`.
- `required_scenario_ids`: `LAND-EN-DESKTOP`, `LAND-FR-DESKTOP`, `LAND-EN-MOBILE`, `LAND-FR-MOBILE`, `LAND-MOTION-REDUCE`, `LAND-KEYBOARD`, `LAND-MARQUEE`, `LAND-PRICING`.
- `required_results`: all scenarios pass; no browser console error; no mixed-locale content; no persistent marquee blank region; all content remains visible with reduced motion.
- `automated_proof`: `npm run build`, `git diff --check`, the repository canonical token check, and `python3 /home/claude/shipglows/tools/design_system_drift_check.py --changed --format markdown`.
- `browser_proof`: desktop and mobile snapshots of both locales, nav anchors, billing toggle, marquee continuity, focus traversal, console errors and reduced-motion content visibility.
- `exception_with_proof`: aesthetic preference remains operator-reviewable, but structural, responsive, locale and accessibility completion do not depend on manual inspection.

## Dependencies

- Existing Astro, Tailwind and i18n implementation; no new runtime dependency is required.
- Canonical branding and design-system authority listed in frontmatter.
- Existing cross-platform token generator and site carrier.
- Fresh external docs: not needed for the chosen architecture; no framework behavior change or new package is introduced.

## Invariants

- Pricing data, plan order and app destinations do not change.
- Public claims remain equal to or weaker than locally evidenced product contracts.
- Both locales use one component tree and one interaction implementation.
- Continuous motion respects `prefers-reduced-motion` and never gates content.
- Site components consume semantic roles rather than new one-off visual literals.
- Newsletter simulation is not represented as a production subscription guarantee.

## Links & Consequences

- Copy changes affect SEO-visible landing content and must preserve layout metadata.
- Component sharing removes the principal English/French drift source.
- Token changes affect generated site values and must remain compatible with the cross-platform authority chantier.
- Motion changes affect performance and accessibility; browser proof is required before completion.
- Pricing and product claims remain governed by product contracts outside this site.

## Documentation Coherence

- Update `site/AGENT.md` only if the English/French implementation architecture description becomes inaccurate.
- Update `site/CHANGELOG.md` only if the project uses it for unreleased public-site changes.
- Do not add ShipGlows metadata to Astro runtime content.
- Keep the design-system authority accurate if new semantic tokens or carrier responsibilities are introduced.

## Edge Cases

- Narrow mobile widths with long French headings and CTA labels.
- JavaScript disabled or animation initialization failure.
- `prefers-reduced-motion: reduce` with reveal containers that default to opacity zero.
- Marquee duplicated track width and viewport masks at ultrawide and mobile sizes.
- Pricing yearly toggle labels and annual notes in French.
- Missing optional feature visuals in translation-driven cards.
- Anchor navigation under the fixed floating navbar.

## Implementation Tasks

- [x] Task 1: Establish one typed locale contract for the landing.
  - Files: `site/src/i18n/en.ts`, `site/src/i18n/fr.ts`, `site/src/i18n/index.ts`
  - Action: align copy keys to the approved narrative and expose a shared locale type usable by components.
  - User story link: equivalent English/French understanding.
  - Depends on: none.
  - Validate with: Astro build and missing-key/type failures.

- [x] Task 2: Make shared landing components locale-aware.
  - Files: `site/src/components/Navbar.astro`, `Hero.astro`, `LogoMarquee.astro`, `ProblemSection.astro`, `SolutionSection.astro`, `BentoGrid.astro`, `Testimonials.astro`, `Pricing.astro`, `FinalCTA.astro`, `Newsletter.astro`, `Footer.astro`
  - Action: accept a locale or translation contract, remove hardcoded duplicate copy, and preserve behavior/anchors.
  - User story link: one coherent narrative in both languages.
  - Depends on: Task 1.
  - Validate with: Astro build and rendered route snapshots.

- [x] Task 3: Replace the inline French landing with the shared composition.
  - Files: `site/src/pages/index.astro`, `site/src/pages/fr/index.astro`, optional shared landing composition component.
  - Action: assemble the same section order for both locales while preserving localized metadata and hreflang.
  - User story link: structural parity.
  - Depends on: Task 2.
  - Validate with: route build and DOM/heading comparison.

- [x] Task 4: Migrate landing-local visual literals to canonical semantic tokens.
  - Files: `design/tokens/reference.json`, token generator outputs, landing components, `site/src/styles/global.css` only where composition is required.
  - Action: reuse or add named layout/motion/icon roles, regenerate carriers, and remove landing-local arbitrary values reported by the drift scan.
  - User story link: coherent, durable visual system.
  - Depends on: Tasks 2-3.
  - Validate with: token generation/check, changed-file drift scan and resolved rendering.

- [x] Task 5: Prove responsive, motion, navigation and pricing behavior.
  - Files: no production file unless an in-scope defect is found; evidence may be stored under `shipglows_data/workflow/verification/`.
  - Action: test desktop/mobile, English/French, reduced motion, marquee continuity, focus navigation, anchor links and billing toggle; repair in-scope failures.
  - User story link: confident evaluation on supported browsing states.
  - Depends on: Tasks 1-4.
  - Validate with: browser screenshots/snapshots, console check, build and drift scan.

## Acceptance Criteria

- [x] CA 1: Given either locale route, when the page renders, then the ordered section/component structure is equivalent and all visible copy uses the selected locale.
- [x] CA 2: Given the landing hero, when a visitor scans the first viewport, then the outcome and primary action are understandable without a feature list or placeholder social proof.
- [x] CA 3: Given the problem and solution sequence, when a visitor scrolls, then each section has one distinct job and the solution cards share one centered large-icon treatment.
- [x] CA 4: Given the feature grid, when compared with the solution cards, then it adds operational depth without duplicating their titles and descriptions.
- [x] CA 5: Given the use-case cards, when rendered, then they are not presented as attributable customer testimonials.
- [x] CA 6: Given mobile and desktop widths, when the marquee cycles, then no persistent empty horizontal region appears.
- [x] CA 7: Given reduced-motion preference or failed animation initialization, when the page loads, then all content remains visible and usable.
- [x] CA 8: Given keyboard navigation, when focus moves through nav, CTAs, billing and newsletter controls, then order, names and focus visibility remain clear.
- [x] CA 9: Given the unchanged pricing contract, when monthly/yearly controls are used, then amounts and localized notes update correctly without changing plan entitlements.
- [x] CA 10: Given the completed implementation, when validation runs, then the site build, token checks, changed-file drift scan and browser console checks pass with documented exceptions only.

## Test Strategy

- Build all Astro static routes.
- Compare English and French heading/landmark sequences from accessibility snapshots.
- Capture full-page desktop and mobile screenshots for both locales.
- Exercise navbar anchors, billing toggle and newsletter validation.
- Emulate reduced motion and verify reveal/marquee behavior.
- Run design-token drift scan before and after, classifying only protocol or inherited legacy exceptions.
- Check browser console and failed network requests relevant to the page.

## Risks

- Moving every component to translations can introduce missing-key or behavioral drift if props are weakly typed.
- Token remediation can accidentally widen scope into the existing cross-platform migration; this chantier must only add roles required by the landing.
- French copy is longer and may expose responsive issues not visible in English.
- Continuous marquee and reveal motion can harm accessibility or performance if content depends on animation state.
- Browser proof may require installing the repository-compatible Playwright browser runtime.
- Security impact: none, because this work changes static public presentation and local client behavior only; it adds no authentication, persistence, privileged action, secret or server-side input handling.

## Execution Notes

- Read first: `site/src/pages/index.astro`, `site/src/pages/fr/index.astro`, `site/src/i18n/*.ts`, `site/src/components/*.astro`, `design/tokens/reference.json`.
- Prefer one locale-aware component tree over synchronized duplicate route markup.
- Preserve component behavior while moving only copy/data ownership into the locale contract.
- Do not edit generated token files directly; regenerate from the canonical source.
- Do not fabricate proof, claims, testimonials or customer identities.
- Stop if pricing/product claims conflict with product contracts or a new visual direction is required.
- Validate with `npm run build`, the root design-token check discovered from `package.json`, `git diff --check`, the changed-file drift scan and non-auth browser proof for every required scenario.

## Open Questions

None. The operator selected continuation with the current approved direction; implementation details are discoverable from the repository.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-08-05 | 100-sg-spec | GPT-5 Codex | Formalized the landing excellence audit into an implementation and proof contract. | draft | Run readiness validation. |
| 2026-08-05 | 101-sg-ready | GPT-5 Codex | Reviewed user-story alignment, design authority, locale parity, scope, proof contract and adversarial failure states. | ready | Begin implementation. |
| 2026-08-05 | 102-sg-start | GPT-5 Codex | Implemented the shared bilingual landing, coherent card system, copy convergence, semantic tokens and accessible interactions using an evidence-first proof path. | implemented | Run excellence verification. |
| 2026-08-05 | 103-sg-verify | GPT-5 Codex | Ran standard gates and a fresh excellence pass across user comprehension, locale structure, duplication, responsive behavior, motion, keyboard access, marquee continuity and pricing. | excellent | Close the locally verified work without shipping. |
| 2026-08-05 | 104-sg-end | GPT-5 Codex | Reflected the architecture and public-site changes in project documentation and closed the locally proven scope. | closed | Await separate ship authorization. |

## Current Chantier Flow

- 100-sg-spec: completed
- 101-sg-ready: ready
- 102-sg-start: implemented
- 006-sg-design: implemented and proven
- 103-sg-verify: excellent
- 104-sg-end: closed locally
- 005-sg-ship: not authorized
