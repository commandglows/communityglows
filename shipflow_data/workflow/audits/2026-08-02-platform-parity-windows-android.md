---
artifact: audit
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "socialglowz"
created: "2026-08-02"
updated: "2026-08-02"
status: open
source_skill: 602-sg-platform-parity
scope: "windows-android"
owner: "Diane"
confidence: medium
risk_level: high
security_impact: medium
docs_impact: yes
linked_systems:
  - "README.md"
  - "shipflow_data/technical/context.md"
  - "src/ui/setup/pages/SocialGlowz/App.vue"
  - "src/ui/setup/pages/SocialGlowz/components/MobileLayout.vue"
  - "src-tauri/src/lib.rs"
  - "src-tauri/plugins/android-webview/android/src/main/java/com/socialglowz/webview/NativeWebViewPlugin.kt"
  - ".github/workflows/manual-build-windows.yml"
  - ".github/workflows/manual-build-android.yml"
depends_on: []
supersedes: []
evidence:
  - "Windows and Android are both declared as production Tauri targets in README.md."
  - "The shared Vue shell branches to MobileLayout at <=768px and to header/sidebar desktop layout otherwise in App.vue."
  - "Android native WebView behavior is implemented in NativeWebViewPlugin.kt; desktop behavior is implemented in src-tauri/src/lib.rs."
next_step: "/100-sg-spec windows-android-platform-parity"
---

# Audit Windows / Android Platform Parity

## Verdict

Windows is not at feature parity with Android. The shared Vue business state and network catalog are present, but several Android native capabilities are either absent on Windows, silently no-op, or lack equivalent desktop behavior and proof. The desktop shell is an intentional structural adaptation, but the functional adaptations are not yet explicit or complete.

## Parity Matrix

