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

- Windows artifact commit: pending
- Android artifact commit: pending
- Windows environment: pending
- Android device and WebView provider: pending
- Operator: pending
- Date UTC: pending
- Automated local checks: `useNetworkWebview` tests passed (2/2), `pnpm typecheck:core` passed, `pnpm tauri:build` frontend build passed, `git diff --check` passed.
- Native Rust check: not-run locally because the environment lacks GTK/pkg-config dependencies; Windows and Android CI builds remain authoritative.

Result values: `passed`, `failed`, `degraded-accepted`, `not-run`.

## Windows

| ID | Scenario | Expected result | Result | Evidence |
| --- | --- | --- | --- | --- |
| WIN-LAUNCH-001 | Open every canonical WebView network from a fresh installer | Each opens visibly in the central area with no zero-size/orphan host | not-run | pending |
| WIN-SESSION-002 | Profile A/B same-network isolation | Each profile returns to its own cookies/localStorage/session after switch and restart | not-run | pending |
| WIN-SETTINGS-003 | Dark mode, grayscale, text zoom | Embedded view follows documented scope; no silent no-op | not-run | pending |
| WIN-LIFECYCLE-004 | Resize, switch, back, close, eviction, profile deletion | No wrong session, orphan host, or unbounded hidden-host growth | not-run | pending |
| WIN-PROFILE-005 | Active profile and hidden networks | Desktop profile display is real store data and visibility follows active profile | not-run | pending |
| WIN-SHARE-006 | Supported Windows link intake/fallback | Cold and warm app select the correct network or show explicit fallback | not-run | pending |
| WIN-BACKUP-007 | Export, valid restore, invalid/password/version restore | Covered data restores; failures preserve existing state | not-run | pending |
| WIN-DESIGN-008 | Light/dark visual comparison | Semantic token mapping matches documented colors, surfaces, borders, shadows and states | not-run | pending |

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
