---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: "socialglowz"
created: "2026-08-04"
created_at: "2026-08-04 11:27:34 UTC"
updated: "2026-08-04"
updated_at: "2026-08-04 18:48:00 UTC"
status: ready
source_skill: 100-sg-spec
source_model: "GPT-5 Codex"
scope: "cross-platform-design-token-authority"
owner: "Diane"
confidence: high
user_story: "En tant qu'utilisatrice de SocialGlowz, je veux retrouver la meme identite visuelle et les memes roles d'interface sur Windows, Android et le site, afin de reconnaitre le produit sans subir de variations accidentelles entre plateformes."
risk_level: high
security_impact: none
docs_impact: yes
linked_systems:
  - "shipglows_data/business/branding.md"
  - "shipglows_data/technical/design-system-authority.md"
  - "src/ui/setup/pages/SocialGlowz/assets/main.css"
  - "src/ui/setup/pages/SocialGlowz/components/ui/"
  - "site/src/styles/global.css"
  - "src-tauri/plugins/android-webview/android/"
  - "package.json"
depends_on:
  - artifact: "shipglows_data/technical/design-system-authority.md"
    artifact_version: "1.3.0"
    required_status: reviewed
  - artifact: "shipglows_data/business/branding.md"
    artifact_version: "1.1.0"
    required_status: active
  - artifact: "shipglows_data/workflow/specs/windows-reka-ui-design-system-migration.md"
    artifact_version: "1.0.1"
    required_status: ready
supersedes: []
evidence:
  - "The reviewed authority declares `main.css` canonical for Windows but explicitly marks app/site mapping incomplete."
  - "The site maintains independent typography, color, radius, and motion values in `site/src/styles/global.css` and consumes no `--sg-*` tokens."
  - "Android is not currently represented in the design-system authority and has no generated color or dimension resource layer from SocialGlowz tokens."
  - "The Windows Reka migration establishes a sound behavior/visual ownership bridge but does not create cross-platform token authority."
  - "The 2026-08-04 drift scan reported 160 candidates across 237 files; the authority document still records an older 508-finding snapshot."
next_step: "/102-sg-start cross-platform-design-token-authority"
---

# Cross-Platform Design Token Authority

## Title

Cross-Platform Design Token Authority

## Status

Ready revision. This specification creates one semantic design-token authority and converges Windows/Tauri and Android on the visual language currently expressed by the public site.

## User Story

En tant qu'utilisatrice de SocialGlowz, je veux retrouver la meme identite visuelle et les memes roles d'interface sur Windows, Android et le site, afin de reconnaitre le produit sans subir de variations accidentelles entre plateformes.

Primary actor: a SocialGlowz user moving between the Windows application, Android application, and public site.

Trigger: the user opens or changes platform, switches light/dark mode, or encounters the same semantic role such as a primary action, raised surface, muted text, focus indicator, dialog, or navigation container.

Observable result: equivalent semantic roles resolve from one versioned source, intentional platform adaptations are named and tested, and generated platform outputs cannot drift silently.

## Minimal Behavior Contract

The repository accepts one versioned, machine-readable set of semantic design tokens whose dark roles reproduce the site's current visual language and whose light roles are explicit accessible adaptations. Generation produces carriers consumed by Vue/Tauri, Astro/Tailwind and Android native chrome. Missing roles, stale output, unsupported conversions or undocumented differences fail validation. The easy failure to miss is generating equivalent names while Windows or Android still resolve legacy values after the generated carrier.

## Problem

SocialGlowz has a declared Windows authority and a successful Reka UI component bridge, but not one cross-platform design authority. Windows uses `--sg-*` variables from `main.css`; the site maintains an independent Tailwind carrier and typography; Android hardcodes native visual values without shared resources. Parallel carriers make visual drift possible even when every surface locally uses tokens.

The current desktop token file also mixes semantic roles, legacy aliases, screen-specific values, and value-shaped token names. Convergence must therefore happen through stable semantic roles and bounded consumer waves, not through screen-local restyling.

## Solution

Use the repository-owned JSON source and deterministic generator to promote the site's visual roles into canonical semantic roles, emit platform-native carriers, and migrate Windows and Android consumers onto those roles. Preserve information architecture, interaction behavior and platform geometry while deliberately converging palette, typography, radius, elevation and motion.

## Product Decision

Before: the token pipeline preserves three different visual systems and therefore centralizes files without creating a recognizable shared identity.

