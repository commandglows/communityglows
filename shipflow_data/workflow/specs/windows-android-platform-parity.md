---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.1"
project: "socialglowz"
created: "2026-08-02"
created_at: "2026-08-02 19:17:45 UTC"
updated: "2026-08-02"
updated_at: "2026-08-02 20:20:00 UTC"
status: ready
source_skill: 100-sg-spec
source_model: "GPT-5 Codex"
scope: "windows-android-platform-parity"
owner: "Diane"
user_story: "En tant qu'utilisatrice SocialGlowz sur Windows ou Android, je veux retrouver les mêmes capacités essentielles de navigation, profils, sessions, réglages et sauvegarde, avec une adaptation native de la présentation, afin de pouvoir passer d'une plateforme à l'autre sans perdre de fonction ni de contexte."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "README.md"
  - "shipflow_data/technical/context.md"
  - "shipflow_data/technical/context-function-tree.md"
  - "shipflow_data/technical/android-webview-session-isolation.md"
  - "shipflow_data/workflow/tauri-mobile.md"
  - "shipflow_data/workflow/audits/2026-08-02-platform-parity-windows-android.md"
  - "src/ui/setup/pages/SocialGlowz/App.vue"
  - "src/ui/setup/pages/SocialGlowz/components/MobileLayout.vue"
  - "src/ui/setup/pages/SocialGlowz/components/AppSidebar.vue"
  - "src/ui/setup/pages/SocialGlowz/components/AppRightSidebar.vue"
  - "src/ui/setup/pages/SocialGlowz/components/MobileSettingsSheet.vue"
  - "src/ui/setup/pages/SocialGlowz/composables/useNetworkWebview.ts"
  - "src/ui/setup/pages/SocialGlowz/composables/useBackup.ts"
  - "src/stores/webviewState.ts"
  - "src/stores/profiles.ts"
  - "src/config/socialNetworks.ts"
  - "src-tauri/src/lib.rs"
  - "src-tauri/plugins/android-webview/src/mobile.rs"
  - "src-tauri/plugins/android-webview/android/src/main/java/com/socialglowz/webview/NativeWebViewPlugin.kt"
  - ".github/workflows/manual-build-windows.yml"
  - ".github/workflows/manual-build-android.yml"
depends_on:
  - artifact: "README.md"
    artifact_version: "unknown"
    required_status: "active"
  - artifact: "shipflow_data/technical/context.md"
    artifact_version: "1.2.0"
    required_status: "reviewed"
  - artifact: "shipflow_data/workflow/audits/2026-08-02-platform-parity-windows-android.md"
    artifact_version: "1.0.0"
    required_status: "open"
supersedes: []
evidence:
  - "User selected formalisation of the Windows/Android parity chantier after the 2026-08-02 platform audit."
  - "The audit identified P1 gaps in Windows embedded WebView settings, session lifecycle, profile surfaces, share links, and installer proof."
  - "Android native plugin implements bottom-bar networks, native profiles, WebView preferences, share intake, and multi-profile/fallback behavior."
  - "Desktop Rust handlers use filesystem-isolated child WebViews but keep several Android commands as no-ops or desktop-only adaptations."
next_step: "/102-sg-start windows-android-platform-parity"
---

# Windows / Android Platform Parity

## Title

Windows / Android Platform Parity

## Status

Ready for readiness review. Implementation must not begin by treating Android's mobile layout as the desktop layout: Windows keeps the left/right panel structure, while the capability contract, state model, visual language, and failure behavior become equivalent.

## User Story

En tant qu'utilisatrice SocialGlowz sur Windows ou Android, je veux retrouver les mêmes capacités essentielles de navigation, profils, sessions, réglages et sauvegarde, avec une adaptation native de la présentation, afin de pouvoir passer d'une plateforme à l'autre sans perdre de fonction ni de contexte.

Primary actor: authenticated SocialGlowz user managing several social-network sessions and profiles.

Trigger: the user opens SocialGlowz, selects a network, switches profile/network, changes a setting, receives a social link, or restores a backup on Windows or Android.

