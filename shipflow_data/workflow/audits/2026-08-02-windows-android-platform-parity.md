---
artifact: parity_audit
metadata_schema_version: "1.0"
project: socialglowz
created: "2026-08-02"
status: active
source_skill: "602-sg-platform-parity"
scope: "Windows desktop and Android"
owner: "602-sg-platform-parity"
confidence: high
risk_level: high
security_impact: no
docs_impact: yes
related_spec: "shipflow_data/workflow/specs/windows-android-platform-parity.md"
next_step: "Complete the Windows profile surface, build the Windows installer only, and execute the Windows checklist."
---

# Windows / Android Parity Audit

## Verdict

Parity is partial. The shared Vue application and native hosts provide most of the intended capability contract, but Windows does not yet meet the production parity claim because child-WebView launch has not been retested from an installed artifact after the asynchronous-command repair, and the desktop secondary profile surface still renders placeholder identity data.

## Matrix

| Capability | User expectation | Platform | Verdict | Evidence | Gap | Owner route | QA route | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Network launch and switching | A selected network appears in the current profile context | Windows | unknown | `useNetworkWebview.ts`, `NetworkWebviewHost.vue`, desktop `open_webview` is now async | manual-qa | `001-sg-build` | `107-sg-test` | Previous installed build did not render a child WebView; the repair is not yet installer-tested. |
| Network launch and switching | A selected network appears in the current profile context | Android | adapted-better | Native Android WebView plugin, bottom bar, pooled session hosts | manual-qa | none | `107-sg-test` | Native bottom bar is an appropriate mobile adaptation. No Android build is requested in this cycle. |
| Profile identity and switching | Active profile is visible and manageable | Windows | unknown | `AppSidebar.vue` uses `profilesStore`; `AppRightSidebar.vue` still renders `John Doe` | shared-ui | `001-sg-build` | `107-sg-test` | Placeholder identity is an implementation gap, not an OS limitation. |
| Profile identity and switching | Active profile is visible and manageable | Android | adapted-better | Android popup bridge through `set_profiles` and native plugin | manual-qa | none | `107-sg-test` | Requires physical-device proof. |
| Session isolation and lifecycle | Each profile/network retains its own covered session | Windows | unknown | Per-profile/network data directories, pool cleanup before deletion in `lib.rs` | manual-qa | none | `107-sg-test` | Must be tested with real cookies and localStorage after launch is proven. |
| Session isolation and lifecycle | Each profile/network retains its own covered session | Android | degraded-accepted | `MULTI_PROFILE` mode with documented fallback snapshots | manual-qa | none | `107-sg-test` | Fallback exclusions are documented: IndexedDB, CacheStorage, service workers, HTTP cache and credential store. |
| Embedded preferences | Theme, grayscale and text zoom act truthfully | Windows | unknown | Desktop `set_grayscale`, `set_dark_mode`, `set_text_zoom` apply WebView scripts | manual-qa | none | `107-sg-test` | Source path exists; installed-host proof is missing. |
| Embedded preferences | Theme, grayscale and text zoom act truthfully | Android | same | Native plugin commands | manual-qa | none | `107-sg-test` | Device proof still pending. |
| Backup and destructive session cleanup | Restore is atomic and session deletion closes active hosts | Windows | unknown | Atomic restore and desktop close-before-delete in `lib.rs` | manual-qa | none | `107-sg-test` | Needs installed-artifact restore scenario. |
| Backup and destructive session cleanup | Restore is atomic and session deletion closes active hosts | Android | unknown | Android bridge/plugin exists | manual-qa | none | `107-sg-test` | Needs APK/device proof, outside this Windows-only cycle. |
| Diagnostics | A user can copy a safe support report from the app | Windows | same | Header diagnostic action, redacted in-memory event journal | test-proof | `001-sg-build` | `107-sg-test` | Added in current unshipped work; copied report must be checked on Windows. |
| Visual language | Shared semantic tokens map to native controls | Windows + Android | unknown | Vue CSS tokens exist; no documented Android native token mapping | shared-ui | `006-sg-design` | `103-sg-verify` | Desktop panel structure may remain different from Android. |

## Decision Log

| Date | Capability | Platform | Decision | Why better or required | Accepted by | Follow-up |
| --- | --- | --- | --- | --- | --- |
| 2026-08-02 | Native network host | Windows | Use an async Tauri command for child-WebView creation | Tauri documents a Windows deadlock risk for synchronous `WebviewBuilder` use | Existing bug repair | Rebuild and test Windows installer only. |
| 2026-08-02 | Diagnostics | Windows | Header-level copy action plus contextual failure copy action | Support evidence remains available even when the native child view covers central Vue content | Operator request | Validate copied content contains no personal/session data. |
| 2026-08-02 | Layout | Windows + Android | Keep desktop panels and Android native bottom bar | Platform-native adaptations preserve the same navigation intent | Existing parity spec | Unify semantic design tokens in Task 6. |

## Claim Boundary

Do not present Windows network WebViews as verified until a fresh `windows-latest` installer opens at least two networks, then passes resize and profile switching. Android has no new claim from this run because no Android artifact or device proof was executed.