After: the site's current visual language is the approved design reference, `design/tokens/reference.json` is the only editable value authority, and generated carriers apply that language to the site, Windows and Android with documented platform adaptations.

Preserved invariants:

- The current Windows and Android information architecture does not change; their visual treatment intentionally converges on the site.
- Reka UI continues to own maintained interaction behavior; SocialGlowz wrappers continue to own visual composition.
- The site's current dark visual treatment is the reference baseline and remains stable during convergence.
- Android WebView lifecycle, session behavior, native overlays, safe areas, and navigation behavior remain unchanged.
- Social-network brand colors remain data/brand assets and are not normalized into the product accent palette.

## Design-System Authority Contract

- Brand contract: `shipglows_data/business/branding.md`.
- Governed declaration: `shipglows_data/technical/design-system-authority.md`.
- Canonical machine-readable source: `design/tokens/` using versioned JSON token documents with stable semantic role names, aliases, light/dark modes, and platform adaptation metadata.
- Generator authority: `scripts/design-tokens/` with deterministic, repository-owned generation and validation commands.
- Vue/Tauri carrier: generated CSS custom properties imported before authored component/layout CSS.
- Site carrier: generated CSS variables mapped into Tailwind `@theme`; site components consume semantic utilities or variables rather than independent values.
- Android carrier: generated Android color and dimension resources plus a generated Kotlin bridge only where XML resources cannot satisfy the native plugin boundary.
- Component bridge: Reka UI owns complex interaction semantics; `components/ui/` owns product visuals and consumes generated semantic tokens.
- Layout authority: semantic layout/density tokens plus documented adaptive/platform constants; media-query syntax and measured native WebView bounds remain protocol/platform exceptions.
- Motion authority: named duration/easing/distance roles with reduced-motion behavior in each carrier.
- Forbidden bypasses: manually editing generated outputs; local visual literals; unregistered aliases; arbitrary Tailwind values; ad-hoc Android `Color.parseColor` or repeated density constants; provider themes that redefine semantic intent; unrestricted wrapper style/class escape hatches.

## Token Model

The canonical source must distinguish:

- reference tokens: raw palette, font families, numeric scales, durations and curves;
- semantic tokens: action, surface, text, border, focus, status, elevation, spacing, radius, typography, motion, density and layout roles;
- component tokens: aliases used by stable SocialGlowz primitives when a semantic role alone is insufficient;
- data-brand tokens: social-network logos and official network colors, isolated from product semantic colors;
- platform adaptations: explicit overrides with platform, semantic role, reason, expected resolved value and proof requirement.

Value-shaped legacy names such as tokens containing literal pixel/rem/color encodings may be supported temporarily through generated compatibility aliases, but new consumers may not use them. Every compatibility alias must name its semantic replacement or be scheduled for removal.

## Success Behavior

- One edit to a canonical semantic token deterministically updates all applicable platform outputs.
- `generate` is idempotent and produces no diff on a clean up-to-date repository.
- `check` fails on stale outputs, unresolved aliases, duplicate roles, invalid modes, undocumented platform differences, forbidden edits, or direct visual literals introduced in changed production files.
- Windows wrappers resolve the canonical site-led semantic roles while preserving interaction and layout behavior.
- The site remains the visual reference and consumes the same canonical roles it defines.
- Android native product chrome consumes generated resources; network-owned web content and official social-network colors remain outside product-theme normalization.
- Light and dark roles exist wherever the surface supports both modes; unsupported modes are declared rather than inferred.
- Focus, contrast, reduced motion, touch-target and keyboard behavior remain valid after carrier replacement.

## Error Behavior

- Generation exits non-zero and writes no partial outputs when source validation fails.
- CI rejects hand-edited generated files and reports the canonical source path that must change.
- Missing platform mappings cannot fall back to arbitrary defaults.
- An intentional platform divergence without adaptation metadata fails resolved-value comparison.
- A conversion incapable of representing a canonical value exactly stops that migration slice; it does not approximate silently.
- A generated Android resource collision or invalid resource name fails before Gradle compilation.

## Scope In

