---
artifact: audit_report
metadata_schema_version: "1.0"
artifact_version: 1.1.0
project: socialglowz
audit_id: sg-google-play-compliance-2026-07-15
status: reviewed
created: "2026-07-15"
created_at: 2026-07-15
updated: "2026-07-15"
updated_at: 2026-07-15
owner: Diane
source_skill: 401-sg-audit-code
scope: android-webview-privacy-platform-policy
confidence: high
risk_level: critical
security_impact: yes
docs_impact: yes
domains:
  - android-webview
  - google-play-policy
  - privacy
  - third-party-platforms
issue_counts:
  critical: 4
  high_or_conditional: 5
depends_on: []
supersedes: []
evidence:
  - "Source audit conducted on 2026-07-15"
  - "Static source-removal verification for SGP-01 and SGP-02"
next_step: "Verify the public Android package on device and CI, then remediate the remaining release blockers."
---

# Google Play Android compliance audit

## Executive verdict

**NO-GO for a public Google Play submission in the current state.** The initial audit found four release blockers and five high or conditional risks. The automatic-consent and anti-detection code has since been removed in source, but device/CI proof is still pending and account deletion, privacy/Data Safety, and the other release gates remain open.

This is a technical and policy-readiness audit, not legal advice. It does not establish whether SocialGlowz has contractual permission from each third-party platform. A lawyer should validate the final privacy notice, terms, platform agreements, and EU consumer/privacy obligations before release.

## Scope and limits

- Reviewed the tracked Android WebView plugin, Rust/Tauri commands, app privacy and terms screens, public website policies, account backend, billing activation flow, and project trackers.
- Compared behavior with Google Play policies current on 2026-07-15 and relevant GDPR/CNIL guidance.
- Checked the live public URLs: `/privacy` and `/terms` returned 200 after redirect; `/account-deletion` returned 404.
- Did not inspect Play Console declarations, written platform permissions, processor contracts, a generated Android application manifest, a signed AAB, or an installed release build.
- `pnpm exec tauri info` could not run because the Tauri CLI binary is not installed in this workspace. Target SDK, merged permissions, signing, backup rules, and release behavior therefore remain unverified.

## Findings

### SGP-01 - Automatic cookie consent removes user choice

**Status: source remediation implemented; verification pending.**

The Android WebView injects scripts that repeatedly search for and click consent controls such as `Accept`, `Allow`, `Tout accepter`, OneTrust, Cookiebot, Didomi, Axeptio, Quantcast, Meta, and TikTok (`src-tauri/plugins/android-webview/android/src/main/java/com/socialglowz/webview/NativeWebViewPlugin.kt:710`, `:755`, `:4582`, `:4679`). This creates consent without the user's affirmative action and makes refusal harder than acceptance.

**Implemented source change (2026-07-15):** removed the Android cookie/consent scripts and lifecycle calls. The platform consent UI must remain under direct user control. Device and CI checks must still prove that no variant or generated package retains the behavior.

### SGP-02 - Anti-detection code and unauthorized WebView risk

**Status: source remediation implemented; verification and authorization pending.**

Desktop and Android code patch browser fingerprints, hide `navigator.webdriver`, fabricate browser properties, strip the Android WebView marker, and describe the injection as critical for "anti-bot bypass" (`src-tauri/src/lib.rs:14`, `src-tauri/plugins/android-webview/android/src/main/java/com/socialglowz/webview/NativeWebViewPlugin.kt:258`, `:4553`, `:4582`). Google Play prohibits unauthorized access, service use that violates terms, and facilitation of security-circumvention. Its spam policy also disallows apps whose primary purpose is a website WebView without permission from the site owner or administrator.

**Implemented source change (2026-07-15):** removed anti-detection, WebView-marker stripping, desktop user-agent and viewport forcing, app-banner automation, arbitrary desktop script injection, and friends-only feed filtering. The public build now uses the actual WebView user agent. This does not constitute platform permission: obtain written authorization or use official APIs, Android Custom Tabs, or the external browser for every unsupported integration.

### SGP-03 - Account deletion is absent and the privacy notice is inaccurate

**Severity: critical / release blocker**

The backend exposes account reads but no user deletion operation (`convex/users.ts:1`). No in-app account deletion flow was found. The live `/account-deletion` URL returns 404, while the public privacy notice claims users can delete their account and data through account settings (`site/src/pages/privacy.astro:56`). Google Play requires both an in-app deletion path and a functional web deletion resource when users can create accounts.

