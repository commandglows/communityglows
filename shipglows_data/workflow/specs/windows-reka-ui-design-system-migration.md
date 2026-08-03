---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.1"
project: "socialglowz"
created: "2026-08-03"
created_at: "2026-08-03 04:30:00 UTC"
updated: "2026-08-03"
updated_at: "2026-08-03 20:08:45 UTC"
status: ready
source_skill: 100-sg-spec
source_model: "GPT-5 Codex"
scope: "windows-reka-ui-design-system-migration"
owner: "Diane"
confidence: high
user_story: "En tant qu'utilisatrice SocialGlowz sous Windows, je veux une application cohérente avec l'identité du produit et entièrement utilisable au clavier, afin de pouvoir naviguer rapidement sans dépendre d'une bibliothèque visuelle qui impose son style."
risk_level: high
security_impact: none
docs_impact: yes
linked_systems:
  - "src/ui/setup/pages/SocialGlowz/main.ts"
  - "src/ui/setup/pages/SocialGlowz/App.vue"
  - "src/ui/setup/pages/SocialGlowz/assets/main.css"
  - "src/ui/setup/pages/SocialGlowz/components/"
  - "src/stores/shortcuts.ts"
  - "site/src/styles/global.css"
  - "shipglows_data/technical/design-system-authority.md"
  - "package.json"
  - "pnpm-lock.yaml"
depends_on:
  - artifact: "shipglows_data/technical/design-system-authority.md"
    artifact_version: "1.1.0"
    required_status: "reviewed"
  - artifact: "shipglows_data/workflow/specs/windows-android-platform-parity.md"
    artifact_version: "1.0.1"
    required_status: "ready"
supersedes: []
evidence:
  - "PrimeVue is initialized globally in src/ui/setup/pages/SocialGlowz/main.ts and is imported by 34 source files."
  - "The Windows shell has concurrent visual authorities: PrimeVue Aura, main.css, App.vue overrides, and component-local CSS."
  - "The operator approved Reka UI directly for maintained accessibility primitives and SocialGlowz-owned visual wrappers, with keyboard navigation as a priority."
  - "Windows is the active delivery platform; Android must not receive a build or layout redesign as part of this migration."
next_step: "/101-sg-ready windows-reka-ui-design-system-migration"
---

# Windows Reka UI and Design-System Migration

## Title

Windows Reka UI and Design-System Migration

## Status

Ready. This is an incremental replacement of the Windows desktop component layer, not a visual redesign or a simultaneous mobile migration.

## User Story

En tant qu'utilisatrice SocialGlowz sous Windows, je veux une application cohérente avec l'identité du produit et entièrement utilisable au clavier, afin de pouvoir naviguer rapidement sans dépendre d'une bibliothèque visuelle qui impose son style.

Primary actor: an authenticated desktop user who switches networks, opens CRM, changes settings, and uses keyboard shortcuts.

Trigger: the user opens the Windows application, navigates sidebars or settings, interacts with dialogs and controls, or uses the keyboard without a pointer.

Observable result: Windows controls share SocialGlowz semantic tokens, expose correct names and states, retain predictable focus behavior, and no longer inherit PrimeVue visual defaults on migrated surfaces.

## Minimal Behavior Contract

Reka UI owns maintained accessibility behavior for complex controls: semantics, roving focus, Escape handling, focus restoration, and pattern-specific keyboard interaction. SocialGlowz wrappers own markup composition, variants, and consumption of one semantic CSS-token authority. A migrated control must preserve its public behavior and shortcuts while replacing its PrimeVue dependency. PrimeVue remains installed until every production consumer is migrated; removing it before that point is a regression. The easy failure to miss is a visually correct replacement that traps focus, loses focus after a dialog closes, or fires app-wide shortcuts while a text field is being edited.

## Success Behavior

- Windows uses Reka UI for newly migrated dialogs, tooltips, switches, select-like controls, and resizable panels where a maintained primitive exists.
- SocialGlowz owns the visible button, input, dialog, tooltip, switch, avatar, select, and splitter wrappers used by the Windows shell.
- The canonical semantic token layer defines light and dark colors, borders, elevation, radii, typography, focus rings, spacing, motion, and density; component CSS consumes these tokens rather than raw values.
- The site identity informs the shared semantic intent, but the existing Windows information architecture and layout remain unchanged.
- Tab and Shift+Tab order, Escape, dialog focus restoration, visible focus, disabled state, labels, and app shortcut suppression in editable fields work on every migrated surface.
- The primary Windows shell migration covers the left/right sidebars, their overlay reopen actions, settings, keyboard-shortcut editor, CRM toolbar, and signup prompt without relying on PrimeVue visual components.
- Existing network child-WebView behavior, routing, profile/session state, diagnostics, and desktop-only layout continue to work unchanged.