- Establish the canonical JSON token schema, source files, adaptation registry, generator and deterministic check.
- Generate and integrate Vue/Tauri CSS, site CSS/Tailwind mappings, and Android resources.
- Inventory current resolved values by semantic role before changing carriers.
- Capture current rendering as before-proof, then document and verify the intentional convergence differences.
- Separate network brand/data colors from SocialGlowz product-theme colors.
- Introduce compatibility aliases for active legacy desktop token names with measurable retirement rules.
- Move active Android native product chrome away from ad-hoc colors/dimensions into generated resources.
- Update authority documentation, README architecture statements, CI checks, and contributor guidance.
- Provide visual, resolved-value, accessibility and build proof for light/dark modes and representative surfaces.

## Scope Out

- Redesigning navigation, information architecture, feature composition, or third-party WebView content.
- Forcing identical layout density where platform conventions require an explicit adaptation.
- Restyling third-party social-network pages rendered inside WebViews.
- Replacing Reka UI, Vue, Tauri, Astro, Tailwind, or Android WebView architecture.
- Removing historical extension dependencies unless their active visual values are migrated in a separately bounded slice.
- Rationalizing every legacy token name in the same commit as source centralization.

## Constraints

- Visual convergence is intentional for palette, typography, radius, elevation and motion; layout geometry, navigation, safe areas and information architecture remain unchanged unless a named platform adaptation requires it.
- Dark semantic roles match the site reference. Light roles are explicit accessibility-preserving adaptations, not independent platform palettes.
- Canonical token generation must run locally and in CI without network access, hosted services, secrets, or user data.
- Use the existing Node 24, TypeScript/`tsx`, pnpm, Vue, Tailwind, Tauri and Android toolchains; do not add a token SaaS or provider lock-in.
- Generated outputs are committed build inputs and carry a non-editable header; contributors change canonical JSON only.
- Existing Windows compatibility aliases remain until source inventory and visual proof show that removal is safe.
- Android resource identifiers must remain valid, stable and collision-free across day/night resources.
- Official network colors, protocol strings, responsive media-query conditions, measured WebView bounds and platform safe-area APIs require classification rather than blind semantic normalization.
- Unrelated worktree changes must be preserved.

## Dependencies

- Local runtime/build stack: Node `>=24 <25`, pnpm 8.11, TypeScript 5.9, `tsx` 4.22, Vue 3.5, Tailwind 4.3, Tauri 2.10 and the existing Android Gradle project.
- Design intent: `shipglows_data/business/branding.md`.
- Current governed state: `shipglows_data/technical/design-system-authority.md`.
- Component behavior bridge: installed `reka-ui` 2.10 and SocialGlowz wrappers.
- Existing platform builds: `pnpm run tauri:build`, the site build command resolved from `site/package.json`, and the current Android workflow/build command.
- Fresh-docs verdict: implementation must consult current official Tailwind v4 theme-variable and Android resource documentation before emitting those carriers; no external API behavior is required to approve the architecture itself.

## Invariants

- One semantic role has one canonical identity even when a documented platform adaptation changes its resolved value.
- Generated carriers never become editable authorities.
- A platform may adapt a role but may not invent an unregistered equivalent role locally.
- Reka UI continues to own interaction semantics and focus behavior; token generation cannot replace or fork those behaviors.
- Third-party WebView content and official social-network identity remain outside SocialGlowz product-theme control.
- Existing light/dark support cannot regress, and an unsupported mode must be declared explicitly.
- Generation failure leaves all previously committed/generated outputs intact.
- No secrets, user content, cookies, session data or private URLs enter token sources, snapshots, diagnostics or generated files.

## Links & Consequences

- Upstream authority: branding establishes calm, efficient and trustworthy visual intent; the technical authority translates it into enforceable roles.
- Downstream consumers: Windows/Tauri CSS and wrappers, site Tailwind utilities/components, Android native chrome, tests, builds, CI and diagnostics.
- Extension consequence: historical extension surfaces remain outside the first carrier migration unless they import shared generated roles; they must not silently redefine those roles.
- Accessibility consequence: resolved colors, focus rings, reduced motion, typography and target sizes require proof after each carrier switch.
- Performance consequence: generation occurs at development/build time; runtime receives static CSS/XML/Kotlin outputs with no token service or fetch.
- Release consequence: each carrier remains independently releasable and rollback-capable during migration.
- Public-claim consequence: no cross-platform visual-parity claim is permitted until generated consumption and resolved-value proof pass for all declared surfaces.

## Architecture

Proposed repository shape:

```text
design/tokens/
  schema.json
  reference.json
  semantic.json
  components.json
  network-brands.json
  adaptations.json
scripts/design-tokens/
  generate.ts
  validate.ts
  resolved-values.ts
src/ui/setup/pages/SocialGlowz/assets/generated/tokens.css
site/src/styles/generated/tokens.css
src-tauri/plugins/android-webview/android/src/main/res/values/socialglowz_tokens.xml
src-tauri/plugins/android-webview/android/src/main/res/values-night/socialglowz_tokens.xml
```

Generated files include a warning header and canonical source version. Authored files import or alias generated roles but do not redefine their values. The generator uses repository tooling and does not require a hosted service or runtime network access.

## Implementation Tasks

- [ ] Task 1: Capture the resolved-value baseline and classify ownership.
  - Files: current Windows, site and Android carriers; `design/tokens/` inventory artifact.
  - Action: map color, typography, spacing, radius, shadow, motion, focus, density and layout roles; distinguish product, network-brand, protocol and platform values.
  - Validate with: machine-readable baseline snapshots and a reviewed list of intentional platform differences.

- [ ] Task 2: Create the canonical schema and semantic source.
  - Files: `design/tokens/schema.json`, reference/semantic/component/network/adaptation JSON documents.
  - Action: encode site-led canonical roles, stable aliases, light/dark modes, deprecation metadata and named platform adaptations.
  - Validate with: schema tests for valid aliases, cycles, required modes, unique names and adaptation reasons.

- [ ] Task 3: Build deterministic generation and validation.
  - Files: `scripts/design-tokens/`, `package.json`, focused tests.
  - Action: generate CSS and Android outputs atomically; add `design:tokens:generate` and `design:tokens:check`; compare committed output and resolved baselines.
  - Validate with: idempotence, stale-output failure, invalid-source fixtures, no-partial-write tests and `git diff --check`.

- [ ] Task 4: Converge Windows/Tauri on the site-led generated roles without changing structure or interaction behavior.
  - Files: generated Vue CSS, `main.css`, `base.css`, `components/ui/`, active SocialGlowz screens.
  - Action: import generated tokens, convert authored canonical declarations to consumption/compatibility aliases, and remove active non-exception literals in bounded slices.
  - Validate with: before/after resolved-value comparison, drift check, light/dark screenshots, wrapper keyboard/focus proof, tests and Tauri frontend build.

- [ ] Task 5: Make the site consume canonical roles without changing its approved reference rendering.
  - Files: generated site CSS, `site/src/styles/global.css`, site components and build config.
  - Action: map Tailwind theme variables to generated semantic roles, retain documented site adaptations and remove parallel ungoverned definitions.
  - Validate with: resolved-value comparison, desktop/mobile visual proof for representative public pages, reduced-motion proof and site build.

- [ ] Task 6: Bring Android native chrome under the authority.
  - Files: generated `values`/`values-night` resources, native plugin Kotlin, Android resource tests/build config.
  - Action: replace product-owned hardcoded colors, radii, spacing and dimensions with generated resources or the generated Kotlin bridge; retain official network colors and protocol values in their classified registry.
  - Validate with: resource compilation, Android build, light/dark screenshots, touch-target/safe-area checks and native overlay/WebView regression scenarios.

- [ ] Task 7: Enforce authority in CI and contributor workflows.
  - Files: GitHub workflows, package scripts, drift-check configuration and documentation.
  - Action: run token generation check and changed-file drift validation on relevant changes; expose actionable failures without requiring operator diagnosis.
  - Validate with: deliberately stale generated output and forbidden-literal fixtures that fail CI locally.

- [ ] Task 8: Update governance and retire compatibility debt in waves.
  - Files: design-system authority, branding links, README, compatibility alias registry and follow-up specs where needed.
  - Action: declare the new canonical source and all carriers, update current drift evidence, remove stale dependency claims, and schedule legacy alias removal separately from baseline migration.
  - Validate with: metadata lint, documentation link checks and zero contradictory authority statements.

## Acceptance Criteria

