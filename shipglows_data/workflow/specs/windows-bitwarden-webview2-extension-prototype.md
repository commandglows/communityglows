---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.3.0"
project: "communityglows"
created: "2026-08-19"
created_at: "2026-08-19 13:20:00 UTC"
updated: "2026-08-24"
updated_at: "2026-08-24 08:58:24 UTC"
status: active
source_skill: shipglows
scope: windows-bitwarden-webview2-extension-prototype
owner: "Diane"
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
user_story: "En tant qu'utilisateur Windows de CommunityGlows qui utilise Bitwarden, je veux que l'extension officielle remplisse directement les pages réseau intégrées afin de ne pas copier mes mots de passe et de ne pas les confier à CommunityGlows."
linked_systems:
  - "src-tauri/src/lib.rs"
  - "src/ui/setup/pages/CommunityGlows/components/BitwardenExtensionSettings.vue"
  - "src/ui/setup/pages/CommunityGlows/components/MobileSettingsSheet.vue"
  - "src/locales/fr.json"
  - "src/locales/en.json"
  - ".github/workflows/quality-checks.yml"
  - "README.md"
  - "shipglows_data/technical/public-webview-platform-boundary.md"
  - "shipglows_data/workflow/specs/windows-password-manager-interoperability.md"
depends_on:
  - artifact: "shipglows_data/workflow/specs/windows-password-manager-interoperability.md"
    artifact_version: "1.2.1"
    required_status: active
supersedes: []
evidence:
  - "Tauri 2.11.5 exposes WebviewBuilder.browser_extensions_enabled and extensions_path on Windows."
  - "CommunityGlows currently creates one WebView2 data directory per profile and network."
  - "WebView2 loads unpacked extensions from a local folder and does not provide an integrated extension store."
  - "The official browser-v2026.7.0 dist-chrome archive is 22 MB compressed, about 80 MB uncompressed across 261 entries, and exposes a root Manifest V3 with version 2026.7.0 and homepage_url https://bitwarden.com; it fits the implemented bounds and identity checks."
  - "GitHub Actions run 32308452620 passed the Windows backend compilation and Rust tests on windows-latest, alongside the complete frontend quality job."
  - "Managed import now requires the SHA-256 digest published beside the official GitHub release asset and verifies it before extraction."
next_step: "Run the packaged application on Windows with an official Bitwarden Chromium archive and record compatibility results."
---

# Windows Bitwarden WebView2 Extension Prototype

## Status

The environment-gated loader, SHA-256 provenance check, manifest guard, and guided Windows Settings flow are implemented. The Windows backend previously compiled and passed its Rust tests on a hosted Windows runner. A fresh Windows CI run, packaged application run, and physical Bitwarden compatibility proof remain required after the provenance change.

## Decision

CommunityGlows may load a locally installed official Bitwarden Chromium extension into Windows social WebViews. The primary path is a guided Settings flow that imports a user-selected `dist-chrome-*.zip`, requires the SHA-256 digest displayed beside that asset on Bitwarden's official GitHub release, verifies the local bytes before extraction, applies bounded archive and manifest checks, records only a local relative installation reference, and requests an application restart. `COMMUNITYGLOWS_BITWARDEN_EXTENSION_PATH` remains a developer override and is not an end-user provenance path.

The prototype does not download or redistribute Bitwarden, does not use the Bitwarden CLI or Vault Management API, does not register a Native Messaging host, and does not inspect filled field values. Bitwarden remains responsible for vault login, unlock, origin matching, account choice, fill, and save behavior.

## Security Invariants

- The configured path must resolve to an existing directory containing a valid Manifest V2 or V3 `manifest.json` that identifies Bitwarden.
- A managed ZIP import must fail before extraction unless its SHA-256 exactly matches the 64-hex digest copied from the official Bitwarden GitHub release asset; the manifest remains a second structural check, not proof of publisher identity.
- Imported archives must be local ZIP files, stay below bounded compressed/uncompressed limits, use safe enclosed paths, contain no symbolic links, and expose one root Bitwarden manifest.
- Managed installations live only beneath the CommunityGlows application-data extension root. A persisted reference may never escape that root after canonicalization.
- Import, status, disable, and restart commands never return or log credential, vault, cookie, or extension-path values.
- An invalid explicit configuration fails closed instead of silently loading another extension.
- With no managed installation and no environment variable, Windows WebViews retain their existing behavior.
- All WebViews targeting the same data directory use the same extension-enabled configuration.
- CommunityGlows never logs the extension path, username, password, selected item, vault state, or filled value.
- The extension is never loaded on Android, macOS, or Linux by this prototype.
- No public compatibility claim is allowed before packaged-Windows proof.

## Known Limitation

The current Windows isolation boundary uses one WebView2 data directory per `${profileId}-${networkId}`. Extension storage follows that boundary, so Bitwarden may require separate login, unlock, or initialization for each profile/network pair. This prototype must measure that cost before any proposal to share a data directory at profile level; it does not weaken the existing isolation contract.

WebView2 extension configuration is fixed when an environment is created. Installing, replacing, or disabling Bitwarden therefore changes the next application run only; Settings must show that state and provide an explicit restart action.

## End-User Contract