Observable result: the same catalog, profile state, session boundary, settings intent, recovery path, and backup contract are available on both platforms. Differences remain limited to native presentation or an OS constraint that is visible, deliberate, and tested.

## Minimal Behavior Contract

Windows and Android must expose the same essential SocialGlowz capabilities through their shared Vue state and platform-native WebView hosts: network launch and switching, profile selection, per-profile/network session isolation, theme/grayscale/text-zoom settings, navigation back, backup/restore, locale, and supported link intake. Windows may keep its desktop header and left/right panels while Android keeps its mobile shell and native bottom bar, but neither platform may silently no-op a shared control or claim stronger session/settings behavior than it provides. The easiest edge case to miss is that CSS applied to the Vue shell does not automatically affect a native child WebView, and that Android fallback devices do not provide the same isolation as multi-profile WebKit.

## Success Behavior

- The same canonical network catalog from `src/config/socialNetworks.ts` drives Windows and Android launch surfaces.
- A network click opens a visible native WebView with correct bounds on Windows and a visible full-screen/session host on Android.
- Switching A -> B -> A preserves the correct profile/network session on both platforms; a Windows fresh-install manual test proves the desktop bounds fix and session boundary.
- Profile changes update visible networks and active profile context in the platform-native control surface.
- Dark mode, grayscale, and text zoom have an explicit, verified scope covering both the Vue shell and the embedded network view; controls never imply unsupported coverage.
- Back/close returns from the network view to the SocialGlowz shell without orphaning a native WebView.
- Backup/restore completes or returns a visible recoverable error without silently losing session data.
- Android shared links and Windows supported link intake resolve the same network mapping, or the desktop fallback is explicitly presented.
- The shared visual contract uses the same semantic colors, surfaces, borders, shadows, radii, states, and typography intent; native Android values are mapped from the canonical token authority.
- A manual Windows installer checklist and Android APK checklist provide evidence for every `unknown` or `degraded-accepted` audit cell before closure.

## Error Behavior

- If a Windows WebView host has zero or invalid bounds, opening fails visibly in diagnostics and does not leave an invisible native child host behind.
- If a requested network is not in the canonical allowlist, the action is rejected without navigation or session mutation.
- If a target session is missing, stale, or evicted, the platform recreates it from the correct profile/network key rather than showing another session.
- If Android multi-profile WebKit is unavailable, Android enters the documented single-WebView fallback; the UI and QA record must not claim full multi-WebView isolation.
- If a setting cannot be applied to an embedded WebView on Windows, the user sees an explicit limitation or the setting is scoped to the shell; silent success is forbidden.
- If an incoming Windows link cannot be associated with the app, the user receives a documented copy/paste or open-in-app fallback rather than a dropped action.
- If backup import fails password, integrity, version, or filesystem validation, existing data remains unchanged and the error is recoverable.
- Native bridge errors must be logged without cookies, tokens, localStorage, raw profile identifiers, or sensitive query parameters.

## Problem

The project declares Windows desktop and Android as production Tauri targets and shares a Vue codebase, but the current capability parity is incomplete. Android has a dedicated Kotlin WebView plugin with native bottom-bar navigation, profile popup, haptics, tap sounds, text zoom, dark mode, grayscale, share intake, multi-profile detection, fallback mode, and bounded WebView pooling. Windows uses Tauri child WebViews and filesystem session directories, but several corresponding commands are no-ops, the embedded WebView settings are not applied, the desktop profile surface contains placeholder data, incoming share handling is absent, and the latest Windows WebView fix lacks an installer retest.

The prior assumption that shared Vue components and common CSS variables automatically provide platform parity is false. Native hosts, child WebViews, settings propagation, resource lifecycle, link intake, and proof paths are separate contracts.

## Solution

Create a platform capability layer and verification contract around the existing shared stores and network catalog. Keep the Windows desktop structure and Android mobile adaptation, but align the behaviors behind them. Implement or explicitly scope native settings, profile/network controls, WebView lifecycle, back navigation, share intake, backup behavior, and design-token mapping. Add platform-specific manual QA artifacts and make release claims depend on fresh Windows installer and Android APK proof.

## Scope In

