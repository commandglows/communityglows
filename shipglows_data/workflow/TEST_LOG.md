# Test Log

## 2026-09-29 - English copy before language choice

- Scope: first page of `OnboardingFlow.vue`, candidate commit `65fcff3e4baacf7f1a0a98fe20aaa03e12d9697e`.
- User feedback on an earlier installed candidate: language choice appeared and the interface was liked; its title and explanatory copy were French before the user had selected a language. Diane reports access has been valid for ten days. The exact returned entitlement payload and this newer candidate's Windows journey were not observed.
- Change: language-choice title/description now use the existing English locale explicitly (`lang="en"`). Selecting Français/English still applies the chosen locale to the rest of the existing journey.
- Doppler checks: `pnpm typecheck:core` passed; production Tauri build and scoped ESLint passed.
- Windows [run 36577196278](https://github.com/commandglows/communityglows/actions/runs/36577196278) passed build and existing NSIS/MSI onboarding lifecycle checks on the exact commit. Stable/public publication skipped on the candidate branch.
- Exact private artifacts: NSIS `release-acceptance/65fcff3-language-copy/communityglows-windows-65fcff3e4baacf7f1a0a98fe20aaa03e12d9697e/nsis/CommunityGlows_0.1.0_x64-setup.exe` (3,194,182 bytes; `B0D8A0E652E8E3B1CC9C9FBB8F3137AF6F681710F86A56C87B8192F43AD244CE`); MSI `release-acceptance/65fcff3-language-copy/communityglows-windows-65fcff3e4baacf7f1a0a98fe20aaa03e12d9697e/msi/CommunityGlows_0.1.0_x64_en-US.msi` (4,530,176 bytes; `5C7F097101EEEBCE51CBF278B13EA578ACA10B331AE904D99013371E658D0420`).
- Result: packaged lifecycle passes. User-visible Windows acceptance of this exact `65fcff3` candidate is unreported. Check the English first screen, the next screen after Français, and the existing account/trial explanation. BUG-001 separately requires the actual access screen/result; the earlier report of valid access does not prove the precise entitlement state.

## 2026-09-29 - Onboarding lifetime and installed Windows lifecycle

- Scope: BUG-2026-09-29-002; private candidate branch `codex/community-prod-readiness`, draft PR #67.
- Product rule confirmed by Diane: once completed, onboarding stays hidden on normal launches of that install/build; an intentional new feature build/update or a reinstall reopens the existing journey at language choice; Settings can replay it manually.
- Implementation reuses the existing wizard, account form, billing/access panel and protected gates. The onboarding witness is local-only, excluded from cloud acknowledgement and portable backups, and independent from the existing entitlement installation key. Profiles, network preferences, trial identity and AppData sentinels stay untouched in the installer checks.
- Surface limits: Windows NSIS/MSI detect identical-package reinstall and update with an installer-owned marker; Chrome/Firefox use their existing install/update event. Web/dev and non-Windows native targets replay for a new build but identical-package reinstall detection is not claimed.
- Doppler local checks: 466 tests / 68 files, core typecheck, production-configured Tauri frontend build, Chrome build/runtime, scoped lint, token drift and all required PR checks pass. Full Vue typecheck still has the previously recorded 123 diagnostics; it was not claimed green.
- Windows [run 36572379605](https://github.com/commandglows/communityglows/actions/runs/36572379605), exact code SHA `cd9fcc5c0f0c3ef26a4a5581f51776b0b74728c1`: production EU configuration, Windows package build, Rust and PR checks pass. On the disposable runner, both NSIS and MSI install, rotate the witness on identical-package reinstall/repair, remove it on successful uninstall, preserve AppData sentinels and do not start the normal app. The MSI actually reused the previous NSIS install directory; the test reads the resolved location. The generated NSIS template check confirms witness cleanup follows the running-app cancellation check. GUI cancellation itself was not exercised.
- Exact artifacts, downloaded and SHA256-verified without launching: NSIS `release-acceptance/cd9fcc5-onboarding/nsis/CommunityGlows_0.1.0_x64-setup.exe` (3,196,946 bytes; `815631DE863611D3612254D7AE33E18C89BBBEFC81D0C94F33A3EC5A5DA56787`); MSI `release-acceptance/cd9fcc5-onboarding/msi/CommunityGlows_0.1.0_x64_en-US.msi` (4,530,176 bytes; `F7C6E37DB05D08A7601B935EB2E121082E30D81961CFA48D0C7D8A67706ADAB9`). Stable/public publication was skipped on the candidate branch.
- Historical result for candidate `cd9fcc5`: its installer lifecycle passed. The later `65fcff3` candidate supersedes it for user-visible Windows acceptance. Current trial/license outcome, restored sessions and protected native behavior remain unverified; do not close BUG-002 or promote the public installer yet.

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
- Packaging pass at **11:50:51 UTC**: Windows [run 36563568490](https://github.com/commandglows/communityglows/actions/runs/36563568490) succeeds on exact code SHA `f69b472d09000da63aaab2c12b4d15b8ee61ad35`, with production EU configuration and all required PR checks passing. Public installer publication is **skipped**, branch is not main.
- Downloaded private artifacts independently rechecked locally: NSIS `release-acceptance/f69b472d/nsis/CommunityGlows_0.1.0_x64-setup.exe`, **3,184,615 bytes**, SHA256 `244BD08355D7A67D577B0863599D39519B5D32239DAB07A2FF54D2A402D80B7F`; MSI `release-acceptance/f69b472d/msi/CommunityGlows_0.1.0_x64_en-US.msi`, **4,509,696 bytes**, SHA256 `B03B1D906E8599E8ACB45523EFEFF3C80EE3A117BF3252858A58751CD2CEBB04`.
- Historical checkpoint: root delivered candidate `f69b472d` for language/account/real access acceptance; no native response was received at that point. Browser and Doppler preview server stopped cleanly. Later user feedback on `37495179` and later packaging of `65fcff3` are recorded above; neither establishes the exact returned entitlement state.
- Verdict: `fixed-pending-verify`, not closed. Browser public entry/replay/local and local regression proof pass; actual rebuilt Windows auth/restoration/trial/date/license/denied-rights/lock/native WebView proof remains pending. Candidate-only commit/push is authorized for that installer, with no main merge, backend deployment or public promotion.
- Durable record: `shipglows_data/workflow/bugs/BUG-2026-09-29-002.md`; root owns the remaining installed Windows acceptance. BUG-002 remains `fixed-pending-verify`, BUG-001 remains `fix-attempted`.

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
- Initial packaging checkpoint: Windows run `36556811536` built exact code commit `37495179e44d784907ad0c978bf617499faa699c`; NSIS/MSI were downloaded and the user received the installer link. All PR #67 provider checks passed. This packaging did not prove an authenticated billing result.
- Stronger subsequent real-app service proof at 10:50:19 UTC: CommandGlows bridge function completed without error at 10:50:19.551, followed by CommunityGlows `billing:getProductAccess` completing without error at 10:50:19.640. That actual function pair previously failed at 10:41:16 with mismatch/not-configured errors. Root observed real calls without injected identity, submitted auth or fabricated production actions. Service path now succeeds; exact returned right/payload and Windows rendered outcome remain unknown.
- User's installed Windows retest of `37495179`: Diane reports the candidate connects but skips language/onboarding/account/trial explanation. This partial observation triggered BUG-002 and does not establish the exact returned right, denied-rights handling, sign-out/reconnect or native lock behavior.
- Latest private candidate: exact code `65fcff3e4baacf7f1a0a98fe20aaa03e12d9697e`, Windows run `36577196278`, passed packaging and installer lifecycle. User-visible Windows acceptance of its first language screen, selected-language next screen, account/trial explanation and access result remains unreported.
- Durable record: `shipglows_data/workflow/bugs/BUG-2026-09-29-001.md`, `fix-attempted`.
- Next owner: root collects manual acceptance on the exact `65fcff3` installer: rendered onboarding/account/trial sequence and the actual access screen/result after normal sign-in or restored session. Retest failure/recovery/lock/settings separately if encountered; neither bug closes from packaging or suppressed service payloads.

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