**Required remediation:** implement authenticated in-app deletion and a public deletion-request page. Define and implement cascading deletion for authentication records, user data, profiles, social accounts, settings, links, filters, entitlements, and backups. Document any legally required billing retention separately, with purpose and duration. Correct the privacy notice before release.

### SGP-04 - Privacy notice and Data Safety basis are incomplete

**Severity: critical / release blocker**

The in-app policy is a generic template using `support@example.com` (`src/ui/common/pages/privacy-policy.vue:1`). The public notice omits or inadequately describes the legal controller, legal bases, recipients/processors, international transfers, concrete retention, deletion mechanics, CNIL complaint rights, local session capture, backup exports, optional location access, billing/activation data, and website analytics (`site/src/pages/privacy.astro:19`). The public layout also loads a third-party analytics script that is not identified in the policy (`site/src/layouts/Layout.astro:121`).

Because SocialGlowz injects code and controls behavior in embedded pages, it cannot safely assume that all third-party WebView data falls under the open-web Data Safety exception. The app needs a domain-by-domain data-flow inventory before completing Play Console declarations.

**Required remediation:** publish one accurate, accessible policy shared by app and website; identify the actual legal entity and contact details; map every data type, purpose, recipient, SDK, retention rule, deletion path, and security control; then complete Data Safety from the implemented behavior. Audit or remove the website analytics script until its processor, cookies, transfers, and consent basis are known.

### SGP-05 - Social session storage and WebView transport are insufficiently hardened

**Severity: high**

Raw cookies and complete localStorage snapshots are persisted in ordinary Android `SharedPreferences` (`NativeWebViewPlugin.kt:1219`, `:1517`, `:1683`). Third-party cookies are accepted, mixed content is always allowed, and subsequent navigation accepts any HTTP or HTTPS host (`:4559`, `:4574`, `:4603`). Diagnostics can expose full URLs, file URIs, and the signed-in email (`:1190`, `:2304`, `:2848`, `src/lib/buildDiagnostics.ts:17`). The final Android backup configuration is unavailable.

**Required remediation:** use Android Keystore-backed encrypted storage or avoid persistence; prevent authentication stores from Android cloud backup; require HTTPS; use `MIXED_CONTENT_NEVER_ALLOW`; bind navigation to reviewed domains; redact production diagnostics; and add a restrictive app CSP. Keep the existing Argon2id/AES-256-GCM user backup encryption (`src-tauri/src/backup.rs:93`).

### SGP-06 - UGC safeguards and reviewer access are not demonstrated

**Severity: high**

SocialGlowz is a specialized client for services containing user-generated content. Google Play requires applicable terms acceptance, objectionable-content rules, and robust in-app reporting and blocking. The current terms are generic and do not establish this contract (`site/src/pages/terms.astro:26`). Platform-native controls may satisfy part of the requirement only if they remain available and work reliably inside every supported WebView.

**Required remediation:** add explicit UGC terms acceptance and rules, verify report/block controls per network, document escalation handling, and provide Play reviewers with durable credentials and exact navigation instructions that do not depend on expiring OTPs.

### SGP-07 - Android monetization strategy is unresolved

**Severity: high / conditional**

The app redeems Lifetime Deal or early-bird codes to unlock digital functionality (`src/ui/setup/pages/SocialGlowz/components/BillingAccessPanel.vue:26`, `src/locales/en.json:130`) but has no Google Play Billing integration. Play Billing is generally required for in-app digital goods unless a documented exception or eligible regional program applies.

**Required remediation:** choose one release model before listing work: integrate Play Billing for Android, or implement a compliant consumption-only/external-offer model for eligible regions without prohibited in-app steering. Validate the exact copy and flow against the selected program.

### SGP-08 - The Android release artifact cannot be proven compliant

**Severity: high**

Only the plugin manifest is tracked; no generated Android application project, merged manifest, release AAB, target SDK, signing configuration, or data-backup rules were available. The plugin compiles with SDK 35 and min SDK 24, but that does not prove the final application's target SDK. The Tauri identifier is still `com.socialglowz.desktop` (`src-tauri/tauri.conf.json:3`).

**Required remediation:** generate the Android project, assign the permanent Android application ID, target API 35 or newer, inspect the merged release manifest and permissions, configure signing and backup rules, produce an AAB, and run Play pre-launch plus physical-device tests.

### SGP-09 - Store claims and third-party branding need correction