| Capability | User expectation | Platform | Verdict | Evidence | Gap | Owner route | QA route | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Shared auth, onboarding, profiles state, Convex sync | Same account and synced settings model | Windows | same | `App.vue` boot, `hydrateCloudState`, shared Pinia stores | test-proof | 103-sg-verify | 107-sg-test | No Windows manual proof recorded in this audit. |
| Shared auth, onboarding, profiles state, Convex sync | Same account and synced settings model | Android | same | `App.vue`, `MobileLayout.vue`, shared stores | test-proof | 103-sg-verify | 107-sg-test | Android build exists, device proof is separate. |
| Main shell layout | Usable platform-native navigation | Windows | adapted-required | Desktop header + left/right Splitter panels in `App.vue`, `AppSidebar.vue`, `AppRightSidebar.vue` | shared-ui | 001-sg-build | 107-sg-test | Structural difference is acceptable if the same capabilities are exposed. |
| Main shell layout | Usable platform-native navigation | Android | adapted-required | `MobileLayout.vue`, native Android bottom bar in `NativeWebViewPlugin.kt` | shared-ui | 001-sg-build | 107-sg-test | Mobile adaptation is intentional; capability mapping is incomplete. |
| Network catalog and launch | Every visible supported network opens | Windows | unknown | `AppSidebar.vue` calls `webviewStore.selectNetwork`; desktop `open_webview` uses child WebView | implementation | 106-sg-fix | 107-sg-test | Current zero-size WebView fix is local and not yet manually retested in a new Windows installer. |
| Network catalog and launch | Every visible supported network opens | Android | same | `MobileLayout.vue`, Android `openWebView` | test-proof | 103-sg-verify | 107-sg-test | Requires installed APK evidence across the catalog. |
| Per-profile/network session isolation | Switching profiles never leaks cookies or localStorage | Windows | unknown | Desktop `WebviewBuilder::data_directory` uses `sessions/<profile>/<network>` in `src-tauri/src/lib.rs` | manual-qa | 103-sg-verify | 107-sg-test | Architecture exists, but no Windows proof for cookies, localStorage, IndexedDB, or profile switching. |
| Per-profile/network session isolation | Switching profiles never leaks cookies or localStorage | Android | degraded-accepted | Android multi-profile/fallback logic and session key in `NativeWebViewPlugin.kt` | test-proof | 103-sg-verify | 107-sg-test | Android fallback explicitly does not isolate all browser stores; documented but device-dependent. |
| Warm WebView switching | Return to a network without unnecessary reload or leakage | Windows | unknown | Desktop hides child WebViews off-screen and shows them again in `src-tauri/src/lib.rs` | implementation | 001-sg-build | 107-sg-test | No LRU bound or eviction policy is visible; long sessions can accumulate native WebViews. |
| Warm WebView switching | Return to a network without unnecessary reload or leakage | Android | degraded-accepted | Android plugin has multi-profile pool and fallback-single mode with documented LRU behavior | test-proof | 103-sg-verify | 107-sg-test | Needs device log and eviction proof. |
| Profile switcher | Profiles can be viewed and changed from the platform shell | Windows | unknown | `AppSidebar.vue` contains hardcoded `John Doe`; `set_profiles` is a desktop no-op in `src-tauri/src/lib.rs` | implementation | 001-sg-build | 107-sg-test | The shared profile store exists, but the desktop shell does not expose the Android native popup equivalent clearly. |
| Profile switcher | Profiles can be viewed and changed from the platform shell | Android | same | `set_profiles` bridge and native popup handling in `NativeWebViewPlugin.kt` | test-proof | 103-sg-verify | 107-sg-test | Native popup and event path require device proof. |
| Visible network management | Hidden networks stay consistent with the active profile | Windows | adapted-required | Sidebar filters through profiles store; desktop `set_bar_networks` is a no-op | implementation | 001-sg-build | 107-sg-test | Sidebar can represent visibility, but no native bar needs syncing. The no-op is acceptable only if desktop UI is complete. |
| Visible network management | Hidden networks stay consistent with the active profile | Android | same | `set_bar_networks` and `setBarNetworks` bridge | test-proof | 103-sg-verify | 107-sg-test | Native bar must be checked after profile and visibility changes. |
| Dark mode for shell and embedded networks | Theme setting affects the full experience | Windows | degraded-accepted | Desktop `set_dark_mode` is a no-op; Vue theme applies to shell only | implementation | 001-sg-build | 107-sg-test | Embedded child WebViews do not receive the Android native dark-mode bridge. Must be documented or implemented. |
| Dark mode for shell and embedded networks | Theme setting affects the full experience | Android | adapted-better | Android `set_dark_mode` delegates to native WebView plugin | test-proof | 103-sg-verify | 107-sg-test | Native behavior is richer than shell-only CSS. |
| Grayscale/focus mode | Setting affects the visible experience | Windows | degraded-accepted | Desktop `set_grayscale` is a no-op and Vue applies `html` filter | implementation | 001-sg-build | 107-sg-test | Child native WebViews are outside the Vue DOM filter; visible result is partial. |
| Grayscale/focus mode | Setting affects the visible experience | Android | adapted-better | Android plugin applies WebView-level grayscale | test-proof | 103-sg-verify | 107-sg-test | Verify third-party pages and bottom bar together. |
| Text zoom | Text scale applies to shell and embedded network view | Windows | degraded-accepted | Desktop `set_text_zoom` is a no-op in `src-tauri/src/lib.rs` | implementation | 001-sg-build | 107-sg-test | Vue shell slider changes local state but native child WebView zoom is not updated. |
| Text zoom | Text scale applies to shell and embedded network view | Android | same | Android `set_text_zoom` / `setTextZoom` bridge | test-proof | 103-sg-verify | 107-sg-test | Device proof needed for representative networks. |
| Haptics and tap sound | Feedback preferences work for supported controls | Windows | not-supported | UI calls Android plugin commands; Windows plugin commands are unavailable and errors are swallowed | implementation | 001-sg-build | 107-sg-test | Either provide Windows-native feedback or explicitly hide/label the setting. |
| Haptics and tap sound | Feedback preferences work for supported controls | Android | same | `set_haptic`, `set_tap_sound`, variants and preview in `MobileSettingsSheet.vue` and plugin | test-proof | 103-sg-verify | 107-sg-test | Device/audio proof required. |
| Incoming shared links | A shared social URL opens the matching network | Windows | not-supported | Android reads `get_current_shared_link`; no Windows equivalent is wired in `App.vue` or Rust | native-host | 001-sg-build | 107-sg-test | Windows can add protocol/file association or a copy/paste fallback. |
| Incoming shared links | A shared social URL opens the matching network | Android | same | Android share/deep-link handling in `main.ts`, `App.vue`, and plugin | test-proof | 103-sg-verify | 107-sg-test | Validate cold start and authenticated/unauthenticated paths. |
| Native back/navigation | Back returns from network view to SocialGlowz | Windows | unknown | Android emits `sfz-webview-back`; no equivalent Windows native back control is visible | implementation | 001-sg-build | 107-sg-test | Desktop needs an explicit back/close affordance or documented window behavior. |
| Native back/navigation | Back returns from network view to SocialGlowz | Android | same | Native event `sfz-webview-back` handled in `App.vue` | test-proof | 103-sg-verify | 107-sg-test | Verify Android system back as well as bottom-bar back. |
| Backup and restore | Sessions and settings can be backed up and restored | Windows | unknown | Shared `useBackup.ts`, Rust encrypted archive and filesystem session directory | manual-qa | 103-sg-verify | 107-sg-test | Need Windows installer proof, file dialog proof, and restore verification. |
| Backup and restore | Sessions and settings can be backed up and restored | Android | unknown | Shared backup composable plus Android cookie/localStorage snapshot commands | manual-qa | 103-sg-verify | 107-sg-test | Need device proof; Android limitations are documented. |
| Locale | Vue and native platform controls use the selected language | Windows | same | Vue i18n; `set_locale` is desktop no-op because no native Android bar exists | test-proof | 103-sg-verify | 107-sg-test | Acceptable adaptation if no desktop-native controls need translation. |
| Locale | Vue and native platform controls use the selected language | Android | same | `set_locale` bridge to native plugin | test-proof | 103-sg-verify | 107-sg-test | Native bar and popup need device proof. |
| Desktop tray / mobile bottom bar | Fast access to networks from OS surface | Windows | adapted-required | Rust tray menu in `src-tauri/src/lib.rs` | test-proof | 103-sg-verify | 107-sg-test | Adaptation is valid, but tray catalog/profile visibility should match the active profile. |
| Desktop tray / mobile bottom bar | Fast access to networks from OS surface | Android | adapted-required | Android native bottom bar in plugin | test-proof | 103-sg-verify | 107-sg-test | Intent is equivalent; interaction is platform-native. |
| Design tokens and visual language | Same color, surface, border, shadow and state language | Windows | degraded-accepted | App shell tokens in `App.vue`; recent Windows token alignment is local/unpublished | shared-ui | 006-sg-design | 107-sg-test | Structure differs intentionally, but token authority is not centralized enough and Android native styles are local Kotlin values. |
| Design tokens and visual language | Same color, surface, border, shadow and state language | Android | degraded-accepted | Vue tokens plus Android native bar styles in `NativeWebViewPlugin.kt` | shared-ui | 006-sg-design | 107-sg-test | Need one documented token contract or explicit native mapping. |