- [ ] `design/tokens/` is the only editable source of shared semantic token values.
- [ ] Vue/Tauri, site and Android outputs are generated deterministically from that source.
- [ ] A clean `design:tokens:check` proves generated outputs are current and aliases are valid.
- [ ] Site dark semantic roles are the canonical visual reference and resolve equivalently on Windows and Android native chrome.
- [ ] Light roles are explicit, contrast-safe adaptations derived from the same semantic hierarchy.
- [ ] Windows and site no longer maintain competing definitions for shared semantic roles.
- [ ] Android product-owned native chrome no longer uses unexplained local color/dimension literals.
- [ ] Official social-network colors are classified as data-brand tokens rather than incorrectly normalized.
- [ ] Light/dark, focus, contrast, reduced-motion and platform target-size requirements pass on supported surfaces.
- [ ] Representative visual proofs exist for Windows, site desktop/mobile, and Android.
- [ ] Changed-file drift checks contain only named protocol/platform exceptions.
- [ ] The design-system authority document names Android and all generated carriers and contains current evidence.
- [ ] No navigation, information-architecture, WebView lifecycle, safe-area or interaction-behavior change is introduced by visual convergence.

## Edge Cases

- A semantic alias points to itself or forms a multi-file cycle.
- Day/night Android resources omit a role that exists in CSS dark mode.
- CSS supports a value expression that Android XML cannot represent exactly.
- Two token names normalize to the same Android resource identifier.
- A generated file is edited manually while canonical JSON remains unchanged.
- A platform carrier is regenerated with a newer schema while another carrier remains stale.
- A site-only font has no installed/native Android equivalent; the difference must remain an explicit typography adaptation.
- A social-network brand color matches a product semantic color by value but not by ownership.
- A media-query breakpoint or native measured dimension is incorrectly treated as a freely reusable visual token.
- Generation is interrupted between validation and output replacement.
- Reduced-motion mode changes animation duration while resolved-value snapshots compare the normal mode.

## Test Contract

- Surface: Windows/Tauri application, Astro/Tailwind public site, Android native SocialGlowz chrome, and the canonical generator/CI path.
- Proof profile: site-led cross-platform visual convergence, accessibility preservation and deterministic build output.
- Proof order: source/schema validation -> generator unit tests -> idempotence/stale-output checks -> resolved-value comparisons -> platform builds -> automated accessibility checks -> representative visual/manual scenarios.
- Checklist path: create bounded evidence under `shipglows_data/workflow/test-checklists/cross-platform-design-token-authority/` during implementation; do not store generated screenshots in the spec.
- Required scenario IDs: `TOK-GEN-001` through `TOK-GEN-005`, `TOK-WIN-101`, `TOK-SITE-201`, `TOK-ANDROID-301`, `TOK-A11Y-401`, and `TOK-ROLLBACK-501`.
- Required results: every automated scenario passes; representative before/after resolved values match or reference an approved adaptation; platform builds pass; visual proof shows no unintended redesign.
- Exception policy: `exception_with_proof` only for named protocol/platform boundaries with reason and evidence; `exception_without_proof` is not accepted for closure.

Automated proof:

- token schema and alias-cycle tests;
- deterministic generation and no-partial-write tests;
- generated-output freshness check;
- resolved-value snapshots per platform and mode;
- `python3 "${SHIPGLOWS_ROOT:-$HOME/shipglows}/tools/design_system_drift_check.py" --changed --format markdown`;
- existing unit tests, core typecheck and lint;
- Tauri frontend build, site build and Android resource/build checks;
- source inventories for forbidden local values and hand-edited generated files.

Manual/visual proof:

- representative Windows shell, dialog, settings, CRM and sidebar states in light/dark mode;
- representative site home, feature and pricing states at desktop/mobile widths;
- Android native top/bottom chrome, menus, overlays and network host transitions in light/dark mode;
- keyboard focus and restoration for Reka composites;
- reduced-motion behavior and minimum contrast/target-size checks.

Visual equality is evaluated by semantic role and approved baseline, not by requiring platform layouts to be pixel-identical.

## Test Strategy

- `TOK-GEN-001`: valid canonical documents generate every carrier deterministically.
- `TOK-GEN-002`: alias cycles, missing roles, duplicate normalized Android names and invalid adaptations fail before writes.
- `TOK-GEN-003`: a second generation produces no repository diff.
- `TOK-GEN-004`: a manually changed generated output makes the freshness check fail with an actionable canonical token path.
- `TOK-GEN-005`: simulated write interruption preserves the previous complete output set.
- `TOK-WIN-101`: Windows light/dark resolved roles and representative screenshots match baseline; Reka keyboard/focus behavior still passes.
- `TOK-SITE-201`: site desktop/mobile resolved roles and representative pages match baseline, including typography and reduced motion.
- `TOK-ANDROID-301`: Android day/night resources compile and native chrome/WebView transitions match baseline with safe targets and insets.
- `TOK-A11Y-401`: action, text, border, focus and status roles meet declared contrast/focus requirements on every supported mode.
- `TOK-ROLLBACK-501`: one carrier can return to its prior committed file without corrupting canonical source or other generated carriers.

