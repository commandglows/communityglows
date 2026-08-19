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
scope: windows-password-manager-interoperability
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
user_story: "En tant qu'utilisateur Windows de CommunityGlows, je veux utiliser les fonctions officiellement proposées par mon gestionnaire de mots de passe avec les formulaires Tauri/WebView2, afin d'éviter la ressaisie sans créer un coffre local CommunityGlows."
linked_systems:
  - "src/ui/setup/pages/CommunityGlows/views/LoginView.vue"
  - "src/ui/setup/pages/CommunityGlows/components/SignupNudge.vue"
  - "src-tauri/src/lib.rs"
  - "src-tauri/tauri.conf.json"
  - "shipglows_data/technical/public-webview-platform-boundary.md"
depends_on:
  - artifact: "shipglows_data/workflow/specs/communityglows-password-manager-foundation.md"
    artifact_version: "1.0.0"
    required_status: ready
  - artifact: "shipglows_data/technical/context.md"
    artifact_version: "1.6.0"
    required_status: reviewed
supersedes: []
evidence:
  - "CommunityGlows creates desktop child WebViews with a dedicated data directory per profile and network."
  - "1Password 8 for Windows officially supports Auto-Type into the active application or browser window."
  - "Bitwarden officially supports dragging username and password fields from its desktop app into a login form."
  - "Bitwarden does not currently document released Windows desktop Auto-Type as a generally available feature."
  - "WebView2 profile sync is disabled and its password autosave would create app-local data rather than reuse the user's external synchronized vault."
next_step: "Build the packaged Windows app and run the recorded 1Password Auto-Type and Bitwarden drag-and-drop matrix."
---

# Windows Password Manager Interoperability

## Status

The proven hidden-WebView focus defect is corrected and covered by a focused Rust unit test. Packaged-Windows provider proofs remain pending; compatibility claims remain provisional.

## User Story

En tant qu'utilisateur Windows de CommunityGlows, je veux utiliser les fonctions officiellement proposées par mon gestionnaire de mots de passe avec les formulaires Tauri/WebView2, afin d'éviter la ressaisie sans créer un coffre local CommunityGlows.

Primary actor: a Windows user with 1Password 8 or Bitwarden Desktop installed and unlocked.

Trigger: the user focuses a username field in a CommunityGlows-owned or visible third-party WebView2 login form, then invokes the provider's official desktop interaction.

Observable outcome: 1Password Auto-Type or Bitwarden drag-and-drop transfers credentials into the intended visible form, while CommunityGlows neither reads the vault nor stores a second password copy.

## Decision

The immediate Windows compatibility contract is:

- 1Password: support its official Auto-Type workflow into the active window;
- Bitwarden: support its official desktop drag-and-drop workflow;
- all providers: preserve manual entry and external-browser fallback;
- CommunityGlows: provide standards-based form semantics and stable focus behavior only.

CommunityGlows will not enable WebView2 password autosave in this scope because WebView2 profile synchronization is disabled and the result would be a separate local password store. It will not call vault APIs or embed provider browser extensions in this immediate implementation.

## Success Behavior

- In the packaged Windows app, a user can focus the CommunityGlows username field and complete the documented 1Password Auto-Type workflow.
- In a supported visible social WebView2, the same 1Password workflow targets the active login form rather than the hidden host or another pooled WebView.
- A user can drag a username or password from Bitwarden Desktop into an eligible visible HTML input without CommunityGlows intercepting or logging the payload.
- Provider-filled values trigger normal input/change behavior and reach the page or Vue model as ordinary user input.
- CommunityGlows does not auto-submit after provider fill.
- If the provider cannot interact with a particular network page, the user can type manually or use the existing browser fallback.

## Error and Degraded Behavior

