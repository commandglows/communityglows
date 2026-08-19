---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: "communityglows"
created: "2026-08-19"
created_at: "2026-08-19 12:06:29 UTC"
updated: "2026-08-19"
updated_at: "2026-08-19 12:30:00 UTC"
status: partial
source_skill: shipglows
scope: android-password-manager-autofill
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
user_story: "En tant qu'utilisateur Android de CommunityGlows, je veux utiliser le gestionnaire de mots de passe configuré sur mon appareil dans les formulaires CommunityGlows et les WebViews sociales, afin de me connecter sans copier manuellement mes mots de passe."
linked_systems:
  - "src/ui/setup/pages/CommunityGlows/views/LoginView.vue"
  - "src-tauri/plugins/android-webview/android/src/main/java/com/communityglows/webview/NativeWebViewPlugin.kt"
  - "src-tauri/plugins/android-webview/android/src/main/AndroidManifest.xml"
  - "shipglows_data/technical/android-webview-session-isolation.md"
  - "shipglows_data/technical/public-webview-platform-boundary.md"
depends_on:
  - artifact: "shipglows_data/workflow/specs/communityglows-password-manager-foundation.md"
    artifact_version: "1.0.0"
    required_status: ready
  - artifact: "shipglows_data/technical/android-webview-session-isolation.md"
    artifact_version: "1.2.1"
    required_status: reviewed
  - artifact: "shipglows_data/technical/public-webview-platform-boundary.md"
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes: []
evidence:
  - "The native plugin constructs social WebViews with the Activity context, which is required by Android Autofill."
  - "The native WebViews do not currently set an explicit importantForAutofill policy."
  - "Android WebView maps HTML forms, web domains, placeholders, and W3C autocomplete tokens into its virtual Autofill structure."
  - "CommunityGlows isolates Android WebKit sessions per profile and network, while the system credential store is explicitly outside that isolation contract."
next_step: "Compile in an Android toolchain and validate Google Password Manager, 1Password, and Bitwarden on physical or representative devices."
---

# Android Password Manager Autofill

## Status

Guarded Autofill participation is implemented for the main, managed social, and child WebViews. Android compilation and provider/device validation remain pending.

## User Story

En tant qu'utilisateur Android de CommunityGlows, je veux utiliser le gestionnaire de mots de passe configuré sur mon appareil dans les formulaires CommunityGlows et les WebViews sociales, afin de me connecter sans copier manuellement mes mots de passe.

Primary actor: an Android user who has selected Google Password Manager, 1Password, Bitwarden, or another compatible Android Autofill service.

Trigger: the user focuses a username or password field in the CommunityGlows host WebView or a visible social-network WebView.

Observable outcome: Android offers credentials through its normal system Autofill UI and fills the selected form without CommunityGlows accessing the external vault.

## Decision

CommunityGlows will participate in the Android Autofill Framework. It will not call password-manager vendor APIs and will not use Android Credential Manager as a privileged browser on behalf of third-party social origins.

The implementation will:

- preserve the platform-provided WebView identity and real page origin;
- mark the main and managed WebViews as important for Autofill on API 26+;
- rely on WebView's native virtual Autofill structure for HTML forms;
- preserve manual entry and external-browser fallbacks;
- treat provider availability and matching as user-controlled, best-effort behavior.

## Success Behavior

- On Android 8+, focusing an eligible field can trigger the configured Autofill service.
- On Android 11+, inline suggestions may appear when both the provider and input method support them.
- Google Password Manager, 1Password, and Bitwarden can be selected independently; CommunityGlows contains no provider-specific credential branch.
- The host CommunityGlows login receives suggestions based on its app/form semantics.
- A social WebView exposes the real web domain so the provider can match saved items for that domain.
- The user chooses among multiple accounts for a social domain; CommunityGlows does not pick an account based on its own profile name.
- Filling does not automatically submit the form from CommunityGlows code.
- No configured service or no matching item leaves the form fully usable.