- Windows and Android SocialGlowz shell capability matrix.
- Network launch, switch, resize, hide/show, close, and back behavior.
- Profile selection, active profile synchronization, and hidden-network synchronization.
- Per-profile/network session isolation and deletion semantics.
- Windows WebView pool/resource bound aligned with Android's bounded behavior.
- Dark mode, grayscale, text zoom, locale, haptics, and tap-sound capability policy.
- Windows link intake equivalent or explicit fallback; Android share/deep-link preservation.
- Backup/restore parity and platform-specific session-data coverage.
- Canonical design-token authority and Android native token mapping.
- Automated tests, Windows installer QA, Android APK QA, CI artifact guidance, and claim/documentation updates.

## Scope Out

- Replacing Vue with Flutter, React Native, or a separate desktop/mobile codebase.
- Replacing the Windows panel structure or Android native bottom-bar adaptation solely for visual symmetry.
- Automating third-party social-network interfaces, bypassing consent, or changing network terms compliance.
- Promising identical browser internals where Android WebKit or Windows WebView2 impose different capabilities.
- Full isolation of browser stores that Android fallback mode cannot isolate without a process-level architecture.
- iOS parity beyond documenting it as a separate planned target.
- Extension parity; it remains governed by `extension-tauri-feature-parity.md`.

## Constraints

- `src/config/socialNetworks.ts` remains the source of truth for built-in network metadata, URLs, origins, and visual metadata.
- Shared Pinia stores and cloud sync remain the source of truth for profiles, hidden networks, onboarding, settings, and auth state.
- Tauri IPC remains encapsulated in composables/services and never leaks into extension-only surfaces.
- The canonical session identity is `${profileId}-${networkId}` on both platforms.
- Windows desktop native child WebViews must receive positive measured bounds after Vue mount and during resize/switch.
- Android must preserve explicit multi-profile and fallback modes; no unsupported device may be treated as fully isolated.
- Native logs must be safe by default and omit user/session secrets.
- Existing security validation for HTTPS network URLs, Android OAuth callbacks, backup encryption, and storage-origin allowlists must remain intact.
- Design implementation must use the project token authority and a documented Vue-to-native mapping; new local raw palette/shadow values require a justified exception.
- User-facing settings must not silently report success when only the Vue shell changed.

## Test Contract

Surface/stack profile: Vue 3 + Pinia + PrimeVue shell, Tauri 2 Rust host, Windows WebView2 child WebViews, Android Kotlin WebView plugin, Convex optional sync, GitHub Actions artifact builds.

Automated proof:

- composable tests for WebView measurement, switch/open behavior, and invalid bounds;
- unit tests for capability detection and shared network/session mapping;
- Vue build/Tauri frontend build;
- Rust compile/check where the platform toolchain permits;
- Android Kotlin/Rust plugin compile through the Android workflow;
- design-token drift check and `git diff --check`;
- documentation/metadata validation for the parity spec and QA checklists.

Non-automated proof:

- fresh Windows installer installed on a real Windows machine;
- fresh Android APK installed on a real Android device;
- network launch and switching across representative networks;
- profile/session isolation using one localStorage-heavy network and one cookie-heavy network;
- settings propagation into shell and embedded WebViews;
- native back, share/link intake, backup/restore, and resource eviction;
- light/dark visual comparison against the canonical token contract.

Ordered proof path: automated tests -> Vue/Tauri build -> Android APK build -> Windows installer build -> Windows manual QA -> Android device QA -> documentation/claim verification -> bounded ship.

Required scenario IDs and results:

- `WIN-LAUNCH-001`: every canonical WebView network opens visibly from a fresh Windows installer.
- `WIN-SESSION-002`: Profile A/B same-network isolation survives switch, restart, and deletion.
- `WIN-SETTINGS-003`: dark mode, grayscale, and text zoom produce the documented shell/WebView result.
- `WIN-LIFECYCLE-004`: resize, switch, back, close, eviction, and profile deletion leave no orphan host.
- `ANDROID-NATIVE-005`: bottom bar, profile popup, back, haptics, tap sound, zoom, grayscale, dark mode, and locale work on the APK.
- `ANDROID-SESSION-006`: multi-profile or explicit fallback mode is recorded with CinderReels and a cookie-heavy network.
- `SHARE-007`: Android share/deep link and Windows supported fallback select the correct network on cold and warm start.
- `BACKUP-008`: valid, invalid, wrong-password, and incompatible backup cases are safe on both platforms.
- `DESIGN-009`: light/dark screenshots or device captures match the semantic token mapping for surfaces, borders, shadows, states, and focus.