- If Auto-Type targets the wrong active window or field, CommunityGlows must not claim the credential was safely matched; the provider's warning and user selection remain authoritative.
- If the global 1Password shortcut conflicts with another Windows application, CommunityGlows does not override or register that shortcut.
- If Bitwarden drag-and-drop is blocked by a WebView2 or page behavior, manual entry remains available and the limitation is recorded per tested surface.
- Hidden or pooled WebViews must not steal focus from the visible login form during provider interaction.
- A provider being locked, absent, or unsupported must not surface as a CommunityGlows login failure.
- A social platform refusing WebView2 remains a platform incompatibility and uses the existing allowed fallback, without user-agent spoofing or hidden automation.

## Scope In

- Packaged Windows Tauri application.
- CommunityGlows account login and sign-up forms.
- Visible desktop child WebViews created by `src-tauri/src/lib.rs`.
- Focus stability during WebView creation, navigation, showing, hiding, and profile/network switching.
- 1Password 8 Windows Auto-Type proof.
- Bitwarden Desktop drag-and-drop proof.
- Provider-neutral help copy if evidence shows users need an in-product explanation.
- Explicit documentation of tested and unsupported combinations.

## Scope Out

- No WebView2 `IsPasswordAutosaveEnabled` activation.
- No assumption that WebView2 uses or synchronizes the user's Microsoft Edge profile.
- No Bitwarden CLI, Vault Management API, local HTTP server, or Secrets Manager SDK.
- No 1Password CLI, Connect API, service account, or secret-reference integration.
- No embedded/sideloaded Bitwarden or 1Password browser extension.
- No Native Messaging host registration for CommunityGlows.
- No browser-extension redistribution, vendor partnership, or unsupported-browser registration.
- No passkeys or Windows WebAuthn provider integration.
- No custom global keyboard shortcut.
- No clipboard monitoring or automatic paste.

## Security and Privacy Invariants

- CommunityGlows must never request a vault master password, personal API key, organization API key, service-account token, CLI session token, or decrypted vault export.
- CommunityGlows must not read clipboard contents as part of password-manager support.
- Dragged or typed credentials must not be captured by application-level drop handlers, logs, diagnostics, analytics, sync, or backups.
- Only the visible, user-focused WebView should accept desktop provider input.
- Help text must not imply that CommunityGlows verified or selected a credential item.
- The user remains responsible for checking the active window and domain before invoking Auto-Type, consistent with 1Password's documented warning.

## Edge Cases

- The host Vue WebView and a social child WebView both contain credential fields.
- A hidden pooled WebView retains an old focused element.
- The social network uses a split username/password flow.
- A network changes focus during navigation between steps.
- Multiple 1Password or Bitwarden entries exist for the same domain.
- Auto-Type is configured by the user to submit automatically.
- The user drags a password over a non-password input or app chrome.
- Windows display scaling or multiple monitors changes the active WebView bounds.
- A modal or settings sheet opens while a provider interaction is in progress.
- The application is elevated but the provider is not, or vice versa, causing Windows input restrictions.

## Implementation Tasks

- [ ] Task 1: Complete the shared semantic foundation.
  - Action: implement and verify `communityglows-password-manager-foundation.md` before Windows-specific work.
  - Proof: stable names, autocomplete tokens, and input events in the packaged Tauri build.

- [x] Task 2: Map Windows focus ownership.
  - Files: `src-tauri/src/lib.rs` and the CommunityGlows WebView orchestration composables.
  - Action: identify focus behavior for main, visible child, hidden pooled, opened, navigated, shown, and hidden WebViews.
  - Proof: focused-view observations without reading credential values.

- [ ] Task 3: Run a no-code 1Password Auto-Type proof.
  - Action: test the official `Ctrl+Shift+Space` flow against CommunityGlows account login and representative social login forms.
  - Proof: per-surface result including focus target, username/password order, split-flow handling, and submission behavior.

- [ ] Task 4: Run a no-code Bitwarden drag-and-drop proof.
  - Action: drag username and password values from Bitwarden Desktop into the same representative forms.
  - Proof: per-surface result confirming whether standard WebView2 input/drop behavior is sufficient.

