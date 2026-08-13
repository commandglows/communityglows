---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.5.5"
project: "communityglows"
created: "2026-08-04"
created_at: "2026-08-04 11:27:34 UTC"
updated: "2026-08-14"
updated_at: "2026-08-13 23:15:59 UTC"
status: reviewed
source_skill: 100-sg-spec
source_model: "GPT-5 Codex"
scope: "cross-platform-design-token-authority"
owner: "Diane"
confidence: high
user_story: "En tant qu'utilisatrice de CommunityGlows, je veux retrouver la meme identite visuelle et les memes roles d'interface sur Windows, Android et le site, afin de reconnaitre le produit sans subir de variations accidentelles entre plateformes."
risk_level: high
security_impact: none
docs_impact: yes
linked_systems:
  - "shipglows_data/business/branding.md"
  - "shipglows_data/technical/design-system-authority.md"
  - "design/tokens/reference.json"
  - "src/ui/setup/pages/CommunityGlows/assets/generated/tokens.css"
  - "src/ui/setup/pages/CommunityGlows/components/ui/"
  - "site/src/components/ui/"
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
  - "The 2026-08-13 post-unification audit validates the canonical source and generated carriers, inventories 20 shared UI components, and finds that residual consumer drift, duplicate component families and missing post-unification visual proof invalidate the previous remediation baseline."
next_step: "/103-sg-verify cross-platform-design-token-authority rendered-and-android-proof"
---

# Cross-Platform Design Token Authority

## Title

Cross-Platform Design Token Authority

## Status

Implemented with automated integration proof; rendered multi-surface and Android compile/device proof remain pending. The residual scanner findings are the classified data-brand, browser-protocol and responsive-condition exceptions, not product-token fallbacks.

## User Story

En tant qu'utilisatrice de SocialGlowz, je veux retrouver la meme identite visuelle et les memes roles d'interface sur Windows, Android et le site, afin de reconnaitre le produit sans subir de variations accidentelles entre plateformes.

Primary actor: a SocialGlowz user moving between the Windows application, Android application, and public site.

Trigger: the user opens or changes platform, switches light/dark mode, or encounters the same semantic role such as a primary action, raised surface, muted text, focus indicator, dialog, or navigation container.

Observable result: equivalent semantic roles resolve from one versioned source, intentional platform adaptations are named and tested, and generated platform outputs cannot drift silently.

## Minimal Behavior Contract

The repository accepts one versioned, machine-readable set of semantic design tokens whose dark roles reproduce the site's current visual language and whose light roles are explicit accessible adaptations. Generation produces carriers consumed by Vue/Tauri, Astro/Tailwind and Android native chrome. Missing roles, stale output, unsupported conversions or undocumented differences fail validation. The easy failure to miss is generating equivalent names while Windows or Android still resolve legacy values after the generated carrier.

## Problem

SocialGlowz has a declared Windows authority and a successful Reka UI component bridge, but not one cross-platform design authority. Windows uses `--sg-*` variables from `main.css`; the site maintains an independent Tailwind carrier and typography; Android hardcodes native visual values without shared resources. Parallel carriers make visual drift possible even when every surface locally uses tokens.

The current desktop token file also mixes semantic roles, legacy aliases, screen-specific values, and value-shaped token names. Convergence must therefore happen through stable semantic roles and bounded consumer waves, not through screen-local restyling. Rendered review additionally shows that the first dark convergence is too flat: background, raised, muted, hover and border roles do not create enough perceptual depth, while `--surface-ground` can still resolve a legacy surface instead of the canonical app background.

## Solution

Use the repository-owned JSON source and deterministic generator to promote the site's visual roles into canonical semantic roles, emit platform-native carriers, and migrate Windows and Android consumers onto those roles. Preserve information architecture, interaction behavior and platform geometry while deliberately converging palette, typography, radius, elevation and motion. Refine both themes through an explicit depth ladder (`canvas`, `panel`, `control`, `interactive`), stronger typographic emphasis, restrained elevation and accessible state contrast; dark remains the reference and light remains its deliberate companion.

## Product Decision

Before: the token pipeline preserves three different visual systems and therefore centralizes files without creating a recognizable shared identity.

After: the site's current visual language is the approved design reference, `design/tokens/reference.json` is the only editable value authority, and generated carriers apply a calmer but more legible hierarchy to the site, Windows and Android with documented platform adaptations. Dark surfaces remain near-neutral rather than blue or fluorescent, but adjacent containers, controls and interactive states are visibly distinguishable.

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
- Refine the canonical light/dark surface, border, text, focus and elevation ladders so hierarchy is visible without adding decorative chrome.
- Retire active compatibility aliases that resolve a role to the wrong semantic level, beginning with the desktop app canvas.
- Consolidate representative title, section, body, metadata and control typography onto a bounded semantic hierarchy without changing copy or layout structure.

## Scope Out

- Redesigning navigation, information architecture, feature composition, or third-party WebView content.
- Forcing identical layout density where platform conventions require an explicit adaptation.
- Restyling third-party social-network pages rendered inside WebViews.
- Replacing Reka UI, Vue, Tauri, Astro, Tailwind, or Android WebView architecture.
- Removing historical extension dependencies unless their active visual values are migrated in a separately bounded slice.
- Rationalizing every legacy token name in the same commit as source centralization.
- Decorative gradients, glass effects, colored dark surfaces, ornamental motion or a new brand direction unrelated to hierarchy and legibility.

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
- The redesign must improve hierarchy through canonical roles and component contracts; screen-local color, shadow, radius or type literals are forbidden.
- Primary and secondary text must retain at least WCAG AA text contrast, while borders, focus indicators and selected-control boundaries target at least 3:1 against adjacent colors where WCAG 2.2 requires non-text contrast.

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

- [ ] Task 9: Refine canonical theme hierarchy and remove active wrong-level aliases.
  - Files: `design/tokens/reference.json`, generated carriers, `App.vue`, global app styles and representative SocialGlowz wrappers/components.
  - Action: introduce or remap the canvas/panel/control/interactive depth ladder; separate hover from muted surfaces; improve border, focus, text emphasis and elevation roles; map `--surface-ground` to the canonical background; preserve layout and network-brand colors.
  - Validate with: resolved color/contrast matrix, deterministic generation, changed-file drift scan, and before/after Windows captures in both modes.

- [ ] Task 10: Consolidate visual emphasis across representative application states.
  - Files: app shell, onboarding, sidebars, settings, CRM controls, dialogs and shared Reka wrappers.
  - Action: consume the refined roles consistently for page titles, section titles, body, metadata, selected rows, fields, cards and overlays; remove component forks that flatten hierarchy or bypass semantic state roles.
  - Validate with: desktop light/dark screenshots at 1440x900, focus/hover/selected/disabled checks, 200% zoom sanity, reduced-motion check, unit tests, typecheck and Tauri frontend build.

## Post-Unification Audit Baseline — 2026-08-13

