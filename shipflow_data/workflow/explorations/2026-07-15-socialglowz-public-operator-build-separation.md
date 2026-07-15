---
artifact: exploration_report
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "socialglowz"
created: "2026-07-15"
updated: "2026-07-15"
status: draft
source_skill: 700-sg-explore
scope: "separation between the public store app and a private operator sourcing build"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "src/ui/setup/pages/SocialGlowz/"
  - "src/stores/customLinks.ts"
  - "src/stores/profiles.ts"
  - "src-tauri/src/lib.rs"
  - "src-tauri/capabilities/default.json"
  - "src-tauri/plugins/android-webview/"
  - "vite.tauri.config.ts"
  - "src-tauri/tauri.conf.json"
evidence:
  - "SocialGlowz already supports persisted per-profile custom links."
  - "Desktop Tauri supports arbitrary child-WebView URLs and JavaScript evaluation."
  - "Android Tauri rejects custom domains outside its static social-network allowlist."
  - "Android injects a fixed native script suite, while the generic Vue-to-WebView inject_script command is currently a no-op."
  - "Google Play prohibits hidden, dormant, undocumented, or review-evasion functionality."
  - "Apple requires accurate review access and restricts downloaded code that changes app functionality."
depends_on:
  - "shipflow_data/technical/android-webview-session-isolation.md"
  - "shipflow_data/workflow/specs/extension-tauri-feature-parity.md"
supersedes: []
next_step: "/100-sg-spec socialglowz operator build separation"
---

# Exploration Report: SocialGlowz Public And Operator Build Separation

## Starting Question

How should SocialGlowz support a private, operator-controlled sourcing profile with shopping WebViews and agent-assisted actions without shipping unrelated or undisclosed functionality in the Play Store and App Store binaries?

## Context Read

- `CLAUDE.md` - established the shared Vue/Tauri architecture and cross-platform release constraints.
- `src/stores/profiles.ts` - confirmed profiles are persisted and synchronized but are not authorization boundaries.
- `src/stores/customLinks.ts` - confirmed per-profile custom URLs already exist and sync to the cloud.
- `src-tauri/src/lib.rs` - confirmed desktop child-WebView isolation, broad desktop URL handling, script evaluation, Android host allowlisting, and the current Android no-op for scripts supplied through the generic `inject_script` command.
- `src-tauri/capabilities/default.json` - confirmed the public app currently has one shared Tauri capability set.
- `vite.tauri.config.ts` and `src-tauri/tauri.conf.json` - confirmed one frontend entry, one output directory, and one application identifier.
- `shipflow_data/technical/android-webview-session-isolation.md` - confirmed the existing Android profile/network session boundary and storage limitations.
- `shipflow_data/workflow/specs/extension-tauri-feature-parity.md` - confirmed the project already identifies broad injection and internal-only surfaces as store-review risks.

