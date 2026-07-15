---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.5.0"
project: socialglowz
created: "2026-07-15"
created_at: "2026-07-15 15:58:00 UTC"
updated: "2026-07-15"
updated_at: "2026-07-15 16:12:00 UTC"
status: reviewed
source_skill: 001-sg-build
source_model: GPT-5 Codex
scope: public-webview-compliance-remediation
owner: Diane
confidence: high
risk_level: critical
security_impact: yes
docs_impact: yes
user_story: "En tant qu'utilisatrice SocialGlowz, je veux que les WebViews publiques n'automatisent ni le consentement ni les interfaces des plateformes, afin de conserver une application publiable et d'identifier honnêtement les réseaux incompatibles."
linked_systems:
  - src-tauri/src/lib.rs
  - src-tauri/plugins/android-webview/android/src/main/java/com/socialglowz/webview/NativeWebViewPlugin.kt
  - src/ui/setup/pages/SocialGlowz/composables/useFriendsFilter.ts
  - src/injectors/friendsFilter.ts
  - shipflow_data/workflow/audits/2026-07-15-google-play-android-compliance.md
  - site/src/pages/features.astro
  - site/src/pages/privacy.astro
  - site/src/pages/terms.astro
depends_on: []
supersedes: []
evidence:
  - "Static removal scan completed on 2026-07-15"
  - "Google Play compliance audit: shipflow_data/workflow/audits/2026-07-15-google-play-android-compliance.md"
next_step: "rerun CI Android checks on the remediated dependency lockfile"
---

# Public WebView Script Removal

## Decision

The public build must not conceal WebView identity, accept third-party consent, dismiss or click third-party app-install prompts, force a desktop identity or viewport, or alter a network's functional content.

The public build retains local and cosmetic controls: the SocialGlowz interface theme, native WebView text zoom, injected dark/light appearance, grayscale, and mute. These retained cosmetic controls remain subject to platform testing and must be removed or replaced if a platform objects.

## Minimal Behavior Contract

- A third-party cookie or privacy dialog remains fully controlled by the user.
- SocialGlowz sends the platform's actual WebView user agent and does not spoof browser fingerprint signals.
- No script is inserted to force a desktop viewport, hide an app-install prompt, filter social posts, or issue clicks in a third-party page.
- Text zoom remains native (`WebSettings.textZoom`); the local application theme and currently selected cosmetic controls continue to work.
- A network that becomes unusable after removal is treated as an incompatibility to investigate with an official, documented integration path rather than a silent bypass.

## Scope

In scope:

- Remove Android and desktop stealth scripts, WebView-marker stripping, desktop-UA spoofing, desktop viewport injection, cookie-acceptance scripts, app-banner automation, and arbitrary desktop script injection.
- Remove the friends-only content filter and its user-facing trigger.
- Preserve cosmetic theme, grayscale, mute, native text zoom, normal navigation, and session persistence.
- Add targeted regression checks and update the compliance audit release gate.
- Align public site and in-app copy with the removed mechanisms: no friends-only filter, custom third-party scripts, arbitrary-site WebView promise, automatic consent, or self-service account-deletion claim.

Out of scope:

- A complete legal privacy notice, Data Safety declaration, UGC controls, billing, session-storage hardening, and final AAB proof.
- New official API or Custom Tabs integrations for incompatible networks.

## Acceptance Criteria

- Repository search finds no `STEALTH_SCRIPT`, cookie-accept selector/click logic, app-banner script, `navigator.webdriver` patch, `wv` marker stripping, desktop viewport script, or `inject_script` Tauri command.
- Android WebView uses the default Android WebView user agent and does not register document-start scripts for third-party pages except the retained cosmetic theme bridge.
- The friends-only filter cannot inject or alter third-party social content on desktop.
- Existing theme, grayscale, mute, and text zoom call paths remain available.
- Typecheck and targeted tests pass; Android compilation is attempted when the local toolchain permits it.
- Public marketing and policy copy does not advertise removed functionality or claim that self-service account deletion exists.

## Risks And Proof

- Removing bypasses can expose platform restrictions; manual testing must record each network that fails and its visible reason.
- Retained cosmetic injections remain a platform-compatibility risk and are explicitly not claimed as officially supported.
- The public Play package remains blocked by the other findings in the 2026-07-15 compliance audit.

## Tasks

1. Remove Android automation and identity-spoofing scripts and their lifecycle calls.
2. Remove desktop stealth and arbitrary script injection, including the friends filter entry point.
3. Add regression tests or static checks for the removed mechanisms.
4. Run typecheck/tests and inspect the diff for remaining third-party functional injections.
5. Align public and in-app copy with the public WebView boundary without presenting incomplete legal work as release-ready.

## Current Chantier Flow

100-sg-spec ✅ -> 101-sg-ready ✅ -> 102-sg-start ✅ -> 103-sg-verify partial -> 104-sg-end deferred -> 005-sg-ship not started

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
| --- | --- | --- | --- | --- | --- |
| 2026-07-15 | 100-sg-spec | GPT-5 Codex | Created public WebView script-removal contract | implemented | 101-sg-ready |
| 2026-07-15 | 101-sg-ready | GPT-5 Codex | Reviewed scope, retained cosmetic boundary, and proof contract | ready | 102-sg-start |
| 2026-07-15 | 001-sg-build | GPT-5 Codex | Began direct execution after user approval because delegated subagents are unavailable | implemented | 102-sg-start |
| 2026-07-15 | 102-sg-start | GPT-5 Codex | Removed third-party functional automation and identity spoofing from Android and desktop paths | implemented | 103-sg-verify |
| 2026-07-15 | 103-sg-verify | GPT-5 Codex | Static removal checks passed; local TypeScript, Kotlin, and Rust build proof is environment-blocked | partial | device and CI verification |
| 2026-07-15 | 300-sg-docs | GPT-5 Codex | Documented the public WebView boundary, retained visual preferences, removed mechanisms, and remaining compliance gates | implemented | device and CI verification |
| 2026-07-15 | 007-sg-content | GPT-5 Codex | Aligned public claims and policy copy with the public WebView boundary; retained legal and release gates are stated as incomplete | implemented | device and CI verification |
| 2026-07-15 | 104-sg-end | GPT-5 Codex | Closed the work session with a partial/deferred outcome; source remediation and public copy alignment are complete, but device/CI proof and Play release blockers remain | deferred | device/CI verification, then remaining Play compliance remediation |
| 2026-07-15 | 706-continue | GPT-5 Codex | Resolved the next proof boundary: Astro build remains blocked by missing site dependencies and Node 24; no new chantier or code change needed in this continuation | partial | use Node 24, install site dependencies, rerun the Astro build |
| 2026-07-15 | 706-continue | GPT-5 Codex | Ran the available site build after dependency installation; Astro reached bundling but failed because the shared PostCSS config requires undeclared site dependency autoprefixer; confirmed Android proof belongs to existing CI workflows and no local Gradle run is authorized | partial | scoped commit/push, then CI Android verification |
| 2026-07-15 | 405-sg-prod | GPT-5 Codex | Verified GitHub run 29430926858: Android checks stopped at cargo audit on two high quick-xml advisories; APK/Windows jobs were skipped and no deploy/runtime URL was produced | partial | dependency remediation for quick-xml, then rerun CI Android checks |
| 2026-07-15 | 402-sg-deps | GPT-5 Codex | Updated the locked plist dependency to 1.10.0, resolving quick-xml to 0.41.0, and aligned the crate MSRV to Rust 1.88.0; local metadata and dependency graph checks pass | implemented | rerun CI Android checks |