## Error Behavior

- A missing Reka primitive, invalid wrapper prop, or unsupported variant must fail during typecheck/build or retain the existing PrimeVue component; it must not silently degrade accessibility.
- Dialog and tooltip failures must leave the invoking control usable and must not block native WebView focus recovery.
- Global shortcuts must not execute when the event originates from editable controls, contenteditable regions, or an active shortcut recorder.
- A token migration must not add raw palette, shadow, spacing, or radius literals outside the canonical token source except named responsive/platform exceptions proven by the drift scan.
- If the migration exposes a mobile regression risk in a shared component, preserve the existing mobile rendering and document the deferred mobile-specific migration rather than changing Android layout opportunistically.

## Problem

PrimeVue currently supplies both interaction behavior and much of the visual language. Its global Aura preset conflicts with the product identity, while `main.css`, `App.vue`, and individual components duplicate token decisions. Copying a styled component kit would replace that dependency with another visual authority and would risk keyboard regressions. The Windows application needs a maintainable headless interaction layer plus product-owned wrappers, delivered in enough bounded slices to keep one final Windows installer test meaningful.

## Solution

Adopt `reka-ui` as the direct maintained headless primitive layer. Establish one SocialGlowz semantic-token authority for the Vue desktop shell, implement small typed wrappers around Reka UI primitives, then migrate visible Windows shell surfaces first. Retire PrimeVue only after import inventory, automated checks, and Windows installer proof show no remaining production consumers.

## Scope In

- Add `reka-ui` and use its official Vue primitives directly through local SocialGlowz wrappers.
- Consolidate the Vue desktop semantic token authority and document its relation to the public-site identity.
- Migrate the Windows shell and its controls in dependency order.
- Preserve and strengthen keyboard navigation, focus visibility, accessible names/states, and shortcut behavior.
- Add focused tests for wrapper behavior and shortcut-editing isolation.
- Remove PrimeVue bootstrap, theme, styles, and dependencies only when the final consumer inventory is empty.
- Build and validate Windows only; produce one installer after the completed migration slice.

## Scope Out

- Replacing Vue, Tauri, Pinia, routing, native WebView behavior, or the Windows left/right panel architecture.
- A visual redesign of the Windows information architecture.
- Android layout migration, Android APK builds, or mobile-native component rewrites.
- Copying Reka UI implementation into the repository or adopting shadcn-vue/Tailwind as a second application styling system.
- Removing PrimeVue before all active production consumers have a tested replacement.

## Constraints

- `src/ui/setup/pages/SocialGlowz/assets/main.css` becomes the Vue desktop semantic-token carrier; consumers use semantic variables, not provider-specific variables.
- `shipglows_data/technical/design-system-authority.md` records the canonical source, component bridge, visual ownership, and validation command before visual migration claims.
- Reka UI stays a maintained dependency. Wrappers may not expose arbitrary `style` or unrestricted class APIs that bypass tokens.
- Existing Windows structure, including sidebars and native WebView host measurement, is invariant.
- The current active Windows parity worktree changes are preserved and integrated; unrelated work is never reverted.
- Windows-only validation is intentional. Shared Vue code must remain compatible with the existing mobile branch, but no Android build is required for this chantier.
- Fresh dependency behavior is checked against official Reka UI documentation before choosing component APIs.

## Test Contract

Proof path: regression-first for existing Windows behavior, then scenario-first for keyboard/focus accessibility and evidence-first for token/visual authority.

Automated proof:

- unit tests for shortcut normalization and editable/recorder isolation;
- component tests where the repository's Vue test setup supports focus and Escape assertions;
- `pnpm test:once`;
- `pnpm lint:check` on the changed surface;
- `pnpm run tauri:build` and `git diff --check`;
- `python3 "${SHIPGLOWS_ROOT:-$HOME/shipglows}/tools/design_system_drift_check.py" --changed --format markdown` with documented responsive exceptions;
- an import inventory showing PrimeVue consumers are either migrated or explicitly outside this bounded slice.

