---
artifact: test-checklist
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "socialglowz"
created: "2026-08-02"
updated: "2026-08-02"
status: pending
source_skill: 100-sg-spec
scope: "windows-android-platform-parity"
owner: "Diane"
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "shipflow_data/workflow/specs/windows-android-platform-parity.md"
  - ".github/workflows/manual-build-windows.yml"
  - ".github/workflows/manual-build-android.yml"
---

# Windows / Android Platform Parity Checklist

## Execution Record

- Windows artifact commit: `51527bf573a1175fe718ee3b817a7a37b934cd1e`
- Android artifact commit: `98b6daedb36a4c4d0a11079d92a6abd97d9e3ba6`
- Windows installer: https://github.com/diane-defores/socialglowz/releases/download/windows-latest/SocialGlowz-Windows-latest.exe
- Android debug artifact: https://github.com/diane-defores/socialglowz/actions/runs/30764933664
- Windows workflow run: https://github.com/diane-defores/socialglowz/actions/runs/30770131523
- Windows environment: pending
- Android device and WebView provider: pending
- Operator: pending
- Date UTC: 2026-08-02
- Automated local checks: `useNetworkWebview` tests passed (3/3), targeted ESLint passed, `pnpm tauri:build` frontend build passed, `git diff --check` passed.
- Native Rust check: not-run locally because the environment lacks GTK/pkg-config dependencies; Windows and Android CI builds remain authoritative.

Result values: `passed`, `failed`, `degraded-accepted`, `not-run`.

## Windows

| ID | Scenario | Expected result | Result | Evidence |
| --- | --- | --- | --- | --- |
| WIN-LAUNCH-001 | Open every canonical WebView network from a fresh installer | Each opens visibly in the central area with no zero-size/orphan host | passed | Operator, 2026-08-02: network opening is instantaneous on the `2148da3` Windows installer. |
| WIN-SESSION-002 | Profile A/B same-network isolation | Each profile returns to its own cookies/localStorage/session after switch and restart | not-run | pending |
| WIN-SETTINGS-003 | Dark mode, grayscale, text zoom | Embedded view follows documented scope; no silent no-op | not-run | Previous `2148da3` build failed: the native WebView obscured settings. The `51527bf` installer adds both suspend/restore and a dark native initial background; manual retest remains pending. |
| WIN-LIFECYCLE-004 | Resize, switch, back, close, eviction, profile deletion | No wrong session, orphan host, or unbounded hidden-host growth | not-run | Operator, 2026-08-02: rapid network switching and sidebar resize passed; back, close, eviction, and deletion remain untested. |
| WIN-PROFILE-005 | Active profile and hidden networks | Desktop profile display is real store data and visibility follows active profile | not-run | Previous `2148da3` build lacked a discoverable creation action. The `9b66e64` installer adds `Ajouter un profil` and awaits manual isolation proof. |
| WIN-SHARE-006 | Supported Windows link intake/fallback | Cold and warm app select the correct network or show explicit fallback | not-run | pending |
| WIN-BACKUP-007 | Export, valid restore, invalid/password/version restore | Covered data restores; failures preserve existing state | not-run | pending |
| WIN-DESIGN-008 | Light/dark visual comparison | Semantic token mapping matches documented colors, surfaces, borders, shadows and states | not-run | `e520778` Windows installer used Aura's default emerald primary controls despite the Vue shell's blue action token. The passed `6abcfd5` Windows build maps Aura primary controls to its blue token family and awaits rendered proof. |
| WIN-DIAGNOSTICS-009 | Header diagnostic copy after launch/switch/resize | Report identifies commit/build and platform, records lifecycle events, and omits URLs, email, profiles, cookies and sessions | not-run | pending |

## Efficient Windows Session

Run these checks without restarting the app between them:

1. Open one network, then switch quickly between two others and back to the first.
2. Resize each desktop sidebar while a network is visible.
3. Use the right-panel profile control to add or select a second profile, then open the same network.
4. Click the header diagnostic icon and paste the copied report into the test notes. Confirm that it contains recent WebView events but no URL, email, profile ID, cookie or session content.

This single session covers `WIN-LAUNCH-001`, `WIN-LIFECYCLE-004`, `WIN-PROFILE-005`, and `WIN-DIAGNOSTICS-009`.

## Android

| ID | Scenario | Expected result | Result | Evidence |
| --- | --- | --- | --- | --- |
| ANDROID-NATIVE-005 | Bottom bar, profile popup, back, haptics, tap sound, zoom, grayscale, dark mode, locale | Native controls and settings behave as specified | not-run | pending |
| ANDROID-SESSION-006 | Multi-profile/fallback mode with CinderReels and cookie-heavy network | Mode is recorded; profile sessions do not leak within the supported contract | not-run | pending |
| SHARE-007 | Android share/deep link cold and warm start | Correct network opens without losing auth/onboarding state | not-run | pending |
| BACKUP-008 | Export, valid restore, invalid/password/version restore | Covered data restores; limitations are visible and failures are safe | not-run | pending |
| DESIGN-009 | Light/dark device comparison | Native bar and Vue shell follow the semantic token mapping | not-run | pending |

## Release Decision

- Any P1 scenario failed: parity claim blocked.
- Any scenario not-run: corresponding capability remains `unknown`.
- `degraded-accepted` requires a written platform reason and visible user-facing limitation.
- The checklist is complete only when both artifacts come from the same reviewed commit and the evidence is attached or linked.
