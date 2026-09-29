# Test Log

## 2026-09-29 - Language-first onboarding using existing account and billing components

- Scope: `BUG-2026-09-29-002`, related startup recovery `BUG-2026-09-29-001`; private candidate branch `codex/community-prod-readiness`, draft PR #67.
- User retest: candidate `37495179` connects according to Diane, but skips language, existing onboarding/account offer and trial explanation. This report does not establish the exact authenticated entitlement/native result.
- Reproduction: root's existing `127.0.0.1:3016` browser origin with old completed state opens directly on English login before the patch, without language choice.
- Repair: reuse OnboardingFlow, LoginView, BillingAccessPanel, existing locales/auth/cloud/session-lock/router/native gates. Local explicit versioned acknowledgements replace the legacy boolean as journey authority. Old profile/network preferences survive untouched replay/skip; current locale persists; account/access must match the hydrated identity. No auth/provider/backend/trial policy change, data purge or grant.
- Real browser pass, existing origin: reload asks language first; French welcome/profile/networks/features reuse the existing flow, with Profile 1 and existing network selection preserved. Signup/sign-in fields remain empty; Back works; reload resumes account offer. Local choice announces no trial/protected networks and opens isolated Kanban.
- Real browser pass, fresh `localhost:3016` origin: English journey and skip intro lead to account choice; Show/Hide password labels are English; Back returns to choice. Account card at 1280×720 fits without the nested black background after the existing modifier specificity repair.
- Real replay pass: local Kanban → profile menu → Settings → existing tutorial replay action → French language choice → welcome → skip intro → account offer. Replay does not bypass account/access. Capture 08 was visually inspected by root.
- Existing route guard pass: signed-out /#/twitter redirects to /login?access=required&destination=Twitter with translated sign-in requirement; no stale loading notice or protected network.
- Evidence: ignored local `release-acceptance/onboarding-20260929/01-before-login.png` through `08-account-offer-fr-final.png`; root inspected actual rendered captures. No credentials submitted, identity injected, trial/user created or real payment/email action issued.
- Final automated checks under Doppler: `vitest run` passes **452 tests in 67 files** (11:36 UTC); `typecheck:core` passes; scoped ESLint 0 errors and 13 existing formatting warnings; changed-file token drift 0 findings; prd Tauri frontend Vite bundle succeeds. Delay tests cover A→B/sign-out cloud identity/data, restart/redeem/checkout ownership and busy flags, anonymous restoration, unknown trial/date/grace and no onboarding/native preload bypass.
- Additional attempted `typecheck:full`: **failed, 123 diagnostics in unchanged files** (older test globals/fixtures, Booleanish/event signatures, ES6 .at); no repair-file diagnostic. This is recorded separately and not represented as a passing global typecheck.
- Verdict: `fixed-pending-verify`, not closed. Browser public entry/replay/local and local regression proof pass; actual rebuilt Windows auth/restoration/trial/date/license/denied-rights/lock/native WebView proof remains pending. Candidate-only commit/push is authorized for that installer, with no main merge, backend deployment or public promotion.
- Durable record: `shipglows_data/workflow/bugs/BUG-2026-09-29-002.md`; root owns exact-SHA Windows build dispatch and native acceptance.

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