This read-only baseline supersedes the 2026-08-04 `160 candidates / 237 files` snapshot for remediation planning. The older count remains historical evidence only: the shared-component and token-authority changes committed on 2026-08-13 materially changed consumer paths, so the two inventories are not numerically comparable.

### Authority And Carrier Result

- Canonical editable authority remains `design/tokens/reference.json`.
- `pnpm run design:tokens:validate` passes.
- `pnpm run design:tokens:check` passes and reports every generated carrier current.
- The current source contains 888 leaf values across semantic, Windows, site and Android groups. This is an implementation inventory, not a claim that every leaf is a distinct or necessary semantic role.
- The canonical document is a repository-owned JSON schema rather than DTCG JSON; DTCG conformance is `N/A` unless the project explicitly adopts that interchange contract.
- Cross-surface visual parity remains unverified after the shared-component pass because fresh rendered Windows, site and Android comparisons were not collected in this audit.

### Shared Component Inventory

- CommunityGlows app primitives: 15 Vue components under `components/ui/`.
- Marketing-site primitives: 5 Astro components under `site/src/components/ui/`.
- Total audited component surface: 112 Vue components and 40 Astro components.
- Production-consumption scan finds `SgSpinner` without a template consumer; generated route/type references do not establish production use.
- Ten duplicate basename families remain across historical extension/shared sources and the CommunityGlows product tree, including `AppHeader`, both sidebars, feed components and `SocialNetworkLogo`. Each family requires an ownership decision before consolidation; basename equality alone does not prove equivalent behavior.
- Twenty components exceed 300 lines. The largest current signals are `MobileLayout.vue` (1,217), `MobileSettingsSheet.vue` (1,194), `App.vue` (1,130), `AppSidebar.vue` (1,021) and `MobileProfileSheet.vue` (880). These thresholds trigger boundary review; they do not authorize mechanical splitting.
- CommunityGlows product components still contain 94 direct native `<button>` occurrences across 22 files, 35 `<input>` occurrences across 19 files, seven `<select>` occurrences across five files and two `<textarea>` occurrences across two files. Native controls are not defects by themselves, but repeated product-owned styling or state behavior outside the shared wrappers is a migration candidate.

### Residual Literal Classification

The ShipGlows Python drift scanner could not execute in the configured Windows environment because only the Microsoft Store Python aliases are present and no WSL distribution is installed. The following source inventory is therefore an explicit interim classifier, not a substitute for the canonical scanner and not sufficient for zero-drift closure.

- App and extension authored sources: 140 candidate lines containing fixed dimensions across 57 files, five candidate motion lines across five files, and 55 color lines across two files.
- The dominant app color source is `src/config/socialNetworks.ts`; official network brand colors are accepted data-brand candidates, subject to occurrence-level confirmation. No blanket exception applies to the second color-bearing file.
- Shared app primitives still contain product-owned responsive literals in `SgDialog.vue` (`70vw`, `75vw`, `90vw`) and fallback literals in `SgSheet.vue` (`0px`). These are unresolved until mapped to named layout/fallback roles or documented as narrow protocol/platform exceptions.
- Site authored sources contain seven fixed-dimension candidate lines across two files: one observer `rootMargin`, four radius calculations, one media-query breakpoint and one underline offset. The breakpoint is a syntax exception candidate; the remaining values require canonical-role or documented-exception review.
- Site component inline styles resolve to existing font, radius and offset design tokens, but `SectionHeading.astro` exposes a dynamic `font-family` style path. Its accepted values and caller guardrails must be proven before it can be considered authority-safe.
- Android authored native sources contain 34 color candidates in one file and one fixed-dimension candidate. Network-brand registry values may qualify as data-brand exceptions; every other occurrence requires generated-resource or platform-bound classification.
- Shared wrappers `SgButton`, `SgMultiSelect`, `SgPassword` and `SgSelect` forward `$attrs`. Audit their styling and arbitrary-attribute escape surface before treating the wrapper boundary as closed.

### Audit Grades And Priority

- Design-token architecture: `C`. Authority, generation and freshness are healthy; consumer coverage, exception classification, resolved-value proof and rendered parity remain incomplete.
- Component-system architecture: `C`. A real primitive layer and maintained Reka UI behavior ownership exist, but duplicate product families, one unused primitive signal, large mixed-boundary components, direct-control dispersion and styling escape paths prevent a production-grade score.
- Priority: critical by blast radius because more than 30 component files are affected. This describes remediation scope, not a production outage.

### Effect On The Residual Wave

- The earlier R0/A/B/C readiness is stale and must not authorize writes.
- Revised R0 must preserve the already-valid source and carrier freshness while producing the canonical scanner result or an approved equivalent environment proof, an occurrence-level exception ledger, and a frozen post-unification source hash.
- Revised Batch A must separate historical extension ownership from CommunityGlows product ownership, audit direct interactive controls against shared wrappers, and review component boundaries without forcing cross-product abstractions.
- Revised Batch B must review the seven site dimension candidates and the dynamic heading font path while preserving current rendering.
- Revised Batch C must classify every native color/dimension occurrence and prove generated resource consumption apart from official network-brand metadata.
- A dedicated shared-component review must precede integration: confirm production consumers, remove or justify unused primitives, close unsafe styling escape paths, and decide duplicate-family ownership before any deletion or consolidation.
- Combined verification still requires representative Windows, site and Android visual proof, keyboard/focus behavior, reduced motion, light/dark behavior, responsive states and 200% zoom where applicable.

## Post-Unification Readiness Review — 2026-08-13

Verdict: `not ready`.

The outcome, authority, affected surfaces, preservation constraints and broad proof posture are resolved. Implementation is still unsafe for a fresh agent because the refreshed baseline does not yet convert every material finding into a bounded target, an occurrence-level disposition and an executable proof scenario. The previous `ready` decisions predate the shared-component unification and remain historical evidence only.

### Blocking Corrections

1. **Reproducible canonical inventory** — run the ShipGlows drift scanner in a supported Python environment against the post-unification tree. Record its version, scope, exact candidate totals per surface and machine-readable or durable output reference. The interim PowerShell inventory may guide discovery but cannot establish zero drift.
2. **Occurrence-level disposition ledger** — assign every reported occurrence one disposition: canonical consumption, missing semantic role, official network-brand metadata, SVG geometry, responsive-condition syntax, browser/API/WebView protocol, measured platform bound, or defect. Each exception must name its reason and matching proof; category-level blanket exceptions are forbidden.
3. **Shared-component ownership matrix** — for every one of the 20 shared primitives, record production consumers, visual owner, behavior owner, supported variants/states, token dependencies and styling escape paths. Resolve `SgSpinner` as used, intentionally reserved with evidence, or removable; generated type/route references do not count as production use.
4. **Duplicate-family boundary matrix** — classify each of the ten duplicate basename families as intentional platform specialization, shared-domain candidate, compatibility layer, or dead legacy path. Name the active entrypoint and tests for each family. No deletion or consolidation is allowed from basename similarity alone.
5. **Wrapper guardrails** — define allowed and rejected `$attrs`, dynamic `style`, class and variant behavior for shared wrappers. A caller must not be able to bypass canonical visual decisions silently. Include the accepted-value contract for the dynamic font path in `SectionHeading.astro`.
6. **Bounded consumer batches** — replace broad directory ownership with explicit target lists derived from the occurrence and ownership matrices. Each target must name the intended disposition, preserved behavior and focused validation. Historical extension and CommunityGlows product consumers must remain separate where their behavior or dependency owners differ.
7. **Post-unification proof scenarios** — define representative Windows/Tauri, extension, site and Android states with viewport/mode/state pairs, success criteria and baseline source. Cover light/dark where supported, keyboard and focus restoration, reduced motion, responsive behavior, 200% zoom where applicable, Android safe areas and native target sizes.
8. **Environment recovery** — name the agent-runnable Python environment or approved equivalent execution surface for the canonical scanner. If Android compile or rendered device proof remains unavailable, keep the exact gap and responsible recovery action explicit; do not downgrade it to a pass.