Non-automated Windows installer proof after the completed slice:

- `WIN-A11Y-001`: Tab/Shift+Tab reaches shell controls in a logical order; focus is visible in light and dark themes.
- `WIN-A11Y-002`: dialog Escape closes it and returns focus to its trigger; tooltip/control names and states are announced correctly by Windows accessibility tooling where available.
- `WIN-A11Y-003`: arrows/Home/End work for every migrated composite pattern according to its Reka UI contract.
- `WIN-SHORTCUT-004`: global shortcuts work outside editors but never during text entry or shortcut recording.
- `WIN-SHELL-005`: hidden sidebar overlay controls reopen either sidebar; settings always overlays the native network WebView.
- `WIN-REGRESSION-006`: network opening, CRM routing, profile operations, diagnostics copy, and theme switching remain functional.

## Dependencies

- Vue 3.5, Vite 7, Tauri 2, Pinia, and the existing auto-import configuration remain fixed.
- `reka-ui` is the new maintained accessibility dependency. Fresh-docs checked against official Reka UI component documentation before implementation; APIs used must correspond to the installed package version.
- `primevue`, `@primeuix/themes`, `primeflex`, and `primeicons` remain temporary dependencies until their consumers are migrated. Their deletion is a final task, not a foundation task.
- The current Tauri Windows workflow remains the source of the installer artifact; Android workflow is not run for this chantier.

## Invariants

- A migrated control has an accessible name, state where applicable, keyboard behavior appropriate to its ARIA pattern, and visible focus in light and dark themes.
- Product-owned components consume semantic tokens only; provider themes cannot become a second visual authority.
- Global application shortcuts never preempt intentional text editing or shortcut capture.
- Sidebars, CRM, settings, network webviews, profiles, diagnostics, and routing retain their existing observable outcomes.
- Native WebView lifecycle and measured bounds are not coupled to a CSS-library migration.
- PrimeVue removal happens only once its source import inventory reaches zero outside archived code.

## Links & Consequences

- Product: Windows keeps its approved structure while gaining a coherent product identity and keyboard-first operation.
- Accessibility: maintained primitives reduce the risk of bespoke focus and keyboard behavior, but each wrapper still needs proof.
- Performance: direct headless primitives avoid shipping a competing visual theme after PrimeVue removal; bundle impact is measured at the final build.
- Maintainability: wrappers isolate Reka API changes and make future Windows controls consistently tokenized.
- Design: the project moves from parallel visual authorities to one documented desktop semantic authority; public-site convergence remains an explicit follow-up mapping rather than a false claim of existing equality.
- Operations: only one Windows installer should be requested once the full bounded migration slice and automated proof pass.

## Documentation Coherence

- Update `shipglows_data/technical/design-system-authority.md` with the Vue semantic source, site mapping status, Reka UI component bridge, forbidden bypasses, and proof commands.
- Update `README.md` only if the Windows keyboard/accessibility or dependency claims become user-facing.
- Update the Windows parity spec only for preserved behavior/proof links; do not duplicate this migration contract there.
- Record the final installer manual proof in the Windows QA checklist and changelog if the migration is released.

## Edge Cases

- Closing settings while a native child WebView is active must restore application focus without exposing the WebView above the modal.
- A sidebar hidden by keyboard must remain recoverable by an overlay button and the same shortcut.
- A dialog trigger is removed while its dialog is open; focus must fall back safely rather than remaining in a detached node.
- Tooltip and menu triggers must remain usable by touch/pointer and keyboard without duplicate global tap feedback.
- A shortcut recorder receives `Escape`, `Backspace`, modifier-only keys, an IME composition event, or a browser-reserved key combination.
- Light/dark switching while a dialog, tooltip, or native WebView is open keeps focus and token contrast valid.
- The app runs in extension/mobile contexts where a newly migrated shared component is imported but the Windows-only layout is not mounted.

## Implementation Tasks

- [x] Task 1: Establish the desktop token authority and migration inventory.
  - Files: `shipglows_data/technical/design-system-authority.md`, `src/ui/setup/pages/SocialGlowz/assets/main.css`, `src/ui/setup/pages/SocialGlowz/main.ts`, `package.json`.
  - Action: define the semantic token contract, document the site mapping gap truthfully, remove PrimeVue-specific token ownership from the desktop source, and record the complete PrimeVue import inventory by migration slice.
  - Validate with: design drift scan and dependency/import inventory. The authority and inventory are documented; all tokenizable changed-file drift is centralized, with only media-query and browser-window protocol exceptions remaining.