## Priority Findings

### P1: Windows is not yet a trustworthy installed target

The Windows launch fix has only local automated/build evidence. A fresh Windows installer has not been manually tested after the bounds fix. Until that happens, network launch, switching, close, profile switching, and session isolation remain unknown on the claimed production platform.

### P1: User-facing settings are platform-incomplete

Dark mode, grayscale, and text zoom are implemented natively for Android but are shell-only or no-op for Windows. This is especially risky because the controls appear shared, which implies a stronger contract than the implementation provides.

### P1: Session lifecycle differs materially

Android has an explicit multi-profile WebKit mode, a documented fallback, and bounded warm-host behavior. Windows assigns a separate filesystem data directory but keeps hidden child WebViews without a visible bound. There is no equivalent resource bound or manual leakage proof.

### P2: Windows lacks Android's share and native profile surfaces

Android handles system share/deep links and has native profile/network controls. Windows has a tray and Vue shell, but no equivalent inbound share path and the desktop profile UI contains hardcoded placeholder data.

### P2: Design token authority is incomplete

The Vue shell has shared CSS variables, but Android native Kotlin colors, radii, shadows, icon sizing, and bars are not fed from a shared token source. The current visual parity is therefore a mapping convention, not an enforceable design contract.

## Required Follow-up Contract

1. Define a Windows/Android parity spec covering network launch, profile switching, session isolation, settings behavior, share links, navigation, backup, and design tokens.
2. Make a deliberate decision for Windows dark mode, grayscale, and text zoom on embedded child WebViews: implement equivalent behavior or hide/label the limitation.
3. Add a bounded desktop WebView lifecycle policy and test it alongside Android's LRU/fallback behavior.
4. Replace the desktop hardcoded profile display with the shared profile store and expose the same profile actions as the product contract requires.
5. Add a Windows protocol/share entry path or document the desktop fallback explicitly.
6. Build and install fresh Windows and Android artifacts, then execute the platform QA checklist before changing any `unknown` or `degraded-accepted` verdict.

## Decision Log

| Date | Capability | Platform | Decision | Why better or required | Accepted by | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-08-02 | Shell navigation | Windows / Android | Keep desktop panels and mobile native bottom bar as structural adaptations | OS form factor and native navigation affordances differ | pending | Define shared capability contract and test it |
| 2026-08-02 | Embedded WebView preferences | Windows / Android | Do not claim parity until native child WebViews are tested | Android has native plugin support; desktop currently has no-op handlers | pending | Implement or explicitly document each setting |

## Chantier potentiel

Chantier potentiel: oui
Titre propose: Windows / Android platform parity completion
Raison: Multiple native capabilities, shared UI behavior, WebView lifecycle, documentation, and platform QA are affected; the work requires staged implementation and device/installer validation.
Severite: P1
Scope: Vue shell, Tauri Rust host, Android Kotlin plugin, settings, share/deep links, WebView lifecycle, design tokens, CI artifacts, manual QA, documentation.
Evidence:
- Windows desktop native handlers for `set_dark_mode`, `set_text_zoom`, `set_bar_networks`, `set_profiles`, and `set_locale` are no-ops or desktop-only adaptations.
- Android has native implementations for the corresponding capabilities and additional share/profile/bottom-bar flows.
- Windows network click behavior has a fix attempt but no fresh installer retest.
Formalisation recommandée: oui - the scope is too broad for a safe single local fix.
Choix proposes: define the parity contract first, implement the P1 settings/session gaps, or pause implementation after the audit.