### Ready Recovery Condition

The spec may return to readiness only when all eight corrections are present, internally consistent and traceable to acceptance criteria and batch validations. A fresh agent must be able to select an occurrence or component, identify its sole owner and allowed change, preserve product behavior, run the exact checks and know which missing evidence prevents completion without relying on conversation history.

## Readiness Recovery Addendum — 2026-08-13

This addendum supplies the eight corrections required by the preceding `not ready` verdict. It defines planning truth; it does not claim that product remediation or rendered proof has happened.

### Canonical Scanner Execution And Scope

- Agent-runnable interpreter: `uv python find`, currently resolving CPython 3.14.7 from the existing user-managed uv installation. No installation or system mutation is required.
- Canonical command: `& (uv python find) "$env:SHIPGLOWS_ROOT\tools\design_system_drift_check.py" --format markdown --warn-only` from the project root.
- Result at this revision: 253 files scanned, 78 findings, warn-only result `drift candidates found`.
- Finding kinds: 53 hardcoded colors, 22 hardcoded CSS dimensions, one hardcoded motion value, one JS/browser feature-string value and one Tailwind arbitrary visual utility.
- Scanner boundary: the current tool searches its declared source directories and therefore covers active `src/` consumers but not the nested `site/src` or Android plugin tree. Batch B and C retain their explicit supplemental inventories and cannot infer zero drift from the 78-result scan.
- Targeted site command: `& (uv python find) "$env:SHIPGLOWS_ROOT\tools\design_system_drift_check.py" --root site --format markdown --warn-only`.
- Targeted site result: 50 files scanned, two findings: `site/src/styles/global.css:81` (`z-index: 9999`) and `site/src/styles/global.css:207` (`@media (min-width: 64rem)`). The layer finding was absent from the preceding seven-candidate supplemental ledger; the responsive condition is an accepted syntax candidate but still requires boundary proof.

### Execution Audit Delta — 2026-08-14

This delta supersedes only the ownership and occurrence dispositions below. The audit initially returned the spec to `draft`; this readiness review now authorizes R0 because the missing canonical roles and Android accessibility blocker are bounded implementation tasks with explicit stop conditions. The readiness decision does not authorize consumer writes before R0 and the ownership gate pass.

- `src/assets/base.css` is imported only by `src/ui/setup/pages/CommunityGlows/main.ts`. It belongs to A2 CommunityGlows bootstrap/product, not A1 legacy extension.
- `src/components/state/LoadingSpinner.vue` and `src/components/LocaleSwitch.vue` have no production template or script consumer. Their only detected references are generated component declarations under `src/types/` and the CommunityGlows generated types directory. Treat both as orphan candidates; generated declarations are not production evidence. No migration or deletion is permitted until the ownership gate records `remove`, `reserved with a named consumer`, or an actual production consumer.
- R0 must add or confirm semantic roles for native/select padding, dropdown/menu stacking, the three supported dialog widths currently expressed as `70vw`, `75vw` and `90vw`, the site noise-overlay layer currently expressed as `9999`, and the blog-link underline offset currently expressed as `4px`. Value-shaped tokens owned by another component do not satisfy these roles. Any inability to preserve the exact resolved value stops readiness rather than authorizing a consumer fallback.
- The four authored site radius calculations duplicate the generated Tailwind radius mappings exactly and should be removed from authored CSS after resolved-style/build proof; they do not require new roles.
- `SectionHeading.astro` must replace `styleFont?: string` with a closed named variant API. Its complete production consumer set is `Hero.astro` (`--font-cal-sans`), `Pricing.astro` (`--font-instrument-sans`) and `SolutionSection.astro` (`--font-instrument-sans`). The implementation maps variants internally to those existing canonical font variables and accepts no arbitrary CSS string.
- `Layout.astro` retains `rootMargin: '-50px'` only as a named IntersectionObserver protocol exception with reveal-threshold and reduced-motion proof. The Lenis `duration: 1.2`, numeric easing expression and observer `threshold: 0.1` are invisible to the current scanner; classify them occurrence by occurrence as canonical motion consumption or a documented library/browser protocol contract before Batch B can claim zero drift.
- The Android supplemental set is closed at 35 authored findings: 34 `NetworkInfo` color literals in `NativeWebViewPlugin.kt` are data-brand candidates requiring per-network registry confirmation, while the generated `communityglows_component_network_button_size` resolves to `36dp`. The latter is a product-owned target-size blocker below the contract's 44dp primary mobile target baseline; R0 must provide a compliant semantic component-size role and Batch C must prove the rendered hit target. Generated day/night XML remains output-only.

### Occurrence-Level Disposition Ledger