## Error and Degraded Behavior

- On Android below API 26, skip Autofill-specific view configuration and preserve manual input.
- If Autofill is disabled or unsupported, do not display an authentication error; this is a device capability state, not a failed login.
- If a provider cannot parse a third-party form, preserve manual input and any existing "open in browser" fallback.
- If a network blocks embedded browsers, do not spoof the user agent or inject workarounds to obtain Autofill.
- If Autofill works in the main WebView but not in a managed social WebView, report partial support in verification evidence rather than a universal success claim.
- If a child WebView is created for a legitimate popup or verification flow, apply the same guarded Autofill importance without weakening origin or navigation controls.

## Scope In

- Main Tauri Android WebView participation in Autofill.
- Managed social WebViews created by `NativeWebViewPlugin.createWebView`.
- Child WebViews created for supported popup/verification flows.
- API-level guards for Android 8 / API 26.
- Compatibility validation with Google Password Manager, 1Password, and Bitwarden.
- Provider-neutral troubleshooting or settings guidance if the product exposes a help entry.
- Documentation of the distinction between isolated web sessions and the shared external credential provider.

## Scope Out

- No access to vault contents through a provider SDK, CLI, REST API, accessibility scraping, or clipboard automation.
- No direct Android Credential Manager request for Facebook, X, Instagram, LinkedIn, or another third-party web origin.
- No privileged-browser approval request in this implementation.
- No passkey implementation for the CommunityGlows account or third-party networks.
- No JavaScript injected to detect, label, fill, save, or submit third-party password fields.
- No storage of passwords in cookies, localStorage snapshots, SharedPreferences, Convex, cloud sync, or backup archives.
- No modification of the system's selected Autofill provider.
- No automatic opening of Android settings without an explicit user action.

## Security and Session Invariants

- Autofill credentials remain owned and released by the configured Android service.
- The real HTTPS domain remains authoritative for web credential matching.
- CommunityGlows profile isolation covers WebKit sessions, not the external credential vault. Suggestions for all saved accounts of a domain may appear in any CommunityGlows profile.
- Clearing a CommunityGlows network session clears only app-owned session state; it must not delete or modify an item in the external password manager.
- Logs must never contain field values, selected dataset labels, usernames, passwords, OTP values, vault state, or full sensitive URLs.
- Existing public WebView boundaries remain unchanged: no stealth, consent automation, user-agent spoofing, or arbitrary third-party script injection.

## Edge Cases

- Multiple CommunityGlows profiles use different accounts on the same social domain.
- Username and password appear on separate pages.
- Credentials are inside a same-origin or cross-origin iframe.
- The page changes the focused field after the provider UI appears.
- The user switches CommunityGlows profile while an Autofill picker is open.
- A pooled inactive WebView receives a callback; only the visible/focused WebView should participate in user interaction.
- A child popup closes immediately after filling.
- The provider is installed but locked.
- Android OEM settings disable overlays or inline suggestions.
- A hardware keyboard is connected and inline suggestions are unavailable.

## Implementation Tasks

- [ ] Task 1: Verify the shared semantic foundation in the Android host WebView.
  - Action: confirm the rendered HTML fields expose the expected autocomplete tokens and Vue receives platform-filled values.
  - Depends on: `communityglows-password-manager-foundation.md`.
  - Proof: rendered DOM plus Android manual fill of the CommunityGlows account form.

- [x] Task 2: Enable guarded Autofill participation for the main WebView.
  - File: `NativeWebViewPlugin.kt` or the smallest Android host integration surface owning the Tauri main WebView.
  - Action: on API 26+, set `importantForAutofill` to an affirmative value without replacing WebView's native virtual structure.
  - Proof: main CommunityGlows login triggers the configured provider on a supported device.

- [x] Task 3: Enable guarded Autofill participation for managed social WebViews.
  - File: `NativeWebViewPlugin.kt`.
  - Action: configure each WebView immediately after construction, preserving `WebView(activity)`, its real origin, and existing profile isolation ordering.
  - Proof: a standard third-party login form offers matching domain credentials.