Required result: each scenario records `passed`, `failed`, or `degraded-accepted` with platform, artifact commit, environment, and evidence. Any P1 failure blocks the parity claim.

Manual evidence paths:

- `shipflow_data/workflow/test-checklists/windows-android-platform-parity.md`
- Windows stable manual installer URL from `manual-build-windows.yml`.
- Android `socialglowz-android-debug` or `socialglowz-android-release` artifact from `manual-build-android.yml`.

Exception-with-proof: Windows has no Android-style native bottom bar or haptic hardware contract. The desktop tray and desktop shell are acceptable adaptations only when the equivalent user intent is demonstrated and the limitation is documented.

Design-system authority: `src/ui/setup/pages/SocialGlowz/App.vue` and `src/ui/setup/pages/SocialGlowz/assets/main.css` are the current Vue semantic-token carriers; `NativeWebViewPlugin.kt` is the Android native theme carrier. Task 6 must make the mapping explicit, keep component/layout authority in the Vue shell, forbid new component-local raw palette/shadow values without an exception, and validate with the project design drift checker plus representative light/dark captures.

## Dependencies

- `Vue 3`, `Pinia`, `PrimeVue`, `vue-i18n`, `@tauri-apps/api` 2.x, and Tauri Rust 2.x are fixed project dependencies.
- Android WebView plugin and AndroidX WebKit behavior govern multi-profile support and fallback mode.
- Windows WebView2 child WebView bounds and data-directory behavior govern desktop rendering and isolation.
- GitHub Actions Windows and Android workflows are the authoritative artifact path for manual platform proof.
- Fresh-docs checked on 2026-08-02 against official Vue `nextTick` documentation and official Tauri WebView API documentation for the current WebView lifecycle assumptions.
- No external API, auth-provider, database migration, or payment change is introduced by this spec.

## Invariants

- The same profile ID and network ID always resolve to the same logical session boundary.
- Switching networks never mutates the wrong profile's session or hidden-network list.
- URL validation and storage-origin allowlists remain enforced before native navigation.
- Backup import is atomic with respect to existing sessions.
- Android fallback limitations remain visible in technical documentation and QA records.
- Windows and Android use the same canonical network catalog and shared cloud/local settings state.
- Native WebView children never remain orphaned after close, profile deletion, or failed switch.
- User-facing product claims cannot be upgraded from `unknown` to supported without platform proof.

## Links & Consequences

- Product: Windows becomes a credible production target instead of a shell that only partially mirrors Android.
- Privacy/security: session leakage risk is reduced by explicit isolation tests and safe fallback claims.
- Performance: Windows needs bounded native WebView lifecycle; Android keeps its existing bounded pool and fallback.
- UX: desktop panels remain structurally different, but controls and outcomes become predictable across platforms.
- Design: Vue and Android native surfaces need a shared semantic token contract rather than duplicated palette guesses.
- Operations: every parity release requires two manually installable artifacts and platform-specific evidence.
- Documentation: README, context docs, operator workflow, and platform claims must reflect verified limits.
- Observability: native errors and degraded mode selection need safe diagnostics sufficient to distinguish missing capability from user/network failure.

## Documentation Coherence

Update after implementation and verification:

- `README.md`: accurate Windows/Android capability claims and limitations.
- `shipflow_data/technical/context.md`: native host and parity contract.
- `shipflow_data/technical/android-webview-session-isolation.md`: align Windows comparison and fallback boundaries.
- `shipflow_data/workflow/tauri-mobile.md`: Windows/Android artifact and QA instructions.
- `shipflow_data/workflow/test-checklists/windows-android-platform-parity.md`: executed manual proof.
- `shipflow_data/workflow/audits/2026-08-02-platform-parity-windows-android.md`: update verdict cells only after evidence.
- `CHANGELOG.md` if the verified behavior changes user-visible platform support.