| Target and exact lines | Count | Initial disposition | Required action/proof |
| --- | ---: | --- | --- |
| `src/config/socialNetworks.ts`: 49, 59, 69, 79, 89, 90, 101, 111, 121, 132, 142, 143, 153, 163, 164, 174, 175, 186, 196, 197, 207, 208, 218, 219, 229, 230, 240, 241, 251, 252, 262, 263, 273, 274, 284, 285, 295, 296, 306, 307, 317, 318, 328, 329, 339, 340, 350, 351, 361, 371, 372, 382, 383 | 53 | official/data-brand candidate | Verify every network value against the registry's brand role and prove product UI never treats it as a semantic product color. Any synthetic/non-official value becomes a defect or documented product-data role. |
| `src/assets/base.css`: 8, 15, 20, 21, 23, 24, 28, 29, 31, 32, 40, 48, 50, 51 | 14 | defect candidates | Replace reusable layout/control values with canonical roles. Classify `100%` occurrences as primitive geometry only when the shared full-size role cannot express the contract more clearly. |
| `src/ui/setup/pages/CommunityGlows/index.html`: 10, 19 | 2 | root-layout candidates | Map full-height/bootstrap geometry to canonical root-layout roles or document the first-paint platform constraint. |
| `src/ui/setup/pages/CommunityGlows/index.html`: 20 | 1 | motion defect | Consume the canonical first-paint duration/easing and prove reduced-motion behavior. |
| `src/components/AppSidebar.vue`: 39; `src/components/AppRightSidebar.vue`: 40 | 2 | legacy extension geometry candidates | Preserve the historical extension entrypoint; use the shared full-height role unless platform specialization is documented. |
| `src/components/LocaleSwitch.vue`: 21 | 1 | defect | Replace `z-[1]` with the canonical layer role and prove menu stacking/focus. |
| `src/stores/socialNetworks.ts`: 108 | 1 | browser protocol exception candidate | Keep only if the `window.open` feature string is confirmed as protocol text rather than rendered component design; add focused launcher behavior proof. |
| `src/ui/setup/pages/CommunityGlows/components/BillingAccessPanel.vue`: 436 | 1 | product geometry candidate | Consume the full-height/layout role and prove the gate layout at representative widths. |
| `src/ui/setup/pages/CommunityGlows/components/CrmToolbar.vue`: 84 | 1 | positioning candidate | Replace `50%` with a named centering primitive/role or document why CSS transform geometry is the local primitive contract. |
| `src/components/common/SocialNetworkLogo.vue`: 62 | 1 | shape candidate | Replace `50%` with the canonical pill/circle radius role and preserve logo cropping. |
| `src/components/state/LoadingSpinner.vue`: 9 | 1 | defect | Replace the inline `2rem` size with the canonical spinner role or the shared spinner primitive; prove loading-state visibility. |

Every row is a closed set for the 78-result scan. Implementation reports must split a row if individual occurrences receive different final dispositions; no row may be marked complete with an unclassified member.

### Shared-Component Ownership Matrix

| Primitive | Production consumers | Behavior owner | Visual owner and guardrail |
| --- | ---: | --- | --- |
| `SectionEyebrow` | 2 | semantic HTML | project wrapper; fixed tokenized presentation |
| `SgAvatar` | 1 | Reka UI | project wrapper; avatar variants only |
| `SgBadge` | 1 | semantic HTML | project wrapper; named badge variants only |
| `SgButton` | 8 | native button | project wrapper; `$attrs` allow semantic/event/ARIA attributes, but reject `class`/`style` visual bypasses |
| `SgDialog` | 7 | Reka UI | project wrapper; named size variants must replace `70vw/75vw/90vw` literals |
| `SgIcon` | 40 | decorative/label contract owned by wrapper | project icon registry; no caller-supplied arbitrary visual values |
| `SgInput` | 3 | native input | project wrapper; tokenized field contract |
| `SgMultiSelect` | 1 | native select | project wrapper; same `$attrs` restriction as `SgButton` |
| `SgPassword` | 2 | native input/button | project wrapper; same `$attrs` restriction plus accessible toggle proof |
| `SgSelect` | 1 | Reka UI | project wrapper; same `$attrs` restriction plus keyboard/focus proof |
| `SgSheet` | 2 | project pointer/keyboard implementation | project wrapper; runtime drag offset is allowed only as measured interaction state, with zero fallback held by a named shared constant |
| `SgSpinner` | 0 | CSS/status semantics | unresolved primitive: either replace `LoadingSpinner.vue` and prove production use, document an imminent named consumer, or remove it; generated route/type entries are insufficient |
| `SgStatusPill` | 1 | semantic HTML | project wrapper; named status variants only |
| `SgSwitch` | 2 | Reka UI | project wrapper; keyboard/state proof required |
| `SgTextarea` | 3 | native textarea | project wrapper; tokenized field contract |
| `ActionLink` | 14 | native anchor | site wrapper; link/button presentation restricted to named variants |
| `EyebrowPill` | 13 | semantic HTML | site wrapper; fixed tokenized presentation |
| `SectionHeading` | 3 | semantic heading | site wrapper; replace `styleFont` with a closed named variant mapped internally to canonical Cal Sans or Instrument Sans variables; arbitrary CSS text is rejected |
| `SiteLogo` | 2 | native anchor/image semantics | site wrapper; size and theme variants remain named |
| `StatusBadge` | 5 | semantic HTML | site wrapper; named status variants only |

### Duplicate-Family Boundary Matrix

| Family | Classification | Active ownership decision |
| --- | --- | --- |
| `app.vue` (seven files) | intentional platform entrypoints | Keep separate; each entrypoint owns platform bootstrapping, not shared product composition. |
| `index.vue` (five files) | intentional platform route entries | Keep separate; do not abstract page shells solely by basename. |
| `AppHeader` | historical extension versus CommunityGlows product specialization | Keep both during this wave; verify explicit imports/entrypoints and migrate only shared visual roles. |
| `AppSidebar` | historical PrimeVue extension shell versus CommunityGlows Reka/product shell | Keep separate behavior owners; no structural merge in a design-token remediation. |
| `AppRightSidebar` | historical PrimeVue extension shell versus CommunityGlows Reka/product shell | Same boundary as `AppSidebar`. |
| `CreatePost` | legacy extension feed versus richer CommunityGlows feed | Treat as compatibility/product specialization until behavior tests prove a shared domain core. |
| `SocialAvatar` | legacy PrimeVue avatar versus CommunityGlows wrapper composition | Preserve separate behavior owners; converge semantic roles only. |
| `SocialComment` | legacy versus CommunityGlows feed specialization | No merge without domain/event parity proof. |
| `SocialPost` | legacy versus CommunityGlows feed specialization | No merge without rendering, event and content-state parity proof. |
| `SocialNetworkLogo` | shared registry presentation versus CommunityGlows compatibility wrapper | Prefer one registry/data source; retain wrappers only where their API/entrypoint compatibility differs and prove logo rendering. |

### Supplemental Site And Android Ledger

- Site targets: `site/src/layouts/Layout.astro` observer `rootMargin` plus scanner-invisible Lenis duration/easing and observer threshold; `site/src/styles/global.css` four duplicate radius calculations, the noise-overlay layer, one responsive condition and one underline offset; `SectionHeading.astro` dynamic font path. Responsive-condition syntax and named browser/library protocol contracts may be excepted with proof; product-owned layer and underline values require the R0 roles named above.
- Android targets: 34 authored `NetworkInfo` color candidates and the `36dp` network-button size represented by the generated bridge. Classify every color against official/data-brand ownership; the component size is product-owned and must meet the declared target-size contract through canonical authority. The generated day/night XML files are outputs and never hand-edited.

### Bounded Target Batches

