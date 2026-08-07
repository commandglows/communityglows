---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: "communityglows"
created: "2026-08-06"
updated: "2026-08-06"
status: reviewed
source_skill: "006-sg-design"
scope: "site-secondary-marketing-pages-visual-coherence"
owner: "Diane"
confidence: high
user_story: "As a visitor moving between Features, Compare, Pricing, and Lifetime Deal in English or French, I want each page to feel recognizably part of the same calm CommunityGlows experience while retaining the hierarchy appropriate to its job."
risk_level: medium
security_impact: none
docs_impact: yes
linked_systems:
  - "site/src/pages/features.astro"
  - "site/src/pages/compare.astro"
  - "site/src/pages/pricing.astro"
  - "site/src/pages/lifetime-deal.astro"
  - "site/src/pages/fr/"
  - "site/src/components/features/FeaturesPage.astro"
depends_on:
  - artifact: "shipglows_data/technical/design-system-authority.md"
    artifact_version: "1.4.0"
    required_status: reviewed
supersedes: []
evidence:
  - "Browser and source audit found three competing card grammars across the newly bilingual secondary pages."
  - "The operator explicitly requested a final comparative visual pass."
next_step: "Await separate commit, push, or deployment authorization"
---

# CommunityGlows Secondary Pages Visual Coherence

## User Story

As a visitor moving between Features, Compare, Pricing, and Lifetime Deal in English or French, I want each page to feel recognizably part of the same calm CommunityGlows experience while retaining the hierarchy appropriate to its job.

## Success Behavior

- Secondary-page heroes share a clear typographic, spacing, eyebrow, and ambient-background grammar.
- Repeated card families use the landing’s large contained icon/marker, radius, border, and restrained hover treatment.
- Editorial, comparison, pricing, and offer sections remain distinguishable by information architecture rather than arbitrary styling.
- English and French pairs remain visually and structurally equivalent.
- Mobile layouts have no horizontal overflow; keyboard focus and reduced motion remain usable.

## Error Behavior

- Visual harmonization must not change prices, entitlements, checkout URLs, product claims, metadata, or route behavior.
- Continuous or entrance motion must not hide content under reduced motion.
- Dense comparison and pricing information must remain scannable rather than being forced into decorative cards.

## Scope

- In: visual hierarchy, section backgrounds, card/icon/marker grammar, spacing rhythm, hover/focus treatment, CTA composition, bilingual parity.
- Out: copy strategy changes, offer terms, pricing changes, new imagery, brand palette changes, commit/push/deploy.

## Implementation Tasks

- [x] Harmonize Features card icons, feature cards, rhythm steps, and closing CTA.
- [x] Harmonize Compare approach cards, principle markers, decision panel, and final CTA.
- [x] Harmonize Pricing plan emphasis, human bridge, lifetime offer, comparison table framing, FAQ, and final CTA.
- [x] Preserve the already coherent Lifetime Deal dashboard, workflow, offer, boundaries, FAQ, and final CTA sales hierarchy.
- [x] Apply equivalent treatment to French routes and prove desktop/mobile behavior.

## Acceptance Criteria

- [x] All eight routes build and render without console errors or horizontal overflow.
- [x] Changed-file design-system drift scan returns zero unexplained findings.
- [x] Prices, checkout destinations, plan features, structured metadata, language switching, and route count remain intact.
- [x] Reduced-motion mode keeps all content visible and reduces nonessential animation to an effectively immediate duration.

## Test Strategy

- Astro production build and `git diff --check`.
- Changed-file design-system drift scan.
- Browser inspection at desktop and mobile widths across all route pairs.
- Console, language-link, reduced-motion, pricing, and checkout-destination spot checks.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
| --- | --- | --- | --- | --- | --- |
| 2026-08-06 | 006-sg-design | GPT-5 Codex | Audited the four bilingual secondary-page families and formalized the visual-coherence contract. | ready | Implement and prove the bounded redesign. |
| 2026-08-06 | 102-sg-start | GPT-5 Codex | Harmonized hero labels, contained icon and marker treatments, card interaction, editorial panels, FAQ surfaces, and final CTA composition across the bilingual routes. | implemented | Run browser and design-system verification. |
| 2026-08-06 | 103-sg-verify | GPT-5 Codex | Verified all eight routes at mobile width, reduced motion, console state, route integrity, build output and changed-file design-system drift. | verified | Close locally without shipping. |

## Current Chantier Flow

- 006-sg-design: audit complete
- 100-sg-spec: completed
- 101-sg-ready: ready
- 102-sg-start: implemented
- 103-sg-verify: verified
- 005-sg-ship: not authorized