- [x] Task 5: Fix only proven focus or input-event defects.
  - Action: if proof reveals a CommunityGlows-owned focus bug, make the smallest change that keeps the intended visible WebView focused and preserves normal DOM input events.
  - Proof: regression test or repeatable before/after Windows result.

- [ ] Task 6: Add minimal provider-neutral assistance if needed.
  - Action: explain that Windows users can invoke their password manager's supported desktop fill action; link to provider documentation rather than detecting or launching vaults.
  - Proof: copy does not promise universal compatibility or expose a provider preference.

- [ ] Task 7: Publish only evidence-backed compatibility claims.
  - Action: update technical and user-facing documentation with the exact tested provider version, Windows version, CommunityGlows build, and supported surfaces.
  - Proof: every public claim maps to a recorded packaged-app result.

## Acceptance Criteria

- CommunityGlows account login is successfully filled with 1Password Auto-Type in the packaged Windows app.
- At least two representative social login surfaces receive a documented 1Password Auto-Type result.
- CommunityGlows account login receives a documented Bitwarden drag-and-drop result.
- At least two representative social login surfaces receive a documented Bitwarden drag-and-drop result.
- A hidden WebView never receives credentials intended for the visible WebView in the validation scenarios.
- Manual entry and browser fallback remain functional for unsupported combinations.
- CommunityGlows registers no vault API credential, CLI session, Native Messaging host, global shortcut, or embedded provider extension.
- WebView2 password autosave remains disabled/unmodified by CommunityGlows.
- No credential content is present in logs, telemetry, storage, cloud sync, or backup artifacts.
- Documentation describes compatibility as tested interoperability, not direct vault integration.

## Verification Matrix

| Surface | 1Password Auto-Type | Bitwarden drag-and-drop | Required fallback |
| --- | --- | --- | --- |
| CommunityGlows sign-in | Packaged-app proof | Packaged-app proof | Manual entry |
| CommunityGlows sign-up | Generated/new-password semantics review | Manual drag proof if supported | Manual entry |
| Social network with one-page login | Two representative domains | Two representative domains | External browser |
| Social network with split login | One representative flow | One representative flow | Manual/external browser |
| Hidden pooled WebView | Must not receive input | Must not receive drop | Refocus visible WebView |

Record for each result:

- Windows version;
- CommunityGlows build identifier;
- provider name and version;
- target URL origin without sensitive path/query data;
- success, partial, or unsupported;
- whether the user had to search for the vault item manually;
- whether the provider or site submitted automatically;
- no username, password, OTP, token, or account identifier.

## Verification Commands

- Desktop WebView inventory: `rg -n 'WebviewBuilder|data_directory|add_child|set_focus|show\(|hide\(' src-tauri/src src/ui/setup/pages/CommunityGlows`.
- Credential-field inventory: `rg -n 'type="password"|autocomplete=|name=' src/ui/setup/pages/CommunityGlows`.
- Project checks after any implementation: `pnpm test:once`, `pnpm typecheck`, `pnpm lint`, and `pnpm tauri:build` on a Windows-capable environment.
- Final compatibility proof must use the packaged Windows executable, not only a browser preview.

## Documentation Sources

- 1Password Auto-Type for Windows: <https://support.1password.com/windows-auto-type/>
- 1Password Quick Access: <https://support.1password.com/quick-access/>
- Bitwarden desktop/browser drag-and-drop: <https://bitwarden.com/help/auto-fill-browser/#drag-and-drop-logins>
- Bitwarden desktop keyboard shortcut boundaries: <https://bitwarden.com/help/keyboard-shortcuts/>
- WebView2 versus Edge profile/identity behavior: <https://learn.microsoft.com/en-au/microsoft-edge/webview2/concepts/browser-features>
- WebView2 user data folders: <https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/user-data-folder>