- **Target:** a Windows user who already uses Bitwarden but does not know PowerShell, WebView2, or unpacked-extension setup.
- **First success:** Settings reports Bitwarden ready after the user opens the official releases page, selects the downloaded Chromium ZIP, and restarts CommunityGlows.
- **Trust boundary:** the selected archive never uploads to CommunityGlows or cloud sync; CommunityGlows validates and stores it locally but never reads the vault or filled values.
- **Observable states:** checking, not installed, importing, ready, restart required, externally configured, unsupported platform, and recoverable error.
- **Recovery:** retry with the official Chromium ZIP, replace an installation, disable the managed installation, or restart later without losing network sessions.

## Implemented Tasks

- [x] Add an explicit Windows-only configuration gate.
- [x] Validate the local unpacked extension directory and manifest.
- [x] Enable browser extensions and apply the path before normal social WebView creation.
- [x] Apply the same WebView2 environment options to temporary cookie-export WebViews that reuse the data directory.
- [x] Preserve unchanged behavior on other platforms and when the gate is absent.
- [x] Add focused manifest-validation unit coverage.
- [x] Document local operator setup and the per-session limitation.
- [x] Add Windows-only Settings discovery and the official download handoff.
- [x] Import and safely extract an official Chromium ZIP into versioned local application data.
- [x] Require and verify the official GitHub release SHA-256 digest before managed ZIP extraction.
- [x] Persist a managed installation reference and preserve the environment variable as a developer override.
- [x] Expose status, replace, disable, and restart actions without exposing local paths or credential data.
- [x] Add French and English UI copy and focused automated contract coverage.
- [x] Update operator documentation from developer-only setup to the guided flow.
- [x] Add a non-publishing Windows Rust test job to the quality workflow.
- [ ] Compile and test the Windows backend after the SHA-256 provenance change.
- [ ] Compile the packaged Windows application with a representative official Bitwarden package.
- [ ] Prove initial vault login/unlock UI is accessible.
- [ ] Prove inline Autofill on one-page and split-login flows.
- [ ] Prove behavior after application restart and WebView pooling.
- [ ] Record whether each profile/network directory requires separate Bitwarden initialization.

## Verification Matrix

| Scenario | Required evidence |
| --- | --- |
| Gate absent | Existing Windows behavior, no extension process or UI |
| Invalid directory | Explicit WebView creation error, no fallback extension |
| Valid Bitwarden folder | Extension service worker starts and remains enabled |
| One-page login | Matching Bitwarden suggestion fills username/password |
| Split login | Same vault item can fill both steps |
| Hidden WebView | No prompt or credential input targets the hidden page |
| Restart | Extension and vault-state behavior recorded without credential values |
| Second network | Whether setup is repeated is recorded explicitly |
| ZIP traversal/symlink/bomb | Import fails closed and leaves the active installation unchanged |
| Import or replace | Ready state is persisted; current WebViews remain unchanged until restart |
| Disable | Managed reference is removed; current WebViews remain unchanged until restart |
| Non-Windows settings | Bitwarden installation card and commands remain unavailable |

## Operator Test Setup

Use an official Bitwarden Chromium extension extracted to a local folder whose root contains `manifest.json`. Do not commit that folder to this repository.

```powershell
$env:COMMUNITYGLOWS_BITWARDEN_EXTENSION_PATH = 'C:\path\to\bitwarden-unpacked'
pnpm tauri dev
```

Test only with non-production accounts. Record Windows, WebView2 Runtime, Bitwarden extension, and CommunityGlows build versions, but never record usernames, passwords, OTPs, cookies, or vault item labels.

## Sources

- Tauri `WebviewBuilder`: <https://docs.rs/tauri/2.11.5/tauri/webview/struct.WebviewBuilder.html>
- WebView2 `AddBrowserExtensionAsync`: <https://learn.microsoft.com/en-us/dotnet/api/microsoft.web.webview2.core.corewebview2profile.addbrowserextensionasync>
- Bitwarden clients repository: <https://github.com/bitwarden/clients>

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-08-19 | sg-development | GPT-5 | Prepared the approved guided Windows installation slice and its proof contract. | ready | Implement native import/persistence and Settings UI. |
| 2026-08-19 | sg-development | GPT-5 | Implemented the local ZIP import, managed installation lifecycle, Settings UX, translations, tests, documentation, and Windows Rust CI lane. | partial | Hosted Windows compile/test and physical Bitwarden proof. |
| 2026-08-19 | sg-development | GPT-5 | Verified the complete quality workflow, including hosted Windows backend compilation and Rust tests. | partial | Physical packaged-Windows Bitwarden proof. |
| 2026-08-24 | sg-development | GPT-5 | Added user-mediated verification of the GitHub release SHA-256 before extraction, aligned technical and public documentation, and registered the remaining provider/device proof tasks. | partial | Run fresh Windows CI, then packaged-Windows and Android provider proofs. |

## Current Chantier Flow

- 100-sg-spec: ready — this spec owns the guided Settings slice.
- 101-sg-ready: passed — outcome, security invariants, UI states, documentation impact, and proof path are explicit.
- 102-sg-start: complete — implementation and directly mapped documentation are present.
- 103-sg-verify: partial — focused metadata, JSON, static contract, and diff checks pass; this environment has no Cargo or installed JavaScript dependencies, so the new SHA-256 path still requires fresh Windows CI and packaged-app proof. Historical Windows compilation evidence predates this change.
- 104-sg-end: partial — physical Bitwarden compatibility evidence remains outside this local Linux environment.
- 005-sg-ship: partial — the earlier prototype commits remain on `master`; the 2026-08-24 provenance hardening and documentation updates are local and unshipped.