## Edge Cases

- Vue measures the Windows WebView host before mount and receives zero bounds.
- A user resizes either desktop panel while a native WebView is visible.
- A network switch races with profile switching or a pending WebView creation.
- A hidden WebView is evicted while the user requests it again.
- A profile is deleted while one of its native WebViews is visible or hidden.
- Android device lacks `MULTI_PROFILE` or changes WebView provider after installation.
- Dark mode/grayscale/text zoom changes while a third-party network is loading.
- Shared link arrives during cold start, onboarding, locked session, or unauthenticated state.
- Backup includes a session type whose browser storage is not covered by the platform snapshot.
- Hidden network state changes while the native Android bar or Windows tray is open.
- Windows installer is built from a commit that contains uncommitted local parity work.

## Implementation Tasks

- [x] Task 1: Create the explicit platform capability contract.
  - File: `src/platform/capabilities.ts`, `src/ui/setup/pages/SocialGlowz/composables/`
  - Action: Add typed capabilities for desktop WebView preferences, native feedback, share/link intake, profile controls, and session lifecycle; replace scattered user-agent/no-op assumptions with one guarded adapter.
  - User story link: shared settings and navigation must expose truthful capabilities.
  - Depends on: none.
  - Validate with: capability unit tests for Windows Tauri, Android Tauri, Chrome, Firefox, and plain Vue runtime.

- [ ] Task 2: Finish Windows network launch and native WebView lifecycle.
  - Files: `src/ui/setup/pages/SocialGlowz/composables/useNetworkWebview.ts`, `src/ui/setup/pages/SocialGlowz/components/NetworkWebviewHost.vue`, `src-tauri/src/lib.rs`
  - Action: preserve positive-bounds measurement, make resize/switch/close/back failure states observable, add bounded hidden-child lifecycle/eviction, and ensure profile deletion closes affected hosts before deleting data directories.
  - User story link: every network click and switch must remain visible, isolated, and recoverable.
  - Depends on: Task 1.
  - Validate with: composable regression tests, Rust build, Windows installer manual checklist, repeated network/profile switching.

- [ ] Task 3: Replace desktop placeholder profile behavior.
  - Files: `src/ui/setup/pages/SocialGlowz/components/AppSidebar.vue`, `src/ui/setup/pages/SocialGlowz/components/AppRightSidebar.vue`, shared profile components/stores as needed.
  - Action: render the active profile from `profilesStore`, expose discoverable profile creation, switch, and manage actions, and keep hidden-network state consistent with the active profile.
  - User story link: profile context must be the same on both platforms.
  - Depends on: Task 1.
  - Validate with: Vue component tests or focused interaction tests plus Windows manual profile switching.

- [ ] Task 4: Align settings behavior across shell and embedded WebViews.
  - Files: `src/ui/setup/pages/SocialGlowz/components/AppSettings.vue`, `src/ui/setup/pages/SocialGlowz/components/MobileSettingsSheet.vue`, `src/ui/setup/pages/SocialGlowz/composables/`, `src-tauri/src/lib.rs`, Android plugin files.
  - Action: hide the active Windows child WebView while a Vue settings overlay is visible and restore the same warm session on close; implement Windows WebView2 equivalents for dark mode, grayscale, and text zoom where supported; otherwise scope controls visibly to the shell and record the limitation. Keep Android behavior and fallback diagnostics intact.
  - User story link: settings must do what their labels promise on each platform.
  - Depends on: Task 1 and Task 2.
  - Validate with: settings tests, Windows WebView manual checks, Android device checks, safe degraded-mode logs.

