---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.1.1"
project: "communityglows"
created: "2026-08-19"
created_at: "2026-08-19 12:06:29 UTC"
updated: "2026-08-24"
updated_at: "2026-08-24 09:03:00 UTC"
status: reviewed
source_skill: shipglows
scope: authentication-interoperability
owner: "Diane"
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
user_story: "En tant qu'utilisateur de CommunityGlows, je veux que mon gestionnaire de mots de passe reconnaisse correctement les formulaires de connexion et d'inscription, afin de remplir ou générer mes identifiants sans les confier à CommunityGlows."
linked_systems:
  - "src/ui/setup/pages/CommunityGlows/views/LoginView.vue"
  - "src/ui/setup/pages/CommunityGlows/components/SignupNudge.vue"
  - "src/ui/setup/pages/CommunityGlows/components/ui/SgInput.vue"
  - "src/ui/setup/pages/CommunityGlows/components/ui/SgPassword.vue"
  - "src/ui/setup/pages/CommunityGlows/components/BackupRestore.vue"
  - "convex/auth.ts"
depends_on:
  - artifact: "README.md"
    artifact_version: unknown
    required_status: unknown
  - artifact: "shipglows_data/technical/context.md"
    artifact_version: "1.6.0"
    required_status: reviewed
supersedes: []
evidence:
  - "LoginView exposes stable email/password names with username and mode-dependent current-password/new-password autocomplete tokens."
  - "Both SignupNudge forms expose stable email/password names with username/new-password autocomplete tokens."
  - "SgPassword forwards non-style attributes to its native input, so semantic attributes can remain caller-owned."
  - "Convex Auth currently exposes Anonymous and Password providers; this spec does not change the backend authentication method."
next_step: "Continue device and provider proof through the dedicated Windows and Android tasks in shipglows_data/workflow/TASKS.md."
---

# CommunityGlows Password Manager Foundation

## Status

Implementation scope reviewed and closed. Runtime component and platform compatibility proofs are transferred to the dedicated Windows and Android tasks in `shipglows_data/workflow/TASKS.md`; they remain required before public compatibility claims.

## User Story

En tant qu'utilisateur de CommunityGlows, je veux que mon gestionnaire de mots de passe reconnaisse correctement les formulaires de connexion et d'inscription, afin de remplir ou générer mes identifiants sans les confier à CommunityGlows.

Primary actor: a CommunityGlows user signing in or creating an account with email and password.

Trigger: the user opens an email/password form and focuses a credential field.

Observable outcome: the selected system or desktop password manager can classify the username and password fields correctly, while CommunityGlows continues to send credentials only through its existing Convex Auth flow.

## Decision

CommunityGlows will support password managers through standard HTML form semantics and platform-mediated filling. It will not integrate provider vault APIs, retrieve vault items, store third-party credentials, or inject provider-specific secrets into forms.

The canonical semantic contract is:

- account identifier: stable `name`, email input type, and `autocomplete="username"`;
- sign-in password: stable `name` and `autocomplete="current-password"`;
- sign-up password: stable `name` and `autocomplete="new-password"`;
- sign-up and sign-in mode changes update the password token before the field is focused;
- backup encryption passphrases remain outside the account-credential contract.

## Success Behavior

- On sign-in, a compatible password manager recognizes the email field as the username and the password field as the current password.
- On sign-up, a compatible password manager can propose a generated password and offer to save the resulting credential.
- Switching `LoginView` between sign-in and sign-up updates the password field from `current-password` to `new-password` without recreating an unrelated credential identity.
- `SignupNudge` uses the same username/new-password semantics on mobile and desktop.
- Attributes supplied to `SgInput` and `SgPassword` reach the underlying native `<input>` elements.
- Showing or hiding the password does not clear the field or detach its semantic name.
- Manual entry remains fully functional when no password manager is installed, enabled, unlocked, or willing to fill the form.
- CommunityGlows does not log, persist, inspect, synchronize, or expose the filled password beyond the existing authentication submission.

## Error Behavior

- If a password manager does not recognize the form, the fields remain usable and no error is shown as if CommunityGlows authentication had failed.
- If a provider refuses to fill an embedded WebView, CommunityGlows preserves manual entry and the platform-specific external-browser fallback where available.
- If the user selects the wrong saved account, CommunityGlows does not silently submit it; submission remains a deliberate user or provider action.
- If the sign-in/sign-up mode changes while a field is focused, the form must not submit stale values or retain an incorrect autocomplete token.
- A provider-generated password that fails the current backend policy must produce the normal existing validation error, without exposing the password in logs or diagnostics.

## Scope In

- `LoginView` email/password sign-in and sign-up modes.
- Both `SignupNudge` email/password sign-up forms.
- Attribute forwarding through `SgInput` and `SgPassword`.
- Stable field names, autocomplete tokens, email keyboard hints, capitalization, and spellcheck behavior.
- Focus behavior needed by Android Autofill, Windows Auto-Type, and drag-and-drop.
- Focused component or DOM tests for the rendered attributes and mode switch.
- Audit of all app-owned password fields to distinguish account credentials from encryption passphrases or local locks.

