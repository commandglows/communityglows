# Test Log

## 2026-09-29 - Windows startup access failure and recovery

- Scope: `BUG-2026-09-29-001`; current Windows launch candidate, production Convex.
- Tester / evidence: Diane's supplied screenshot and report of no deliberate sign-in during this launch.
- Observed: “Accès impossible à vérifier”, retry/purchase/support only; promised sign-out, account, export and privacy recovery have no visible controls.
- Result: failed. Exact restored session state remains unknown from the screenshot.
- Root diagnostic evidence: Community access action `bridge_not_configured`; CommandGlows Convex next-hop `bridge_secret_mismatch`. Existing Vercel secret alignment attempted with unchanged canonical Doppler/Convex value and existing immutable production redeployed READY. Actual calls at 10:32:35 UTC still failed with mismatch; hosted diagnosis continues.
- Later production diagnostic retest: root observed different stored/evaluated credential values despite the stored value matching Doppler. Reapplying the unchanged canonical value restored evaluated equality. A read-only bridge query for a nonexistent diagnostic identity then reached `global_user_not_found`, proving the secret check passed with no data writes. The underlying divergence cause is unknown; complete Windows billing is still pending.
- Provider evidence: Vercel deployment `dpl_75uDNpn1pdX8oZdWqcXHWUzBrZm8` READY, distinct from proof of a customer's access.
- Local technical retest after bounded frontend patch: 428 tests pass in 64 files under Doppler dev; core TypeScript, focused ESLint (zero errors, 14 existing warnings) and changed-file design drift scan (zero findings) pass.
- Real browser retest: `http://localhost:3016/#/login` renders empty email/password and Sign in after toggling to sign-in; no access-failure gate, account submitted or injected authentication. Capture `release-acceptance/240afc0/login-recovery-patch.png` inspected. Initial/HMR state unknown; full fresh installation and native behavior not proven.
- Native acceptance: not run. Browser/automated checks do not substitute for the current installed app's sign-in/reconnect, session-lock, export/privacy recovery and denied-rights proof. Windows run `36556811536` builds exact code commit `37495179e44d784907ad0c978bf617499faa699c` and is in progress at this documentation checkpoint.
- Subsequent packaging checkpoint: Windows run `36556811536` completed successfully at exact code commit `37495179e44d784907ad0c978bf617499faa699c`; NSIS/MSI downloaded and user sent the new installer link. All PR #67 provider checks pass. Candidate available for acceptance; no successful actual Windows billing response observed yet.
- Stronger subsequent real-app service proof at 10:50:19 UTC: CommandGlows bridge function completed without error at 10:50:19.551, followed by CommunityGlows `billing:getProductAccess` completing without error at 10:50:19.640. That actual function pair previously failed at 10:41:16 with mismatch/not-configured errors. Root observed real calls without injected identity, submitted auth or fabricated production actions. Service path now succeeds; exact returned right/payload and Windows rendered outcome remain unknown.
- Durable record: `shipglows_data/workflow/bugs/BUG-2026-09-29-001.md`, `fix-attempted`.
- Next owner: root review/browser verification and current Windows acceptance before public release.

## 2026-05-23 - CinderReels Android Session Isolation

- Scope: spec `shipglows_data/workflow/specs/android-webview-storage-isolation.md`
- Environment: Android APK installed on device
- Tester: user
- Source: sf-test
- Status: pass
- Confidence: medium
- Result summary: User reported PASS for CinderReels Android A/B/A profile isolation after installing the APK.
- Bug pointer: none
- Evidence pointer: user report in chat on 2026-05-23
- Follow-up: sf-ship full close requested by user

## 2026-05-24 13:39 UTC - Android WebView pooling manual QA

- Skill: sf-test
- Environment: Android APK installed on real phone from GitHub Actions / Blacksmith workflow artifact, per project development mode.
- Scope: `shipglows_data/workflow/specs/android-webview-pooling-fast-switching.md`
- Tester: Diane
- Scenario: Test 1, same-profile fast switch.
- Steps reported:
  1. Open Profile A network A.
  2. Switch to another network.
  3. Return to the first network.
- Expected: return to the warm WebView host with no visible full reload and near-instant display.
- Observed: return takes about 4 seconds and visibly reloads every time.
- Result: FAIL_LOADING / FAIL_PERFORMANCE
- Evidence supplied: user report in chat; no copied app logs, logcat, Sentry event, device model, or artifact commit yet.
- Linked bug: `shipglows_data/workflow/bugs/BUG-2026-05-24-001.md`
- Next step: collect Android SFZ logs around `open_webview` / `show_webview` / `hide_webview`, then route to sf-fix.

### Follow-up results

- 2026-05-24 13:42 UTC - Test 2, profile isolation between Profile A and Profile B: PASS.
- 2026-05-24 13:42 UTC - Test 3, returning to Profile A after Profile B: PASS.
- Interpretation: session isolation appears OK from manual observation; the current blocker remains fast-switch pooling/reload performance from Test 1.

### 2026-05-24 13:53 UTC - Copied SFZ log analysis

- Evidence source: user copied Android in-app `SFZ` debug logs.
- Relevant log lines:
  - `⇄ SWITCH facebook → instagram`
  - `cookies saved for session (...)`
  - `cookies restored for session (...)`
  - `loadUrl: https://instagram.com`
  - `⇄ SWITCH instagram → facebook`
  - `loadUrl: https://facebook.com`
- Interpretation: the installed APK is using the old/native switch path that reloads by design. The copied logs also include `reuse existing webview (switch)`, a debug line absent from the current source tree, which indicates the installed APK is not the current pooling implementation or was built from an older revision.
- Result: BLOCKED_STALE_APK for validating the new pooling code; the observed reload remains valid for the installed APK.