- [x] Task 5: Align navigation, profile/network surfaces, and link intake.
  - Files: `src/ui/setup/pages/SocialGlowz/App.vue`, `src/ui/setup/pages/SocialGlowz/components/MobileLayout.vue`, `src-tauri/src/lib.rs`, Android plugin, platform adapter files.
  - Action: define desktop back/close behavior, preserve Android system/native back, add a Windows protocol/share or explicit copy/paste fallback, and map both platform surfaces to the same network/profile actions.
  - User story link: users can enter, leave, and reopen the same network context from either OS.
  - Depends on: Task 1.
  - Validate with: cold-start, warm-start, unauthenticated, onboarding, and authenticated link-intake tests on both platforms.

- [ ] Task 6: Establish one visual token authority and native mapping.
  - Files: `src/ui/setup/pages/SocialGlowz/App.vue`, `src/ui/setup/pages/SocialGlowz/assets/main.css`, Android plugin theme/token carrier, design documentation.
  - Action: define semantic colors, surfaces, borders, shadows, radii, typography roles, active/hover/focus states, and motion policy once; map Android native values to those tokens and preserve the Windows panel structure.
  - User story link: the two apps should feel like the same product even when their layouts differ.
  - Depends on: Task 1.
  - Validate with: design drift check, light/dark screenshots or device comparison, contrast/focus checks, and token mapping review.

- [x] Task 7: Align backup/session deletion semantics and diagnostics.
  - Files: `src/ui/setup/pages/SocialGlowz/composables/useBackup.ts`, `src-tauri/src/lib.rs`, Android plugin, backup docs.
  - Action: ensure both platforms report covered storage types, close live hosts before destructive session deletion, preserve atomic restore behavior, and emit safe diagnostic identifiers for failures.
  - User story link: users can recover data without leaking or silently losing sessions.
  - Depends on: Task 2 and Task 4.
  - Validate with: backup unit tests, corrupted/password/version cases, Windows installer restore, Android APK restore, and log redaction review.

- [ ] Task 8: Execute platform QA and update claims.
  - Files: `shipflow_data/workflow/test-checklists/windows-android-platform-parity.md`, `README.md`, `shipflow_data/technical/context.md`, `shipflow_data/workflow/tauri-mobile.md`, audit report.
  - Action: build fresh Windows and Android artifacts, execute the full checklist, change parity verdicts only from evidence, and update public/internal claims to match.
  - User story link: the user can trust that production platform support is verified.
  - Depends on: Tasks 1-7.
  - Validate with: successful CI workflows, installed artifacts, executed checklist, and documentation review.

## Acceptance Criteria

- [ ] AC1: Given a fresh Windows installer, when the user clicks every supported webview network, then the native child WebView is visible, correctly bounded, and associated with the selected network.
- [ ] AC2: Given a Windows resize or panel switch, when the central host dimensions change, then the visible child WebView follows the host without becoming zero-sized or orphaned.
- [ ] AC3: Given Profile A and Profile B, when the user opens the same network under each profile, then each profile returns to its own session on Windows and Android; the Android fallback limitation is reported when applicable.
- [ ] AC4: Given a profile deletion, when its session is active or hidden, then affected native hosts are closed before data deletion and unrelated profile/network sessions remain intact.
- [ ] AC5: Given a user changes dark mode, grayscale, or text zoom, when a network WebView is visible, then the setting either affects the embedded view as specified or the UI clearly states that it applies only to the shell.
- [ ] AC6: Given a user switches network/profile repeatedly, when a host is warm or evicted, then the platform shows the correct session and stays within its documented native WebView resource bound.
- [ ] AC7: Given a user presses back or close from a network view, when the platform event is delivered, then SocialGlowz returns to the shell without leaving a visible or hidden orphan host.
- [ ] AC8: Given a supported social URL is shared or opened through the supported Windows fallback, when the app is cold or warm, then the correct network is selected without losing auth/onboarding state.
- [ ] AC9: Given a backup is exported and restored on each platform, when the password and archive are valid, then settings and covered session data return; invalid archives leave existing data unchanged.
- [ ] AC10: Given light and dark themes, when the shell and native controls are compared, then semantic colors, surfaces, borders, shadows, radii, focus states, and active states follow the documented token mapping.
- [ ] AC11: Given the manual parity checklist is executed, when any capability lacks proof, then the corresponding platform claim remains `unknown` or explicitly degraded and the release is not presented as fully verified.
- [ ] AC12: Given the final verified implementation, when README and technical docs are read, then they describe Windows and Android capabilities and limitations consistently.