## Internet Research

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) - Accessed 2026-07-15 - established review transparency, self-contained bundle, minimum-functionality, and third-party service authorization requirements.
- [Google Play deceptive behaviour policy](https://support.google.com/googleplay/android-developer/answer/9888077?hl=en-GB) - Accessed 2026-07-15 - established that hidden, dormant, undocumented, remotely activated, and review-evasion functionality is prohibited.
- [Google Play spam policy](https://support.google.com/googleplay/android-developer/answer/9899034?hl=en) - Accessed 2026-07-15 - established the WebView and affiliate-spam risk for third-party sites without permission.
- [Google Play AccessibilityService policy](https://support.google.com/googleplay/android-developer/answer/10964491?hl=fr) - Accessed 2026-07-15 - established that autonomous action planning/execution through AccessibilityService is prohibited for ordinary automation apps.
- [Android alternative distribution options](https://developer.android.com/distribute/marketing-tools/alternative-distribution) - Accessed 2026-07-15 - confirmed signed APK distribution outside Google Play is supported.
- [Apple ad hoc provisioning](https://developer.apple.com/help/account/provisioning-profiles/create-an-ad-hoc-provisioning-profile) - Accessed 2026-07-15 - confirmed private installation on registered iOS devices.
- [Tauri CLI reference](https://v2.tauri.app/reference/cli/) - Accessed 2026-07-15 - confirmed config overlays and Cargo features can support separate build flavors.

## Problem Framing

The requirement is not merely a special profile. It introduces a materially different trust boundary: arbitrary commerce domains, persistent authenticated sessions, product extraction, and agent-issued browser actions. Selecting the feature by operator email or a remote flag would leave the code and permissions in the public binary and make the feature hidden from ordinary users and reviewers. Git branches do not create a binary security boundary by themselves.

The public SocialGlowz product and the private sourcing tool can share UI, profile, WebView, and session-isolation foundations, but they must compile into separate artifacts with separate identifiers, capability sets, release pipelines, and distribution paths.

## Option Space

### Option A: Email-Gated Feature In The Public App

- Summary: Bundle the operator functionality and reveal it only for one account.
- Pros: Lowest initial implementation effort and one install.
- Cons: Code and permissions remain in store binaries; creates hidden behavior, weak authorization, accidental exposure, review risk, and a high-impact account-compromise path.

### Option B: Long-Lived Private Git Branch

- Summary: Keep the operator feature on a branch that is never submitted to stores.
- Pros: Private binary can genuinely exclude the feature from public builds if release discipline is perfect.
- Cons: Permanent drift, repeated merges, stale security fixes, accidental build/submission risk, and poor reproducibility.

### Option C: Separate Compile-Time Operator Flavor In One Repository

- Summary: Share stable packages while building distinct public and operator applications through separate frontend entries, Rust features, Tauri config overlays, capability files, identifiers, and CI jobs.
- Pros: Public artifacts exclude operator code; shared fixes remain reusable; release boundaries are testable; operator builds remain reproducible.
- Cons: Requires deliberate package boundaries and artifact-level release checks.

### Option D: Separate Repository And Application

- Summary: Fork the WebView/session foundation into a fully separate private product.
- Pros: Strongest organizational separation.
- Cons: Maximum duplication and drift; shared WebView/security fixes must be ported manually.

## Comparison

Option C provides a real compile-time boundary while preserving the value of the existing SocialGlowz WebView and session-isolation work. Option B is acceptable for a very short proof of concept but is not a durable architecture. Option A should not be shipped. Option D is only justified later if the operator tool diverges enough to become a separate product.

## Emerging Recommendation

Create a private operator flavor in the existing repository, but install it as a distinct application and never submit it to the public stores.

The public build should retain only documented SocialGlowz behavior. The operator build should use a separate application identifier, data directory, signing/distribution path, frontend entry, Rust Cargo feature, Tauri capability policy, and explicit domain/action allowlists. Android can be distributed as a signed APK outside Google Play. iOS can use Xcode development installation or Ad Hoc provisioning on registered devices.

Do not use an email address as a hidden feature switch. The operator identity may select data inside the private build, but possession of the private build plus explicit pairing must be the first boundary.

The control bridge should accept structured, allowlisted browser actions rather than arbitrary downloaded JavaScript. It should require an operator-visible connected state, short-lived pairing, per-action or per-session consent, a kill switch, and a redacted audit trail. Credentials remain entered by the operator directly in each WebView; the agent receives neither passwords nor raw cookies.

## Non-Decisions

- Whether the first operator build targets desktop only or desktop plus Android.
- Whether the agent connects over a local-only bridge, a private relay, or a user-initiated session tunnel.
- The exact supported commerce-domain list and action schema.
- Whether generic custom links remain embedded on public mobile builds or open in the system browser.

## Rejected Paths

- Email-based backdoor in the public app - hidden behavior remains in the submitted artifact and profile identity is not a security boundary.
- Runtime download of automation scripts - creates security and store-policy risk and prevents reliable artifact review.
- AccessibilityService-based autonomous agent control - conflicts with Google Play's automation restrictions and is unnecessary for an internal WebView-specific bridge.
- Permanent private branch as the final architecture - too much drift and accidental-release risk.

## Risks And Unknowns

- Third-party terms may prohibit embedded browsing, scraping, automation, or commercial reuse even in a private build; each supported site needs a terms review.
- Temu may still block a clean WebView based on account, IP, region, fingerprint, or interaction behavior; a WebView is not a guaranteed bypass.
- The current desktop and Android builds inject anti-fingerprinting scripts into child WebViews. This should be reviewed and separated before any store release.
- Android custom links currently fail native host validation because `custom-*` IDs have no allowed-host mapping.
- Android already injects its fixed native stealth, viewport, theme, cookie, and banner scripts. It does not implement the generic Vue-to-WebView `inject_script` command, so agent-supplied actions still require a new narrowly scoped native bridge.
- iOS implementation and private distribution require a macOS/Xcode signing path that is not available from the current Linux workspace.

## Redaction Review

- Reviewed: yes
- Sensitive inputs seen: operator account identifier
- Redactions applied:
  - `[REDACTED_CUSTOMER_DATA]`
- Notes: The report refers only to an operator identity and does not persist the supplied email address, credentials, cookies, or session data.

## Decision Inputs For Spec

- User story seed: As the operator, I can use a privately installed SocialGlowz-derived app to authenticate manually on approved commerce sites and explicitly hand a visible browsing session to an agent for bounded sourcing actions, while public SocialGlowz store binaries contain none of the operator-only control functionality.
- Scope in seed: distinct build flavor, bundle identifier, frontend entry, Rust feature, capabilities, approved domains/actions, pairing, consent, kill switch, audit trail, release artifact checks, Android private distribution.
- Scope out seed: bypassing anti-bot controls, CAPTCHA solving, credential transfer to the agent, AccessibilityService automation, public release of commerce automation, unrestricted JavaScript execution.
- Invariants/constraints seed: no operator code or domains in public artifacts; no raw credentials/cookies exposed; public and operator data directories isolated; user-visible control state; deny-by-default commands and domains.
- Validation seed: inspect both compiled artifacts; assert operator symbols/domains/commands are absent from public output; verify separate identifiers/data directories; pair/unpair/kill-switch tests; domain and action rejection tests; manual authenticated WebView smoke.

## Handoff

- Recommended next command: `/100-sg-spec socialglowz operator build separation`
- Why this next step: The product boundary is clear enough to formalize security contracts, build topology, and a minimal desktop-first proof before implementation.

## Exploration Run History

| Date UTC | Prompt/Focus | Action | Result | Next step |
|----------|--------------|--------|--------|-----------|
| 2026-07-15 07:09:56 UTC | Separate private sourcing/control behavior from the public store app | Inspected SocialGlowz WebView/profile architecture and current official store/distribution policies; compared four separation models | Recommended a separate compile-time operator flavor and private distribution | `/100-sg-spec socialglowz operator build separation` |