- **A1 legacy extension:** `src/components/AppSidebar.vue`, `src/components/AppRightSidebar.vue`, `src/components/common/SocialNetworkLogo.vue`, plus only their explicit legacy consumers and focused tests. `LocaleSwitch.vue` and `LoadingSpinner.vue` remain outside consumer writes until the ownership gate resolves their orphan status.
- **A2 CommunityGlows bootstrap/product:** `src/assets/base.css`, `src/ui/setup/pages/CommunityGlows/index.html`, `BillingAccessPanel.vue`, `CrmToolbar.vue`, the 15 app primitives and only consumers named by the ownership matrix when a wrapper contract changes. `base.css` is here because its sole active import is the CommunityGlows entrypoint.
- **A3 data/protocol:** `src/config/socialNetworks.ts` and `src/stores/socialNetworks.ts`; this batch classifies brand metadata and browser protocol text without changing product palette or popup behavior.
- **B site:** the two supplemental site files, `SectionHeading.astro`, and only its three consumers if the named font variant API changes.
- **C Android:** authored native WebView plugin files containing the 35 supplemental candidates; generated XML remains forbidden.
- Authority inputs remain sequential and frozen before A1/A2/A3/B/C writes. A missing role stops all consumer writes and returns to the authority gate.

### Post-Unification Visual And Interaction Scenarios

| Scenario | Surface/state | Required proof |
| --- | --- | --- |
| `TOK-EXT-201` | Chrome and Firefox popup/side-panel legacy shell at narrow and wide supported widths | tokenized controls, stacking, logo geometry, loading state; no entrypoint behavior regression |
| `TOK-WIN-201` | Tauri shell at 1440x900 and a narrow desktop width, light/dark | canvas/panel/control hierarchy, both sidebars, top/bottom control bar, loading and billing gate states |
| `TOK-WIN-202` | dialog/select/switch/sheet interactions | Tab/Shift+Tab, arrows/Home/End where applicable, Escape, focus restoration, visible focus and editing-shortcut isolation |
| `TOK-WIN-203` | 200% zoom and reduced motion | reflow without lost controls; first-paint/sheet motion disabled or reduced without hiding content |
| `TOK-SITE-201` | home, features, comparison, pricing/lifetime and purchase result at 1440px and 390px | unchanged hierarchy, named heading fonts, focus visibility, no responsive drift |
| `TOK-SITE-202` | reduced-motion and keyboard traversal | animation suppression, reachable links/actions, no content loss |
| `TOK-ANDROID-301` | day/night fallback page, bottom bar, menu, selected/disabled states | generated resource consumption, safe areas, target sizes, native chrome parity |
| `TOK-ANDROID-302` | representative WebView open/switch/return | no session/navigation lifecycle change; measured bounds remain platform-owned |

Each scenario records baseline commit, viewport/device, mode, state, capture or test evidence, and pass/fail. Missing Android device/SDK execution remains `not verified`, never a pass.

## Residual Token-Consumption Wave — CommunityGlows

This is the current active remediation wave for **CommunityGlows**, not SocialGlowz. Historical SocialGlowz wording and records elsewhere in this document are preserved as prior lifecycle evidence; they do not authorize deprecated paths, identifiers or carriers in this wave.

Outcome: reconcile every stale generated carrier from the canonical CommunityGlows JSON authority, then remove all non-exception visual literals from the active app/Tauri web, extension, marketing site and Android WebView native surfaces without rebranding, changing layout, changing navigation, or changing runtime behavior.

This post-unification revision is not yet ready for implementation. The previous readiness decision predates the shared-component changes and is retained only as historical evidence. A fresh readiness review must approve the revised R0, shared-component ownership gate and consumer batches before any product-source write.

### Sequential Precondition R0 — Authority And Carrier Reconciliation

R0 is the first and only sequential implementation unit before consumer work:

- Owned authority inputs: `design/tokens/reference.json`, the existing schema/mapping documents under `design/tokens/` when required by a named semantic role, and the existing generator mapping/serialization files and focused tests under `scripts/design-tokens/`.
- Purpose: reproduce the canonical drift scan in a supported environment, classify every candidate occurrence, confirm which semantic roles are actually missing, then add only approved missing roles and mappings. Existing validation/freshness success does not by itself complete R0. No product rebrand, layout, navigation, copy, interaction, timing, or behavior change is permitted.
- Single-write rule: canonical token source and generator mappings may be edited in this one authority pass only. R0 then runs `pnpm run design:tokens:validate`, `pnpm run design:tokens:generate`, and `pnpm run design:tokens:check`, records the resulting source version/hash, and freezes authority inputs for Batches A, B and C.
- Generated-output rule: the generated Vue/Tauri CSS, site CSS and Android day/night XML files are outputs of R0. They may change only through `pnpm run design:tokens:generate`; they are never edited manually by R0, a consumer batch, or the integration owner.
- Stop condition: if any consumer batch discovers a missing or incorrect semantic role, all parallel writes stop. The batch must not add a local literal or edit authority files; the spec returns to a new sequential authority revision and requires readiness again.

All consumer batches depend on a passing and frozen R0 plus a read-only shared-component ownership gate. That gate must classify the ten duplicate basename families, confirm the production status of every shared primitive, review `$attrs` and dynamic-style escape paths, and assign each remediation to exactly one consumer batch. After both gates pass, A, B and C have non-overlapping authored-file ownership and may run in parallel.

### Execution Batches

These batches are draft definitions subject to a fresh `101-sg-ready` review against the post-unification baseline.

#### Batch A — App/Tauri Web And Extension

- Owned writes: authored files under `src/` for the CommunityGlows app/Tauri web frontend and browser-extension surfaces, including shared UI composition, `src/assets/base.css`, extension entry styling, content-script styling, and `src/ui/setup/pages/CommunityGlows/` consumers.
- Forbidden writes: `src/types/`; `src/ui/setup/pages/CommunityGlows/assets/generated/tokens.css`; all of `design/tokens/`, `scripts/`, `site/`, and `src-tauri/plugins/android-webview/`; package/config/status files; and every unrelated source surface.
- Dependency: frozen R0 passes token validation, generation and freshness checks before Batch A starts.
- Required change: replace DaisyUI/PrimeVue/Tailwind palette bypasses, token fallbacks and authored visual literals with canonical semantic roles or existing CommunityGlows primitives. Preserve layout, copy, interaction, extension permissions and runtime behavior.
- Per-batch validation: `pnpm run design:tokens:check`; `pnpm run typecheck:core`; focused tests; `pnpm run build:chrome`; `pnpm run build:firefox`; `pnpm run tauri:build`; and an authored-source literal inventory scoped to Batch A with only the accepted exceptions below.
- Visible proof: browser screenshots of representative extension entries and Tauri screenshots of representative shell, gate, dialog and content states in light/dark modes, including keyboard focus and reduced-motion behavior.

#### Batch B — Marketing Site

- Owned writes: authored files under `site/`, including Astro components/pages and authored styles.
- Forbidden writes: `site/src/styles/generated/tokens.css`; all of `src/`, `src-tauri/`, `design/tokens/`, and `scripts/`; package/config/status files outside `site/`; and every unrelated source surface.
- Dependency: frozen R0 passes token validation, generation and freshness checks before Batch B starts.
- Required change: replace hardcoded Tailwind colors, local `oklch`/hex/`rgba` values, visual fallbacks, radii, shadows, spacing, typography and motion with canonical semantic tokens while preserving the approved CommunityGlows rendering, content, layout and responsive behavior.
- Per-batch validation: `pnpm run design:tokens:check`; `pnpm --dir site run build`; an authored-site literal inventory with only accepted exceptions; and desktop/mobile visual comparison for representative home, feature, comparison, pricing and lifetime-deal states.
- Visible proof: browser screenshots in light/dark where supported, at representative desktop/mobile widths, plus visible focus and reduced-motion proof with no unintended rebrand or layout shift.

