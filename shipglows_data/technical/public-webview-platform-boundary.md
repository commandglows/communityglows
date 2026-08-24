---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "1.3.1"
project: "communityglows"
created: "2026-07-15"
updated: "2026-08-24"
status: reviewed
source_skill: 300-sg-docs
scope: public-webview-platform-boundary
owner: "Diane"
confidence: high
risk_level: critical
security_impact: yes
docs_impact: yes
linked_systems:
  - "src-tauri/src/lib.rs"
  - "src-tauri/plugins/android-webview/android/src/main/java/com/communityglows/webview/NativeWebViewPlugin.kt"
  - "shipglows_data/technical/android-webview-session-isolation.md"
  - "shipglows_data/workflow/audits/2026-07-15-google-play-android-compliance.md"
  - "shipglows_data/workflow/specs/communityglows-public-webview-script-removal.md"
depends_on:
  - "shipglows_data/technical/android-webview-session-isolation.md"
supersedes: []
evidence:
  - "2026-07-15 public WebView script-removal implementation"
  - "shipglows_data/workflow/audits/2026-07-15-google-play-android-compliance.md"
  - "Windows managed Bitwarden imports require a caller-supplied official GitHub SHA-256 digest and fail closed on mismatch before extraction."
next_review: "2026-09-19"
next_step: "Run physical-device Android Autofill and packaged-Windows password-manager compatibility proofs."
---

# Public WebView Platform Boundary

## Purpose

This document defines the public-build boundary for third-party content loaded
inside CommunityGlows WebViews. It is separate from session isolation: preserving a
user's session does not authorize CommunityGlows to automate, disguise, or alter a
third-party service.

## Owned Files

- `src-tauri/src/lib.rs` owns desktop WebView construction and the public Tauri IPC surface.
- `src-tauri/plugins/android-webview/android/src/main/java/com/communityglows/webview/NativeWebViewPlugin.kt` owns Android WebView setup and native visual preferences.
- `src/ui/setup/pages/CommunityGlows/App.vue` must not register a third-party content-filter injection entry point.

## Public-Build Contract

- Third-party consent, privacy, and cookie dialogs remain under the user's direct control. CommunityGlows does not locate, dismiss, or click them.
- The public build uses the platform's actual WebView user agent. It does not remove WebView markers, impersonate desktop Chrome, patch browser APIs, or spoof fingerprint signals.
- The public build does not force a desktop viewport, redirect app-install links to login pages, filter a platform's feed, or inject arbitrary scripts into a third-party page.
- A platform that refuses the normal WebView is an incompatibility, not a reason to restore a hidden workaround. Resolve it through written platform authorization, an official API, Custom Tabs, or the external browser.

## Retained Visual Preferences

The current public build retains only user-selected visual preferences:

- dark/light appearance;
- grayscale;
- media mute;
- native Android text zoom through `WebSettings.textZoom`.

These preferences are not a claim of platform authorization. Some are still implemented with page-level JavaScript and can conflict with a platform's terms or technical behavior. Every supported network must be tested with the actual WebView user agent. Remove or replace a preference for a network if it prevents normal operation or the platform objects.

## Platform-Mediated Credential Filling

CommunityGlows may expose ordinary HTML form semantics and let an operating-system
Autofill service or desktop password manager send input to the visible, focused
WebView. Android WebViews retain their real page origin and native virtual Autofill
structure. Desktop WebViews must not retain focus after they are hidden or pooled.

This is interoperability, not vault integration. CommunityGlows does not enumerate
providers, read vault contents, inject credentials or form-detection scripts,
auto-submit forms, enable a second WebView2 password store, or synchronize passwords.
Provider matching, unlock, selection, and release remain controlled by the user and
the provider.

The Windows-only Bitwarden experiment is a narrow exception for a user-selected
official Chromium archive. The Windows Settings flow verifies the ZIP against the
SHA-256 digest copied from the official GitHub release, applies bounded archive and
manifest checks, extracts it under CommunityGlows application data, and enables it only after an explicit restart;
the environment path remains a developer override. WebView2 runs the extension's own
content scripts, while CommunityGlows neither uploads the archive, reads filled fields,
nor adds a credential bridge. This does not authorize redistribution or a
general-purpose extension store.

## Explicitly Removed Mechanisms

The public build must not reintroduce:

- automatic cookie/consent acceptance;
- app-install banner dismissal or click automation;
- anti-bot, anti-detection, or fingerprint manipulation;
- `navigator.webdriver` and related browser-property patches;
- desktop user-agent or viewport forcing;
- arbitrary desktop `inject_script` IPC;
- provider-specific credential injection, vault APIs, or arbitrary/unreviewed embedded extensions;
- friends-only filtering or any mutation of third-party feed content.

## Validation

- Static regression scan: `rg -n -i 'STEALTH_SCRIPT|navigator\\.webdriver|COOKIE_(IFRAME|ACCEPT)_SCRIPT|DISMISS_APP_BANNERS_SCRIPT|DESKTOP_VIEWPORT_SCRIPT|inject_script|buildFriendsFilterScript|replace\\("; wv"' src-tauri src`
- Credential-boundary scan: `rg -n -i 'AutofillManager|requestAutofill|IsPasswordAutosaveEnabled|bitwarden|1password|vault' src-tauri src` and review every match; guarded `importantForAutofill` participation and the explicit Windows Bitwarden path are allowed.
- Device proof: on each supported network, open a fresh profile, make a consent choice manually when prompted, navigate normally, and record any network refusal or broken interaction.
- Release proof: confirm the Android package and CI build contain no removed mechanisms before a Play submission.

## Non-Coverage

This boundary does not establish written permission from platform owners and does not close the remaining Google Play compliance findings: account deletion, privacy/Data Safety, session-storage hardening, UGC safeguards, billing, and release-artifact proof.

## Maintenance Rule

Update this document, `android-webview-session-isolation.md`, and the Google Play compliance audit in the same change whenever a third-party WebView script, user-agent rule, navigation override, or platform integration changes.