## Diagnostics And Observability

- Preserve the existing application diagnostics/copy-log surface.
- Token-generation failures report source file, token path, platform and failure type without dumping user or secret data.
- Runtime diagnostics include token schema/source version and generated carrier version after migration.
- Copied diagnostics continue to begin with commit/build identity and Paris/UTC build timestamps.
- No new Sentry collection is required for the static marketing site while it remains within the documented static-site exception; Windows/Android runtime error reporting remains unchanged.

## Risks

- Risk: an architectural migration accidentally redesigns a surface. Mitigation: baseline resolved-value snapshots and visual proof before any convergence changes.
- Risk: generated files become another manually edited authority. Mitigation: generated headers, deterministic checks and CI stale-output rejection.
- Risk: semantic names merely wrap legacy value-shaped tokens. Mitigation: consumer rules, deprecation metadata and bounded retirement waves.
- Risk: Android resource conversion breaks native overlays or dark mode. Mitigation: generated day/night resources, resource compilation and native regression scenarios.
- Risk: official network colors are mistaken for product colors. Mitigation: separate data-brand registry and explicit ownership classification.
- Risk: platform adaptation becomes a loophole for drift. Mitigation: every override requires role, reason, resolved value and proof.
- Risk: one large migration blocks releases. Mitigation: carrier-by-carrier slices that remain buildable and preserve compatibility aliases until proven removal.

## Documentation Impact

- Update `shipglows_data/technical/design-system-authority.md` when the generated source becomes authoritative.
- Keep `shipglows_data/business/branding.md` as visual-intent authority, not a value carrier.
- Update README architecture and dependency statements after each carrier is actually migrated.
- Record generated-file and token-change instructions for contributors.
- Replace stale drift counts with reproducible command evidence rather than permanent snapshots.

## Documentation Coherence

- The technical authority must change from a Windows canonical carrier to the JSON semantic source only after generation and at least one carrier integration are proven.
- Branding remains the intent contract and must not duplicate token values.
- README statements must describe only carriers that are actually generated and consumed at that commit.
- The completed Reka migration spec remains the interaction/component migration record and is not rewritten as if it had delivered cross-platform token authority.
- Contributor instructions must distinguish editable sources, generated outputs, platform adaptations, network-brand data and protocol exceptions.

## Rollout And Rollback

1. Commit baseline inventory and generator without switching consumers.
2. Switch Windows to generated output while compatibility aliases preserve current names.
3. Switch the site and prove its existing rendering.
4. Switch Android native chrome and prove day/night resources.
5. Enable blocking CI only after all active carriers have deterministic generation.
6. Retire legacy aliases in later bounded waves.

Each carrier can roll back to its previous committed token file while the canonical source and other migrated carriers remain intact. Generated outputs must never be partially promoted.

## Execution Notes

Read in this order: branding contract, current design-system authority, this spec, existing Windows tokens/wrappers, site global theme, Android native resource/plugin code, package scripts and CI workflows.

Implementation order is mandatory: baseline inventory, schema/source, generator/checks, Windows carrier, site carrier, Android carrier, CI enforcement, then governance cleanup. Do not begin consumer rewrites before the baseline and generator tests exist.

Primary validation commands after the corresponding scripts exist:

```bash
pnpm run design:tokens:generate
pnpm run design:tokens:check
pnpm test:once
pnpm run typecheck:core
pnpm run lint:check
pnpm run tauri:build
python3 "${SHIPGLOWS_ROOT:-$HOME/shipglows}/tools/design_system_drift_check.py" --changed --format markdown
```

Also run the site build and Android build/resource compilation through their existing repository commands/workflows. Stop a slice when canonical values cannot be represented exactly, generation is non-deterministic, a platform build fails, visual evidence is missing, accessibility regresses, or a new local visual literal lacks an approved exception. Do not solve those failures by weakening the checker or broadening adaptation metadata.

## Security Impact

Security impact is none because the source and generator contain public visual constants and execute only at development/build time. They do not process runtime user input, authentication state, cookies, tokens, private URLs or secrets. Generated-file paths are fixed by the repository; the generator must reject path traversal or arbitrary output paths if configuration becomes data-driven.