## Scope Out

- No direct Google Password Manager, 1Password, or Bitwarden API.
- No Bitwarden CLI, Vault Management API, 1Password CLI, Connect API, or Secrets Manager SDK.
- No passkeys, WebAuthn backend, federated identity, OAuth provider, or Convex Auth provider change.
- No storage or synchronization of social-network passwords by CommunityGlows.
- No JavaScript injection into third-party login pages.
- No WebView2 password autosave.
- No embedded browser extension.
- No promise that every third-party password manager will recognize every third-party form.

## Security and Privacy Invariants

- A password value must never be written to application logs, analytics, Sentry context, browser storage, Pinia persistence, cloud sync, or backup payloads.
- Provider choice and vault unlock remain controlled by the operating system or provider application.
- CommunityGlows must not enumerate installed vaults or infer which provider the user has selected.
- The app must not automatically submit a newly filled form.
- Field names must be stable and descriptive but must not include an email address, profile ID, network ID, or other user data.
- Backup encryption passphrases are not account credentials. They retain an explicit non-login autocomplete policy and must not be advertised as saveable account passwords.

## Edge Cases

- The user opens sign-up, generates a password, then switches back to sign-in.
- The user reveals a password before or after a provider fills it.
- A provider fills the email but not the password.
- The provider uses a split-login workflow while CommunityGlows shows both fields together.
- The same email exists in multiple password-manager items.
- Browser and Tauri builds render the same Vue component under different origins.
- A password manager ignores `autocomplete="off"` on a backup passphrase; CommunityGlows must not claim it can prevent all provider prompts.
- Autofill changes an input value through platform behavior; Vue state must receive the same value before submission.

## Implementation Tasks

- [x] Task 1: Audit app-owned credential and passphrase fields.
  - Files: `LoginView.vue`, `SignupNudge.vue`, `MobileSettingsSheet.vue`, `BackupRestore.vue`, `SessionLockView.vue`, `SgInput.vue`, `SgPassword.vue`.
  - Action: classify each password-like field as account credential, new credential, one-time code, local lock, or backup passphrase before changing attributes.
  - Proof: a checked inventory with no unclassified `type="password"` input.

- [x] Task 2: Add canonical semantics to `LoginView`.
  - Action: give the email and password inputs stable names; set username/email hints; bind password autocomplete to `current-password` or `new-password` from the active mode.
  - Proof: DOM test covering sign-in, sign-up, and mode switching.

- [x] Task 3: Add canonical semantics to both `SignupNudge` forms.
  - Action: use identical username/new-password semantics on mobile and desktop.
  - Proof: component test or rendered-DOM assertion for both responsive branches.

- [ ] Task 4: Verify wrapper attribute forwarding and fill events.
  - Action: confirm `SgInput` fallthrough attributes and `SgPassword.safeAttrs` preserve `name`, `autocomplete`, `required`, and accessibility attributes; confirm platform fill updates Vue models.
  - Proof: focused wrapper tests without broad component refactoring.

- [x] Task 5: Preserve non-account passphrase semantics.
  - Action: keep backup and local-only secrets distinguishable from account passwords without provider-specific attributes unless separately approved.
  - Proof: account autocomplete tokens do not appear on backup passphrase fields.

- [x] Task 6: Document the interoperability boundary.
  - Action: state that CommunityGlows supports platform-mediated filling but never reads or synchronizes the user's vault.
  - Proof: concise technical-context update after implementation; user-facing copy only if a visible help entry is added.

## Acceptance Criteria

- `LoginView` renders `autocomplete="username"` and `autocomplete="current-password"` in sign-in mode.
- `LoginView` renders `autocomplete="username"` and `autocomplete="new-password"` in sign-up mode.
- Both `SignupNudge` variants render username/new-password semantics.
- Account fields have stable, non-sensitive names.
- Account-field attributes reach the actual native input elements.
- Filled values reach Vue state and the existing Convex Auth submission without a provider-specific code path.
- Backup passphrases are not labeled as CommunityGlows account credentials.
- No password, vault item, token, or provider identity is added to logs, storage, sync, or backups.
- Existing anonymous and manual email/password flows continue to work without a password manager.

## Verification Plan

- Static inventory: `rg -n 'type="password"|autocomplete=|name=' src/ui/setup/pages/CommunityGlows`.
- Component tests for `LoginView`, `SignupNudge`, `SgInput`, and `SgPassword`.
- Existing checks: `pnpm test:once`, `pnpm typecheck`, and `pnpm lint`.
- Manual smoke test in a normal browser, Windows Tauri, and Android Tauri before claiming platform compatibility.

## Documentation Sources

- Android Autofill optimization: <https://developer.android.com/identity/autofill/autofill-optimize>
- Android WebView autofill mapping: <https://developer.android.com/reference/android/webkit/WebView.html#onProvideAutofillVirtualStructure(android.view.ViewStructure,int)>
- 1Password autofill behavior: <https://support.1password.com/autofill-behavior/>
- Bitwarden URI matching: <https://bitwarden.com/help/uri-match-detection/>