#### Batch C — Android WebView Native Plugin

- Owned writes: authored files under `src-tauri/plugins/android-webview/`, including native Kotlin and authored Android resources used by CommunityGlows WebView chrome, fallback UI, menus and overlays.
- Forbidden writes: generated `android/src/main/res/values/communityglows_tokens.xml` and `android/src/main/res/values-night/communityglows_tokens.xml`; autogenerated permission files; all of `src/`, `src/types/`, `site/`, `design/tokens/`, and `scripts/`; package/config/status files; and every unrelated Tauri surface.
- Dependency: frozen R0 passes token validation, generation and freshness checks before Batch C starts.
- Required change: consume generated Android resources or the existing generated bridge for every product-owned color, typography, spacing, radius, elevation, motion and fixed component dimension. Preserve WebView lifecycle, sessions, navigation, safe areas, haptics, protocol behavior and measured native geometry.
- Per-batch validation: `pnpm run design:tokens:check`; Android resource validation; plugin/host Android compile through `pnpm run tauri:android:build` when the configured SDK/target makes it executable; focused Kotlin checks; and a native-source literal inventory with only accepted exceptions. An unavailable Android toolchain is recorded as missing proof, never as a pass.
- Visible proof: day/night screenshots of the fallback/blocking page, bottom bar, menu, selected/disabled states and representative WebView transitions on an emulator/device or the configured Android proof environment, including safe-area and target-size checks.

### Integration Ownership And Combined Validation

- Integration owner: one sequential `102-sg-start` integration owner after A, B and C report completion. Batch agents do not integrate each other's files and do not modify the spec, authority inputs or generated carriers.
- The integration owner checks that ownership did not overlap, resolves merge conflicts without broadening batch scope, and rejects any local fallback introduced to bypass a missing canonical role.
- Combined automated proof: `pnpm run design:tokens:validate`; `pnpm run design:tokens:generate` followed by proof that generation produces no further diff; `pnpm run design:tokens:check`; `pnpm run test:once`; `pnpm run typecheck:core`; `pnpm run lint:check`; `pnpm run build:chrome`; `pnpm run build:firefox`; `pnpm run tauri:build`; `pnpm --dir site run build`; Android compile when executable; and one all-owned-surfaces visual-literal inventory.
- Combined visible/manual proof: compare browser screenshots for the extension and site, Tauri screenshots for app states, and Android day/night captures against the approved pre-wave baseline. Prove visible focus, keyboard traversal, light/dark parity, reduced motion, 200% zoom where applicable, mobile widths, native safe areas and target sizes. No proof may rely on a changed layout, rebrand, copy change or interaction change.

### Strict Accepted Exceptions

Only these categories may retain literals, and each occurrence must be classified by the batch report:

- official social-network brand metadata owned by the network registry, including official solid colors, gradients and logo-specific brand treatment;
- SVG geometry such as paths, points, transforms, `viewBox`, masks and intrinsic coordinate dimensions; product visual fills, strokes, opacity, shadow and motion are not geometry and still require a token unless they are official brand metadata;
- media-query breakpoints that express responsive conditions; visual values inside those queries remain tokenized;
- browser, API and WebView protocol strings or selectors whose literal syntax is required by the platform contract; visual fallback values embedded in those strings are not exempt;
- measured native bounds, safe-area/inset values and runtime dimensions obtained from platform measurement APIs; copied magic numbers or authored fixed visual dimensions are not measured bounds.

Every other product-owned visual literal — color, gradient, opacity, spacing, size, typography, radius, border, shadow, elevation, z-index, motion duration/easing/distance, icon treatment or fixed component geometry — must resolve through a canonical semantic token. If no role exists, the batch stops under the R0 stop condition.

### Residual-Wave Acceptance Criteria

- [ ] R0 is completed exactly once, all generated carriers are reconciled through generation, and `pnpm run design:tokens:check` passes before A, B or C starts.
- [ ] Authority inputs and generated outputs remain unchanged during parallel consumer batches.
- [ ] Batch A owns only the declared authored `src/` consumers and leaves `src/types/` untouched.
- [ ] Batch B owns only authored `site/` consumers.
- [ ] Batch C owns only authored Android WebView plugin consumers and never hand-edits generated XML or autogenerated permissions.
- [ ] Every product-owned visual value in the three batch scopes consumes a canonical semantic token; every retained literal matches one strict exception and has evidence.
- [ ] CommunityGlows app/Tauri web, extension, site and Android WebView native surfaces build or compile with the declared environment; unavailable Android execution remains an explicit verification gap.
- [ ] Browser/Tauri/site/Android visual proof shows the approved identity with no rebrand, layout, navigation, copy, permission, session, WebView lifecycle or interaction-behavior change.
- [ ] Focus visibility, keyboard behavior, reduced motion, light/dark behavior, responsive states, 200% zoom where applicable, safe areas and native target sizes retain or improve their prior proof.
- [ ] Combined generation is idempotent, all carriers are current, and the all-surface literal inventory contains no unclassified non-exception result.
- [ ] Documentation and public claims are updated only after implementation evidence exists; this spec revision alone is not treated as remediation proof.

### Residual-Wave Test Strategy

- Authority first: validate schema/mappings, generate all carriers once, prove idempotence/freshness, then freeze the source version for the parallel wave.
- Consumer proof: run each batch's focused build and literal inventory independently so one surface cannot mask another surface's debt.
- Integration proof: rerun token checks, app/extension builds, site build and Android compile when executable from the integrated tree; any skipped executable is a named gap with owner and follow-up.
- Visual proof: capture deterministic representative screenshots for browser extension, site, Tauri and Android day/night surfaces; compare semantic roles and layout bounds against the pre-wave baseline.
- Accessibility proof: verify visible focus, keyboard traversal/restoration, reduced-motion behavior, text/non-text contrast, target sizes and 200% zoom/reflow where applicable.
- Negative proof: a stale carrier, manually edited generated output, unclassified visual literal, missing semantic role, failed build or unavailable required screenshot prevents verification from passing.

### Proportional ZOMBIES Coverage

- Z — zero residual non-exception visual literals is the required inventory result for each authored batch scope.
- O — one missing semantic role stops its batch and returns authority work to a sequential revision; one generated mismatch fails freshness.
- M — three concurrent consumer batches are valid only after frozen R0 and must remain non-overlapping through integration.
- B — light/dark, reduced-motion, focus, responsive breakpoints, 200% zoom, Android safe areas and target-size boundaries receive representative proof.
- I — the JSON source -> generator/mappings -> generated carrier -> authored consumer interface is versioned and checked at every boundary.
- E — generation failure, stale output, build failure, unavailable Android tooling and missing visual proof remain explicit failures or gaps; no local fallback is accepted.
- S — use the smallest representative state set that proves all semantic roles while preserving the no-rebrand/no-layout/no-behavior contract.