## Open Questions

None. The site-led direction, source format, platform footprint, dark-reference/light-adaptation policy, ownership boundaries, rollout order and proof requirements are fixed by this contract.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-08-04 11:27:34 UTC | 100-sg-spec | GPT-5 Codex | Created the durable cross-platform semantic token authority and generated-carrier migration contract from the current Windows/site/Android audit. | draft | Review readiness, then implement the resolved-value baseline and generator foundation. |
| 2026-08-04 11:51:07 UTC | 101-sg-ready | GPT-5 Codex | Completed structural, adversarial, security, documentation, execution and proof review; added explicit constraints, invariants, edge cases, test scenarios and rollback rules. | ready | Implement the baseline inventory and deterministic generator foundation. |
| 2026-08-04 12:15:00 UTC | 102-sg-start | GPT-5 Codex | Added deterministic cross-platform design token authority source (`design/tokens`), generator/check commands, generated Windows/site/Android outputs, and first-wave wiring in Windows/Site entrypoints plus new scripts. | implemented | Run `103-sg-verify` for end-to-end proof and platform parity evidence. |
| 2026-08-04 12:28:00 UTC | 103-sg-verify | GPT-5 Codex | Standard verification found deterministic generation and static builds, but generated carriers are not yet the effective authority in Windows/site, Android native chrome does not consume generated resources, and conversion errors are silently skipped. | partial | Complete the carrier migration and enforce the token checks in CI, then rerun cross-platform visual and Android proof. |
| 2026-08-04 13:00:00 UTC | 102-sg-start | GPT-5 Codex | Made generated Windows/site carriers effective without changing baseline values, stabilized generated headers across Node versions, added freshness checking to CI, and cleared changed-file drift. Android native consumption remains deferred to its dedicated slice. | partial | Migrate Android native chrome to generated resources, harden conversion failure handling, then rerun cross-platform proof. |
| 2026-08-04 18:38:00 UTC | 006-sg-design | GPT-5 Codex | Accepted migration mode and identified the operator-approved product-direction change: the site visual language becomes the cross-platform reference while JSON remains the technical authority. | rerouted | Revise and revalidate the implementation contract before visual convergence. |
| 2026-08-04 18:40:00 UTC | 100-sg-spec | GPT-5 Codex | Revised the contract from isovisual centralization to site-led visual convergence, preserving structure and interaction invariants while defining dark-reference and light-adaptation rules. | draft | Run readiness review against the revised visual and proof contract. |
| 2026-08-04 18:48:00 UTC | 101-sg-ready | GPT-5 Codex | Verified the revised user outcome, site-led dark reference, explicit light adaptation, platform invariants, ordered migration tasks, rollback and proof obligations. | ready | Implement canonical semantic roles and migrate Windows, site and Android consumers. |
| 2026-08-04 20:35:00 UTC | 102-sg-start | GPT-5 Codex | Added one shared semantic role layer, mapped the site's dark-first language and an explicit light companion, generated all carriers, migrated Windows and Android product chrome consumption, hardened Android conversion errors, and aligned governance. | implemented | Collect rendered Windows/site proof and compile/test Android on the configured CI/device environment. |
| 2026-08-04 20:36:35 UTC | 006-sg-design | GPT-5 Codex | Completed the focused light-mode migration pass: removed legacy purple and Catppuccin consumer overrides, mapped compatibility aliases and auth recovery UI to semantic roles, and enforced WCAG AA contrast for essential light/dark pairs in token validation. | implemented | Collect rendered Windows light-mode proof and compile/test Android day/night resources on the configured CI/device environment. |
| 2026-08-04 21:18:50 UTC | 405-sg-prod | GPT-5 Codex | Diagnosed the failing quality run as RustSec advisory RUSTSEC-2026-0235, upgraded and pinned `tauri-plugin-log` 2.9, removed the vulnerable `rkyv` 0.7 dependency chain, and reproduced every CI check locally. | repaired | Push the bounded dependency repair and confirm the replacement GitHub Actions run. |

## Current Chantier Flow

`006-sg-design migration routed -> 100-sg-spec revised -> 101-sg-ready complete -> 102-sg-start implemented -> 006-sg-design proof pending -> 103-sg-verify pending -> 104-sg-end pending -> 005-sg-ship pending`