## Test Strategy

Automated:

- Extend `useNetworkWebview` tests for mount timing, positive bounds, switch fallback, close, and failure recovery.
- Add capability adapter tests covering Windows Tauri, Android Tauri, extension, and browser-only contexts.
- Add store/component tests for active profile rendering, hidden-network synchronization, and network catalog mapping.
- Run `pnpm test:once`, `pnpm typecheck` or the documented bounded typecheck, `pnpm tauri:build`, and Rust checks where available.
- Run design drift and metadata/documentation checks.

Windows manual:

- Install the fresh `.exe` from the successful manual workflow.
- Open representative networks, resize both sidebars, switch A -> B -> A, close/reopen, and restart the app.
- Verify Profile A/B isolation with a cookie-heavy network and a localStorage-heavy network.
- Verify dark mode, grayscale, text zoom, backup/restore, profile visibility, tray actions, and back/close.
- Record WebView failures, orphan windows, memory/resource behavior, and safe diagnostic output.

Android manual:

- Install a fresh debug APK from the successful manual workflow.
- Verify bottom bar, profile popup, system/native back, share/deep link cold start, haptics/tap sound, dark mode, grayscale, zoom, backup/restore, and locale.
- Test multi-profile mode and explicit fallback mode where possible.
- Verify warm switching, LRU eviction, profile deletion, and session isolation with CinderReels plus one cookie-heavy network.

Release gate:

- No `unknown` P1 capability may be silently promoted to supported.
- Windows and Android artifacts must be built from the same reviewed commit.
- The executed checklist and updated docs are required before ship approval.

## Risks

- Windows WebView2 may not expose an exact equivalent for every Android WebView setting; the product contract must distinguish equivalent behavior from shell-only adaptation.
- Desktop hidden child WebViews can consume significant memory if pooling is unbounded.
- Android WebKit provider support is device-dependent; fallback mode may remain degraded.
- Native share/protocol integration can affect OS registration, permissions, and installer behavior.
- Token mapping between Vue CSS and Kotlin native views can drift without visual regression evidence.
- Current dirty local worktree contains in-progress WebView and design changes; implementation must preserve and review them rather than overwrite them.
- Manual device/installer proof cannot be replaced by a frontend build.

## Execution Notes

- Development mode: hybrid; local code/build checks are useful, but installed GitHub Actions artifacts are authoritative for Windows and Android platform proof.
- Recommended execution order: readiness review -> capability contract -> Windows WebView/session foundation -> settings/profile/link parity -> design mapping -> platform QA -> documentation and bounded ship.
- Fresh-docs checked: official Vue `nextTick` API and official Tauri WebView API were consulted for the current bounds/lifecycle fix. Android WebKit behavior remains governed by the existing Android architecture docs and must be rechecked if the native pooling design changes.
- Observability requirement: native diagnostics may identify platform, capability, session state class, and failure category; they must not include cookies, tokens, localStorage, raw account IDs, or sensitive URLs.
- Paris/UTC build headers and release metadata remain governed by the existing CI/release workflow.

## Open Questions