- [x] Task 2: Add Reka UI and product-owned base wrappers.
  - Files: `package.json`, `pnpm-lock.yaml`, `src/ui/setup/pages/SocialGlowz/components/ui/`.
  - Action: add Reka UI; create typed button, dialog, tooltip, switch, input/select, avatar, and splitter wrappers whose CSS consumes only semantic tokens.
  - Validate with: focused wrapper behavior tests and keyboard/focus scenarios. The complete Windows wrapper set is implemented and passes source, type, test, lint, and frontend build checks.

- [x] Task 3: Migrate the visible Windows shell.
  - Files: `AppSidebar.vue`, `AppRightSidebar.vue`, `AppSettings.vue`, `KeyboardShortcuts.vue`, `CrmToolbar.vue`, `SignupNudge.vue`, `NetworkWebviewHost.vue`, related CSS.
  - Action: replace PrimeVue usage in the Windows shell with wrappers or native semantic controls without altering panel layout or WebView behavior.
  - Validate with: shell regression scenarios, dialog focus restoration, overlay reopen controls, and shortcut isolation. Settings, shortcut controls, signup desktop dialog, CRM search, both sidebars, friends dialog, WebView diagnostics actions, and keyboard-resizable splitters are migrated and compile successfully.

- [x] Task 4: Migrate remaining production consumers in bounded groups.
  - Files: remaining imports under `src/ui/setup/pages/SocialGlowz/`, then legacy extension surfaces only when they share production startup.
  - Action: replace remaining PrimeVue components by wrapper type, retaining behavior and documenting any deferred non-Windows surface separately.
  - Validate with: zero active PrimeVue import inventory, each control pattern's keyboard contract, and project test/build checks. Windows source, generated declarations, and the clean Tauri bundle contain no PrimeVue runtime.

- [~] Task 5: Remove PrimeVue and finalise proof.
  - Files: `main.ts`, `package.json`, `pnpm-lock.yaml`, generated resolver types/configuration, docs and QA evidence.
  - Action: remove PrimeVue bootstrap/theme/styles/dependencies after zero-consumer confirmation; build the Windows installer, run the manual scenarios, and record bundle and accessibility evidence.
  - Validate with: Windows workflow installer, `WIN-A11Y-001` through `WIN-REGRESSION-006`, design drift scan, tests, lint, Tauri build, and clean diff. PrimeVue is removed from the Windows startup and bundle; package retention is limited to legacy extension surfaces. Automated proof passes, while installer and manual Windows scenarios remain pending.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-08-03 04:30:00 UTC | 100-sg-spec | GPT-5 Codex | Created dedicated Windows Reka UI and design-system migration contract from the approved direction. | draft | Readiness review, then implementation. |