- [x] Task 4: Apply the same policy to child WebViews.
  - File: `NativeWebViewPlugin.kt`.
  - Action: configure supported child WebViews without broadening custom-scheme or navigation permissions.
  - Proof: no regression in reCAPTCHA/popup behavior and eligible child login fields remain fillable.

- [ ] Task 5: Decide whether a manual Autofill request action is necessary.
  - Action: add `AutofillManager.requestAutofill` only if physical-device evidence shows that normal focus does not reliably trigger providers and the action can target the visible WebView safely.
  - Proof: a documented before/after device result; omit the action if native focus is sufficient.

- [ ] Task 6: Add provider-neutral degraded-state guidance.
  - Action: explain how to enable a password/autofill provider only from an explicit help action; do not claim provider detection when none is performed.
  - Proof: copy review and no automatic settings mutation.

- [x] Task 7: Update technical documentation after implementation.
  - Files: `README.md`, `android-webview-session-isolation.md`, and `public-webview-platform-boundary.md` as applicable.
  - Action: document Autofill support and state that credential-vault contents are not isolated by CommunityGlows profiles.
  - Proof: docs match observed device behavior and preserve existing non-coverage language.

## Acceptance Criteria

- API 26+ WebViews owned by CommunityGlows are eligible for Android Autofill.
- API below 26 retains manual login without a crash or unsupported API call.
- CommunityGlows account sign-in can be filled through at least one configured Android provider.
- Google Password Manager, 1Password, and Bitwarden each receive a recorded compatibility result on a representative supported device; unsupported provider/site combinations are reported honestly.
- At least two representative social-network login forms are tested with their real domains and platform user agent.
- Autofill never changes the `${profileId}-${networkId}` WebKit session boundary.
- Clearing or switching sessions does not mutate the external password-manager vault.
- No credential data appears in logs, backups, cloud state, or application persistence.
- Manual entry and external-browser fallback remain available.
- No third-party page script or user-agent workaround is introduced.

## Verification Matrix

| Scenario | Minimum evidence |
| --- | --- |
| Android 8-10 | Popup Autofill or documented provider limitation; manual fallback |
| Android 11+ | Inline or popup Autofill with a compatible keyboard/provider |
| Google Password Manager | CommunityGlows login plus one social-domain match |
| 1Password | CommunityGlows login plus one social-domain match |
| Bitwarden | CommunityGlows login plus one social-domain match |
| Multiple CommunityGlows profiles | All domain accounts may be suggested, but selected web sessions remain isolated |
| No provider enabled | No crash, false error, or blocked manual login |
| Clear session | App session removed; external vault item unchanged |

## Verification Commands

- Static Android hooks: `rg -n 'importantForAutofill|AutofillManager|requestAutofill|WebView\(activity\)' src-tauri/plugins/android-webview/android/src/main/java/com/communityglows/webview/NativeWebViewPlugin.kt`.
- Public-boundary regression scan from `shipglows_data/technical/public-webview-platform-boundary.md`.
- Project checks: `pnpm test:once`, `pnpm typecheck`, `pnpm lint`, and the available Android compile/build check.
- Final evidence must come from an APK on a representative Android device or hosted device where the selected provider is actually callable.

## Documentation Sources

- Android Autofill optimization: <https://developer.android.com/identity/autofill/autofill-optimize>
- Android WebView virtual Autofill structure: <https://developer.android.com/reference/android/webkit/WebView.html#onProvideAutofillVirtualStructure(android.view.ViewStructure,int)>
- Android AutofillManager: <https://developer.android.com/reference/android/view/autofill/AutofillManager>
- 1Password Android Autofill: <https://support.1password.com/android-autofill/>
- Bitwarden Android Autofill: <https://bitwarden.com/help/auto-fill-android/>
- Android privileged third-party origin boundary: <https://developer.android.com/identity/sign-in/privileged-apps>