None blocking readiness. The implementation owner may choose the exact Windows native mechanism for dark mode, grayscale, text zoom, and share intake, but must preserve the acceptance criteria and explicitly document any platform-required degradation.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-08-02 19:17:45 UTC | 100-sg-spec | GPT-5 Codex | Formalized the Windows/Android parity audit into an implementation contract with P1/P2 priorities, native-host boundaries, design-token authority, and installer/APK proof gates. | drafted | 101-sg-ready |
| 2026-08-02 19:24:00 UTC | 101-sg-ready | GPT-5 Codex | Reviewed structure, user-story fit, scope, security/session boundaries, design authority, task ordering, scenarios, and platform proof contract; added explicit scenario IDs and token authority. | ready | 102-sg-start |
| 2026-08-02 19:45:00 UTC | 102-sg-start | GPT-5 Codex | Implemented measured Windows child-WebView bounds, bounded hidden-host eviction, profile/session cleanup, embedded preference propagation, desktop deep-link registration, and native back cleanup without changing the panel layout or token styling. | partial-implemented | 103-sg-verify |
| 2026-08-02 19:50:00 UTC | 004-sg-deploy | GPT-5 Codex | Pushed `a61c366` to `master`; Windows installer and Android debug APK workflows completed successfully. Manual installer/device proof remains pending. | partial | 103-sg-verify |
| 2026-08-02 20:10:00 UTC | 102-sg-start | GPT-5 Codex | Added explicit Windows/Android capability detection, single-instance warm deep-link routing, atomic backup restore with archive path validation, and targeted regression coverage; no visual layout or token changes. | partial-implemented | 103-sg-verify |
| 2026-08-02 20:20:00 UTC | 102-sg-start | GPT-5 Codex | Rebuilt Windows installer and Android debug APK from `98b6dae`; both platform workflows passed after adding the desktop single-instance bridge and atomic restore changes. | partial-implemented | 107-sg-test |
| 2026-08-02 20:23:00 UTC | 003-sg-bug / 106-sg-fix | GPT-5 Codex | Reopened Windows network launch after the installed `98b6dae` build still showed no WebView. Identified Tauri's documented Windows deadlock for synchronous `WebviewBuilder` commands, made desktop creation asynchronous, and added a visible retry state. Android was intentionally excluded from this cycle. | fix-attempted | Windows-only CI build and installer retest |
| 2026-08-02 21:08:46 UTC | 602-sg-platform-parity | GPT-5 Codex | Re-audited Windows against Android after the failed installer retest and new diagnostics work. Confirmed Windows launch, session, preferences and backup remain proof-gated; identified the `AppRightSidebar` placeholder profile as an implementation gap; recorded a Windows-only continuation matrix. | partial | `001-sg-build` for desktop profile completion, then `107-sg-test` for Windows installer proof |
| 2026-08-02 21:30:00 UTC | 001-sg-build / 102-sg-start | GPT-5 Codex | Replaced the desktop right-panel placeholder identity with the active profile data and reused the profile switch/manage control. Kept the Windows panel structure and existing component/token authority. | implemented | Windows-only installer build and manual parity checklist |
| 2026-08-02 21:32:00 UTC | 001-sg-build / 102-sg-start | GPT-5 Codex | Serialized desktop WebView transitions and made resize/hide failures observable through the safe diagnostic report, covering rapid switching before the next Windows installer test. | implemented | Windows-only installer build and combined manual test session |
| 2026-08-02 21:38:00 UTC | 004-sg-deploy | GPT-5 Codex | Pushed `2148da3` and built the Windows installer only. The manual workflow completed successfully and replaced the stable `windows-latest` executable; Android was not built. | partial | One combined Windows manual test session |
| 2026-08-02 22:07:00 UTC | 309-sg-tasks / 003-sg-bug / 106-sg-fix | GPT-5 Codex | Recorded the passed Windows launch, rapid-switch, and resize retest; reopened desktop profile and settings tasks after the operator found no direct profile-creation action and a native WebView over the settings sheet. Implemented a warm WebView suspend/resume path and direct profile creation action; Android remains excluded. | implemented-pending-manual | Build one Windows-only installer, then manually verify settings visibility/restoration and profile creation/isolation. |

## Current Chantier Flow

- `100-sg-spec`: complete — durable parity contract created from the platform audit and user-selected formalisation.
- `101-sg-ready`: complete — scope, security, design, implementation ordering, and installer/APK proof contract are ready.
- `102-sg-start`: implemented — native lifecycle, settings propagation, deletion cleanup, desktop protocol registration, warm links, capability contract, atomic restore, safe diagnostics, and desktop profile surface are coded; Windows settings overlay and direct profile creation are pending installer proof.
- `004-sg-deploy`: partial — artifacts built successfully from `a61c366`; manual Windows/Android verification remains.
- `103-sg-verify`: pending implementation.
- `104-sg-end`: pending verified outcome.
- `005-sg-ship`: pending bounded ship after platform proof.