| 2026-08-03 04:35:00 UTC | 101-sg-ready | GPT-5 Codex | Confirmed scope, interaction ownership, dependency freshness, proof contract, and Windows-only delivery boundary. | ready | Implement foundation and visible Windows shell migration. |
| 2026-08-03 05:05:00 UTC | 102-sg-start | GPT-5 Codex | Added Reka UI, semantic desktop tokens, dialog/switch wrappers, and migrated settings, shortcuts, signup dialog, and CRM search. | partial | Tokenize signup styles and migrate sidebars before Windows installer proof. |
| 2026-08-03 11:25:00 UTC | 102-sg-start | GPT-5 Codex | Completed the visible Windows shell migration with Reka splitters/dialogs/switches and SocialGlowz buttons/avatars; tokenized the signup surface. | implemented | Migrate remaining Windows business views, then remove PrimeVue and build one installer. |
| 2026-08-03 11:30:04 UTC | 103-sg-verify | GPT-5 Codex | Ran mode=excellence across correctness, keyboard/focus, token authority, diagnostics, docs, dependency inventory, automated checks, bug state, and manual proof. Repaired editable-target shortcut guards, visible splitter focus, dead PrimeVue CSS, dialog description wiring, token bypasses, and remaining Windows shell literals. | not verified | Finish tasks 2, 4, and 5; clear changed-file drift; build the Windows installer and execute WIN-A11Y/WIN-SETTINGS proof. |
| 2026-08-03 11:49:31 UTC | 706-continue | GPT-5 Codex | Migrated all remaining Button and Avatar imports in Windows business views to typed SocialGlowz wrappers; restored semantic variants and tokenized avatar sizing. | advanced | Migrate the remaining composite PrimeVue controls in bounded groups. |
| 2026-08-03 11:56:35 UTC | 706-continue | GPT-5 Codex | Migrated the final two business-view dialogs to the accessible Reka wrapper with tokenized legacy widths and successful regression proof. | advanced | Migrate text inputs and textareas to product-owned controls. |
| 2026-08-03 12:00:45 UTC | 706-continue | GPT-5 Codex | Added tokenized native input and textarea wrappers and migrated every explicit and auto-imported production consumer with accessible names. | advanced | Replace the privacy dropdown and file upload in the post composer. |
| 2026-08-03 12:02:48 UTC | 706-continue | GPT-5 Codex | Replaced the post privacy dropdown with an accessible Reka select and PrimeVue upload with a native file flow; repaired pre-mount picker timing and preserved the 10 MB limit. | advanced | Replace badge, horizontal scroll panel, and toast usage; audit auto-imported PrimeVue components. |
| 2026-08-03 12:27:24 UTC | 103-sg-verify | GPT-5 Codex | Ran mode=excellence on the complete Windows/Tauri migration; repaired avatar passthrough, selection synchronization, select attributes, button severity/loading semantics, password labels, notification tokens, reduced motion, dead PrimeVue selectors, and the remaining App token bridge. Source, generated declarations, and the clean frontend bundle contain no PrimeVue runtime. | not verified | Tokenize the remaining changed-file drift, then run the Windows keyboard/focus/dark-mode scenarios before closure. |
| 2026-08-03 12:34:44 UTC | 001-sg-build | GPT-5 Codex | Completed every active Windows component migration and centralized all tokenizable changed-file visual values. Automated lint, core typecheck, 101 tests, clean Tauri build, source/bundle inventories, and diff checks pass. | implemented | Produce the Windows installer and execute the manual keyboard, focus, notification, dark-mode, sidebar, and WebView scenarios. |
| 2026-08-03 14:24:58 UTC | 001-sg-build | GPT-5 Codex | Corrected all seven pre-build review findings: controlled splitter resizing, atomic upload limits, loading-button names, nested editable shortcut guards, sidebar tokens, icon-button names, and generated declaration scope. Independent rereview found no blocking issue. | implemented | Commit the bounded migration, trigger the Windows workflow, and run manual executable proof. |
| 2026-08-03 14:27:46 UTC | 005-sg-ship | GPT-5 Codex | Prepared the reviewed Windows Reka UI and design-system migration for commit, push, and the manual Windows installer workflow. | shipped | Complete the workflow build, then run the pending manual Windows executable scenarios. |
| 2026-08-03 18:58:28 UTC | 106-sg-fix | GPT-5 Codex | Fixed collapsed sidebar reopen handles being covered only by active native WebViews by reserving tokenized transparent edge rails outside the measured WebView bounds. | fixed-pending-verify | Build Windows and confirm both handles remain visible over each active network. |
| 2026-08-03 19:11:19 UTC | 102-sg-start | GPT-5 Codex | Replaced rejected full-height edge rails with a conditional horizontal control bar outside native WebView bounds; added persistent top/bottom placement in settings and retained both reopen handles. | implemented | Build Windows and verify bar placement plus both handles with an active network. |
| 2026-08-03 20:08:45 UTC | 300-sg-docs | GPT-5 Codex | Updated current internal documentation for the Reka UI wrappers, semantic token authority, Notivue and tooltip ownership, zero-PrimeVue Windows runtime, legacy extension dependency boundary, and ten drift exceptions. | documented | Keep manual Windows executable proof pending; migrate legacy `shipglows_data/` governance topology separately. |

## Current Chantier Flow

`100-sg-spec complete -> 101-sg-ready ready -> 102-sg-start implemented (configurable collapsed-panel control bar) -> 103-sg-verify partial (automated proof passed; active-WebView bar retest pending) -> 104-sg-end pending -> 005-sg-ship shipped (replacement Windows installer pending)`