**Severity: high / conditional**

The website claims users can add any website (`site/src/pages/features.astro:13`), while both Rust and Android reject unknown network identifiers (`src-tauri/src/lib.rs:184`, `NativeWebViewPlugin.kt:1248`). Social network names and marks also require non-affiliation clarity and defensible trademark use.

**Required remediation:** make the listing match Android behavior exactly, remove unsupported claims, avoid suggesting official affiliation, and retain permission/licensing evidence for logos and branded assets.

## Provisional Data Safety inventory

This inventory is not ready for Play Console submission. It identifies the decisions that must be evidenced:

| Data | Current behavior | Provisional treatment |
| --- | --- | --- |
| Name/email/account ID | Stored in Convex for authentication and account access | Collected; disclose purpose, retention, deletion, security, and recipients |
| Social cookies/localStorage | Captured and persisted on the Android device per profile | On-device-only may be outside Play's "collected" definition, but must be disclosed in privacy/security documentation and protected as authentication data |
| Third-party WebView activity | Sent directly to embedded platforms; app injects and controls page behavior | Map per platform; do not rely on the open-web exception without written analysis |
| Diagnostics, URLs, email, file URIs | Logged or copied locally | Redact and production-gate; assess any crash/telemetry transmission before declaring |
| Optional location for automatic theme | Requested through browser geolocation and used locally | Verify final permissions and transmission; disclose access even if it remains on-device |
| Billing/activation and entitlements | Stored by the backend to unlock access | Collected; disclose purchase/access purpose, processors, retention, and deletion exceptions |
| Encrypted user backup | User-triggered export containing app and social session data | Document user control, encryption, destination, restore behavior, and deletion limitations |

## Existing positive controls

- Initial Rust URL validation requires HTTPS and an allowlisted network host (`src-tauri/src/lib.rs:166`).
- Android file selection uses the system document picker rather than broad storage access (`NativeWebViewPlugin.kt:4770`).
- User-exported backups use Argon2id and AES-256-GCM (`src-tauri/src/backup.rs:93`).
- Social profiles are separated and backup export is user initiated.
- The public privacy and terms pages are reachable; they need substantive correction rather than creation from zero.

## Release gates

- [~] Remove automatic consent, anti-detection, WebView-marker stripping, and anti-bot bypass code from the public build. Source removal and static scan complete; device and CI package proof pending.
- [ ] Establish written authorization or replace each embedded platform integration with an approved mechanism.
- [ ] Implement in-app and web account deletion with verified backend erasure.
- [ ] Publish accurate app/site privacy and terms, then complete a code-backed Data Safety declaration.
- [ ] Harden cookie/localStorage storage, navigation, mixed content, backup rules, CSP, and diagnostics.
- [ ] Implement and test UGC terms, reporting, blocking, moderation, and reviewer access.
- [ ] Select and implement the Play-compliant billing/distribution model.
- [ ] Generate and inspect the release Android project and AAB with a permanent app ID and current target API.
- [ ] Reconcile store copy, supported networks, ads/content declarations, target audience, content rating, and branding permissions.
- [ ] Complete required Play closed testing, identity verification, pre-launch reports, and legal review.

## Authoritative references

- [Google Play User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)
- [Google Play account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)
- [Google Play Data Safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [Google Play Device and Network Abuse policy](https://support.google.com/googleplay/android-developer/answer/16559646?hl=en)
- [Google Play WebView and spam policy](https://support.google.com/googleplay/android-developer/answer/9899034?hl=en)
- [Google Play user-generated content policy](https://support.google.com/googleplay/android-developer/answer/9876937?hl=en)
- [Google Play Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en)
- [Google Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)
- [CNIL mobile application recommendations](https://www.cnil.fr/fr/recommandations-applications-mobiles)
- [CNIL cookie and tracker consent requirements](https://cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi)
- [GDPR Article 13 information requirements](https://eur-lex.europa.eu/legal-content/EN/TXT/?toc=OJ%3AL%3A2016%3A119%3A&uri=uriserv%3AOJ.L_.2016.119.01.0001.01.ENG)

## Recommended next step

This is a chantier rather than a bounded patch. Create one remediation specification before implementation:

`/100-sg-spec SocialGlowz Google Play compliance remediation`

The specification should separate the public Play package from any private operator build at compile time, define the authorized integration architecture, and make account deletion, privacy/Data Safety, session security, UGC, billing, and Android release proof independently testable acceptance gates.