### OWASP Security Gate

- Relevant lens: A02 Security Misconfiguration, A08 Software or Data Integrity Failures and A10 Mishandling of Exceptional Conditions apply proportionally to stale carriers, generated-file integrity and fail-closed generation/validation. A03 Software Supply Chain Failures is constrained by the ban on dependency/package changes in this wave.
- Trust/data boundaries: no authentication, authorization, user data, secrets, cookies, private URLs or external provider behavior changes are in scope. Token generation remains local/build-time with fixed repository outputs.
- ASVS v5.0.0: not applicable to this visual-consumption-only revision because it adds no runtime security control or externally reachable input boundary.
- Proof: generated outputs are reproducible from reviewed canonical inputs, manual output edits fail freshness checks, and failed generation or conversion cannot be reported as success.
- Residual gap and owner: Android compile/device proof may depend on the configured SDK/emulator; Batch C records the gap and the integration owner carries it into `103-sg-verify` rather than weakening closure.

### Residual-Wave Documentation Impact

- During implementation, update `shipglows_data/technical/design-system-authority.md` and contributor instructions only after the canonical source, carriers and active consumers are proven current.
- Update README architecture statements only when all declared CommunityGlows carriers are actually generated and consumed at that commit.
- Record the strict exception taxonomy and generated-file editing rule in the design-system authority; do not duplicate token values in documentation.
- Do not publish or restore an all-surface parity claim until combined automated and visible/manual proof passes.

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
- [ ] Dark mode exposes four perceptually distinct semantic depth states for canvas, panel, control and interactive hover/selection without colored or fluorescent chrome.
- [ ] Light mode applies the same hierarchy with explicit values rather than reversing dark values mechanically.
- [ ] The app canvas resolves `--sg-color-background` on first paint and after light/dark/system changes; no active legacy alias silently substitutes a raised or muted surface.
- [ ] Representative title, section, body and metadata roles are visibly ordered and remain readable at 200% zoom.
- [ ] Text, focus and applicable non-text boundaries satisfy the declared WCAG 2.2 contrast thresholds in both themes.

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
- Browser or Tauri starts before persisted theme initialization and briefly paints the opposite canvas.
- A border disappears because its color equals the adjacent panel even though text contrast still passes.
- A selected or hover state becomes indistinguishable from a control surface in one mode.

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
- `TOK-WIN-102`: Windows canvas, panel, control and interactive states remain distinguishable in light/dark captures without layout change.
- `TOK-A11Y-402`: representative text emphasis, focus and non-text boundaries pass the declared contrast matrix and 200% zoom sanity check.
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
| 2026-08-04 21:47:00 UTC | 006-sg-design | GPT-5 Codex | Audited the rendered light/dark entry state and active consumers; confirmed a flat dark depth ladder, diffuse typography, and an active legacy canvas alias that resolves the wrong semantic level. | rerouted | Extend and revalidate the existing authority spec for a bounded theme-hierarchy refinement. |
| 2026-08-04 21:49:00 UTC | 100-sg-spec | GPT-5 Codex | Extended the existing contract with explicit canvas/panel/control/interactive hierarchy, typography emphasis, first-paint, WCAG contrast, representative-state and no-layout-change requirements. | draft | Run readiness review for the refinement slice. |
| 2026-08-04 21:51:00 UTC | 101-sg-ready | GPT-5 Codex | Confirmed the refinement has a fixed site-led direction, canonical token owner, bounded consumers, preserved behavior, measurable contrast and visual proof, rollback path and no unresolved product or security decision. | ready | Implement the canonical hierarchy and representative consumer convergence. |
| 2026-08-04 21:58:00 UTC | 102-sg-start | GPT-5 Codex | Refined canonical light/dark depth, text, border, translucent surface, focus and elevation roles; corrected the desktop canvas alias; and applied representative panel hierarchy to onboarding and login without layout or behavior changes. | implemented | Collect rendered Windows evidence and run build, contrast, drift and accessibility-focused checks. |
| 2026-08-04 22:02:00 UTC | 006-sg-design | GPT-5 Codex | Captured rendered light/dark onboarding and desktop-shell states at 1440x900, confirmed resolved depth roles, and passed token, test, typecheck, Windows/site build and drift checks. Android rendered proof remains external. | partial | Retain the refinement and collect Android day/night rendered proof on the configured device or CI environment before cross-platform closure. |
| 2026-08-04 22:08:01 UTC | 006-sg-design | GPT-5 Codex | Migrated representative task, Kanban and CRM consumers onto the shared button, depth, border, shadow and semantic-status contracts; removed local DaisyUI action styling and legacy color/shadow paths. | implemented | Capture authenticated task/CRM states and collect Android rendered day/night proof before cross-platform closure. |
| 2026-08-04 20:36:35 UTC | 006-sg-design | GPT-5 Codex | Completed the focused light-mode migration pass: removed legacy purple and Catppuccin consumer overrides, mapped compatibility aliases and auth recovery UI to semantic roles, and enforced WCAG AA contrast for essential light/dark pairs in token validation. | implemented | Collect rendered Windows light-mode proof and compile/test Android day/night resources on the configured CI/device environment. |
| 2026-08-04 21:18:50 UTC | 405-sg-prod | GPT-5 Codex | Diagnosed the failing quality run as RustSec advisory RUSTSEC-2026-0235, upgraded and pinned `tauri-plugin-log` 2.9, removed the vulnerable `rkyv` 0.7 dependency chain, and reproduced every CI check locally. | repaired | Push the bounded dependency repair and confirm the replacement GitHub Actions run. |
| 2026-08-04 22:16:05 UTC | 006-sg-design | GPT-5 Codex | Aligned representative local network cards, badges and hover states with the shared depth/action roles, and removed local white and legacy shadow paths from the mobile settings toggle without changing network brand colors. | implemented | Collect authenticated Windows visual proof and Android day/night rendered proof before cross-platform closure. |
| 2026-08-04 22:19:40 UTC | 300-sg-docs | GPT-5 Codex | Corrected README, design-system authority and technical map to state the generated JSON-led carrier pipeline, current validation evidence and the measured residual drift scope. | updated | Keep the documentation aligned as additional consumers migrate; cross-platform rendered proof remains pending. |
| 2026-08-04 22:21:47 UTC | 006-sg-design | GPT-5 Codex | Migrated the post-authentication sync overlay from local light/dark palette declarations to the generated semantic surfaces, overlay, border, elevation and accent roles while preserving its responsive flow and transition behavior. | implemented | Collect authenticated Windows visual proof and Android day/night rendered proof before cross-platform closure. |
| 2026-08-04 22:26:30 UTC | 006-sg-design | GPT-5 Codex | Formalized the remaining shared extension-shell dimensions in the canonical token source, regenerated every platform carrier, and migrated the historical extension CSS to consume them. | implemented | Collect authenticated Windows visual proof and Android day/night rendered proof before cross-platform closure. |
| 2026-08-04 22:28:09 UTC | 006-sg-design | GPT-5 Codex | Corrected the extension carrier order so every historical extension entry loads the generated semantic tokens after legacy compatibility aliases, removing the remaining active palette divergence from Windows/Tauri. | implemented | Collect authenticated Windows visual proof and Android day/night rendered proof before cross-platform closure. |
| 2026-08-04 22:50:29 UTC | 006-sg-design | GPT-5 Codex | Migrated the historical feed components to semantic surface, spacing, border, sizing and state roles; Chrome build and changed-file drift validation confirm no newly introduced visual literals. | implemented | Collect authenticated Windows visual proof and Android day/night rendered proof before cross-platform closure. |
| 2026-08-12 17:44:40 UTC | 706-continue | GPT-5 Codex | Resumed the paused chantier and revised the spec with the CommunityGlows residual authority precondition, strict exceptions, non-overlapping consumer batches A/B/C, integration proof, accessibility, ZOMBIES, OWASP and documentation gates. | revised | Run `101-sg-ready` on the residual remediation revision before any authority or consumer write. |
| 2026-08-12 17:44:40 UTC | 100-sg-spec | GPT-5 Codex | Recorded the residual CommunityGlows token-consumption remediation: sequential canonical token/generator preparation, then bounded non-overlapping A/B/C consumer batches with integration ownership and proof gates. | revised | Run `101-sg-ready`; no implementation or readiness claim is made by this revision. |
| 2026-08-12 18:08:00 UTC | 101-sg-ready | GPT-5 Codex | Reviewed the residual CommunityGlows revision for canonical authority sequencing, isolated consumer batches, generated-output integrity, strict exceptions, behavior preservation, accessibility, Android proof gaps, proportional ZOMBIES and OWASP gates, and documentation coherence. | ready | Execute the sequential R0 authority and carrier reconciliation; do not start Batches A/B/C until R0 passes and freezes the authority inputs. |
| 2026-08-12 18:10:02 UTC | 101-sg-ready | GPT-5 Codex | Reconfirmed the residual CommunityGlows remediation is ready: R0 freezes canonical authority before non-overlapping A/B/C writes; behavior preservation, exact automated and visual proof, literal exceptions, Android gaps, ZOMBIES, OWASP and documentation gates are sufficient. | ready | Execute R0 only; begin A/B/C solely after the frozen authority checks pass. |
| 2026-08-13 22:00:30 UTC | 006-sg-design | GPT-5 Codex | Re-audited the multi-surface design-token and shared-component state after the 2026-08-13 UI unification. Canonical validation and carrier freshness pass; the refreshed inventory identifies unresolved consumer dimensions, wrapper escape paths, duplicate component families, one unused primitive signal, large component boundaries and missing post-unification rendered proof. | audited-partial | Re-run readiness against the refreshed baseline; reproduce the canonical drift scan in a supported Python environment before authorizing R0 or consumer writes. |
| 2026-08-13 22:15:06 UTC | 101-sg-ready | GPT-5 Codex | Reviewed the post-unification baseline against structure, execution, design-authority, proof, context and adversarial readiness gates. The outcome is resolved, but occurrence-level dispositions, component ownership, duplicate-family boundaries, wrapper guardrails, bounded target lists and rendered scenarios remain insufficient for safe implementation. | not ready | Revise the spec with all eight measurable recovery corrections, then repeat readiness review before any product-source write. |
| 2026-08-13 22:50:03 UTC | 100-sg-spec | GPT-5 Codex | Completed the post-unification recovery addendum with the canonical 78-result scanner ledger, all 20 shared-component owners, ten duplicate-family boundaries, wrapper guardrails, explicit A1/A2/A3/B/C targets, uv runtime recovery and cross-surface proof scenarios. | revised | Repeat readiness review against the completed recovery conditions. |
| 2026-08-13 22:50:03 UTC | 101-sg-ready | GPT-5 Codex | Re-reviewed the completed addendum against structure, design authority, execution isolation, exception integrity, component behavior ownership, proof scenarios, environment recovery, context sufficiency and adversarial bypasses. A fresh agent can now execute R0 without relying on conversation history; product remediation and rendered proof remain future work. | ready | Execute R0 only: freeze the authority, reproduce/classify the canonical and supplemental inventories, then open consumer batches only after both sequential gates pass. |
| 2026-08-13 22:58:18 UTC | 006-sg-design | GPT-5 Codex | Consolidated the delegated read-only execution audit: corrected `base.css` ownership, recorded two orphan component candidates, added the missing R0 role set, captured the targeted site 50/2 scan and scanner-invisible motion contracts, closed the SectionHeading font API, and classified the Android 35-finding set including the 36dp target-size blocker. | revised-draft | Re-run readiness against the expanded R0 authority roles, orphan dispositions, site inventory and Android accessibility gate before any product-source write. |
| 2026-08-13 22:59:23 UTC | 101-sg-ready | GPT-5 Codex | Re-reviewed the post-audit delta for autonomous execution, exact-value preservation, corrected batch ownership, orphan stop gates, closed site inventory, Android accessibility recovery, security proportionality and proof traceability. | ready | Execute R0 only; freeze the authority and occurrence ledger before opening the shared-component ownership gate or any A1/A2/A3/B/C consumer write. |
| 2026-08-13 23:01:40 UTC | 006-sg-design | GPT-5 Codex | Added the audited R0 semantic roles for legacy select padding, dropdown and site layers, dialog viewport widths, blog underline offset, and separate Android 44dp target/36dp glyph sizing; regenerated every carrier and proved validation, freshness and idempotence. | implemented | Freeze these authority inputs and complete the occurrence-classification gate before opening consumer batches. |
| 2026-08-13 23:13:36 UTC | 006-sg-design | GPT-5 Codex | Integrated R0 and consumer batches, corrected the Android active-state animation to scale the 36dp visual child rather than the 44dp hit-target wrapper, and passed token validation/generation/freshness/idempotence, 154 tests, core typecheck, lint with pre-existing warnings only, Chrome/Firefox/Tauri/site builds and drift inventories. Full scan retains 53 classified data-brand colors plus one popup protocol string; site scan retains only the 64rem media-query syntax exception. | implemented-pending-proof | Collect post-unification browser/Tauri visual and interaction evidence plus Android compile and day/night device evidence before verification or closure. |

## Current Chantier Flow

`006-sg-design delegated execution audit consolidated -> 101-sg-ready post-audit review ready -> R0 authority frozen -> ownership gate complete -> A1/A2/A3/B/C implemented -> automated integration validation passed -> rendered browser/Tauri and Android compile/device proof (next action) -> 103-sg-verify pending -> 104-sg-end pending -> 005-sg-ship pending`
