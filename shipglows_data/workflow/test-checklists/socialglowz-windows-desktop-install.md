---
artifact: manual_test_checklist
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "socialglowz"
created: "2026-08-02"
updated: "2026-08-02"
status: draft
source_skill: "107-sg-test"
scope: "windows-desktop-install-and-parity"
owner: "Diane"
confidence: medium
target_scope: "manual Windows installer and desktop runtime proof"
stack_profile: "Tauri 2 + Vue 3"
proof_profile: "artifact -> install -> smoke -> regression"
risk_level: high
security_impact: yes
docs_impact: yes
depends_on:
  - "SocialGlowz - Manual Build - Windows workflow"
supersedes: []
evidence:
  - ".github/workflows/manual-build-windows.yml"
next_step: "Run the checklist against the current Windows artifact"
---

# Manual Test Checklist: Windows Desktop Install and Parity

## Contract

- Environment: Windows 10 or Windows 11, clean user profile where possible.
- Artifact: current `socialglowz-windows-<commit>` workflow artifact.
- Test account: dedicated non-production SocialGlowz account.
- Data safety: use test social accounts only; do not publish, send, delete, or purchase anything.

## Status Vocabulary

- `PASS`: expected behavior observed.
- `FAIL`: expected behavior not met; capture the visible error and screen.
- `BLOCKED`: could not execute because of environment, permissions, or missing service.
- `NOT_RUN`: not executed yet.
- `N/A`: not applicable with a reason in Notes.

## Scenarios

| Scenario ID | Surface | Scenario | Required | Expected | Status | Observed | Evidence pointer | Notes | Bug Link |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| win-install-msi | installer | Install the MSI as a standard Windows user. | yes | Installation completes without an unexplained error; Start Menu entry is present. | NOT_RUN | | | | |
| win-install-nsis | installer | Run the NSIS `.exe` installer or portable installer path. | yes | Installer completes and the app launches. | NOT_RUN | | | | Test one installer if both artifacts are equivalent; test both when publishing. |
| win-launch | desktop shell | Launch SocialGlowz from the Start Menu and application shortcut. | yes | Main window opens without a console window, crash, blank screen, or infinite loading. | NOT_RUN | | | | |
| win-auth | authentication | Sign in with the dedicated test account, then reload the app. | yes | Authenticated state survives reload and the user reaches the protected dashboard. | NOT_RUN | | | | Do not use production credentials in evidence. |
| win-network-launch | native webview | Open at least two supported networks from the catalog. | yes | Each network opens in its native WebView and remains inside the SocialGlowz shell. | NOT_RUN | | | | Use networks with available test accounts. |
| win-profile-isolation | profiles/sessions | Switch Profile A -> network -> Profile B -> same network -> Profile A. | yes | Profile sessions do not expose the other profile's account or cookies. | NOT_RUN | | | | Record the network and profile labels, not account secrets. |
| win-preferences | settings | Change theme, grayscale, text zoom, locale, and network selection. | yes | Each setting applies without crash and persists after relaunch where persistence is expected. | NOT_RUN | | | | |
| win-backup-restore | backup | Create an encrypted backup, sign out or reset test state, then restore it. | yes | Backup creation and restore complete; restored settings/profiles are present; invalid password fails safely. | NOT_RUN | | | | Use disposable test data only. |
| win-native-recovery | shell recovery | Close and reopen the active network WebView; minimize, restore, and resize the main window. | yes | No crash, stale overlay, unusable layout, or leaked session appears. | NOT_RUN | | | | |
| win-uninstall | installer | Uninstall through Windows Apps / Control Panel after the smoke test. | yes | Uninstall completes and the application entry is removed. | NOT_RUN | | | | Confirm separately whether user data is intentionally retained. |

## Acceptance Gate

- All required scenarios are `PASS` before calling Windows desktop installation validated.
- Any `FAIL` involving auth, profile/session isolation, data loss, or crash blocks release validation.
- Any `BLOCKED` row requires an explicit environment note before a release claim.
- Attach screenshots or logs only after redacting account identifiers, tokens, cookies, and private URLs.

## Execution Record

- Build commit: `NOT_RUN`
- Artifact: `NOT_RUN`
- Windows version: `NOT_RUN`
- Tester: `NOT_RUN`
- Executed at: `NOT_RUN`
- Overall result: `NOT_RUN`
