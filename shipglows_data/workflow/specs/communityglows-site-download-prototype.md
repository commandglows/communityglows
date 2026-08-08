---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "communityglows"
created: "2026-08-08"
created_at: "2026-08-08 UTC"
updated: "2026-08-08"
updated_at: "2026-08-08 UTC"
status: ready
source_skill: 100-sg-spec
source_model: "GPT-5"
scope: "site-bilingual-download-prototype"
owner: "Diane"
confidence: high
user_story: "En tant que visiteuse de CommunityGlows, je veux trouver une page de téléchargement claire dans ma langue et voir toutes les plateformes, afin de télécharger la dernière version disponible sans confondre une version publiée avec une plateforme encore planifiée."
risk_level: medium
security_impact: none
docs_impact: yes
linked_systems:
  - "site/src/pages/download.astro"
  - "site/src/pages/fr/download.astro"
  - "site/src/components/download/DownloadPage.astro"
  - "site/src/config/downloads.ts"
  - "site/src/components/Navbar.astro"
  - "site/src/components/Footer.astro"
  - "site/src/i18n/en.ts"
  - "site/src/i18n/fr.ts"
depends_on:
  - artifact: "shipglows_data/technical/design-system-authority.md"
    artifact_version: "1.4.0"
    required_status: reviewed
  - artifact: "shipglows_data/business/business.md"
    artifact_version: "1.2.0"
    required_status: reviewed
supersedes: []
evidence:
  - "README.md publishes a durable Windows artifact at commandglows/communityglows/releases/download/windows-latest/CommunityGlows-Windows-latest.exe."
  - "README.md and business governance state that Linux and iPhone are planned, while the operator requires Android to remain coming soon absent durable local release proof."
next_step: "Implement and locally verify the bilingual prototype"
---

# CommunityGlows Site Download Prototype

## Status

Ready for bounded implementation. Commit, push and deployment are not authorized.

## User Story

En tant que visiteuse de CommunityGlows, je veux trouver une page de téléchargement claire dans ma langue et voir toutes les plateformes, afin de télécharger la dernière version disponible sans confondre une version publiée avec une plateforme encore planifiée.

## Minimal Behavior Contract

`/download` and `/fr/download` render one shared locale-aware component. A typed configuration owns platform availability and destinations. Windows exposes the durable stable artifact, Linux exposes the repository Releases page, and Android/iOS remain visible but unavailable. Navigation and footer links always keep the visitor in the current locale.

## Success Behavior

- The English and French routes use the same component and platform configuration.
- Windows offers a direct stable `.exe` download from `commandglows/communityglows`.
- Linux links to the exact `commandglows/communityglows` Releases page without claiming a direct package exists.
- Android and iOS are labelled coming soon and expose no false download action.
- Every platform remains visible at mobile and desktop widths.
- Navbar and footer expose a locale-preserving Download/Télécharger entry.
- Canonical, hreflang, metadata, reduced-motion and keyboard-focus behavior remain intact.

## Error Behavior

- A missing locale label or unsupported platform status fails TypeScript/Astro validation.
- A planned platform never silently receives an active download link.
- JavaScript failure does not hide platform choices or block the available links.
- No operating-system detection redirects or initiates a download automatically.

## Scope In

- Shared bilingual Download page component and two static routes.
- Typed centralized platform release configuration.
- Locale-aware navbar CTA and footer link.
- Responsive, accessible presentation using existing design tokens.
- Local build, token, diff and design-drift proof.

## Scope Out

- Automatic platform detection or automatic downloading.
- Release API calls, server runtime, update feeds or new dependencies.
- Creating Android, iOS, Linux or macOS artifacts.
- Changing application packaging or CI release workflows.
- Commit, push, preview or production deployment.

## Constraints

- `design/tokens/reference.json` remains the editable visual-value authority.
- `site/src/styles/generated/tokens.css` must not be edited manually.
- New UI must use existing semantic tokens and standard project utilities, with no arbitrary Tailwind values or page-local visual literals.
- Public availability claims must remain no stronger than durable local evidence.
- Existing user changes outside the site and this spec must be preserved.

## Test Contract

- `surface`: `/download` and `/fr/download` on the public Astro site.
- `proof_profile`: static build, source assertions, responsive browser proof when locally feasible, token integrity and changed-file drift scan.
- `proof_order`: token validate/check → site build → route/link assertions → responsive visual proof → diff/drift checks.
- `required_scenario_ids`: `DOWNLOAD-EN`, `DOWNLOAD-FR`, `DOWNLOAD-MOBILE`, `DOWNLOAD-DESKTOP`, `DOWNLOAD-LINKS`, `DOWNLOAD-PLANNED`.
- `required_results`: both routes build; all four platforms remain visible; Windows and Linux destinations match the contract; planned platforms have no active link; locale navigation is correct.
- `automated_proof`: `npm run build` from `site`, root token validate/check, `git diff --check`, and changed-file design-system drift check.

## Invariants

- The Windows stable URL remains centralized and explicit.
- The Linux action remains a Releases-page discovery link, not a direct-download promise.
- Android and iOS remain visible and unavailable until durable release proof updates the configuration.
- No route performs user-agent detection or automatic download behavior.
- One shared component owns both locale renderings.

## Documentation Coherence

- This spec is the durable implementation contract for the prototype.
- No broader technical documentation changes are needed because the site architecture and release workflows do not change.
- Future reuse across products should extract the proven contract after this prototype, not pre-emptively add a cross-repository package here.

## Implementation Tasks

- [x] Add the typed platform release configuration.
- [x] Build the shared locale-aware responsive Download component.
- [x] Add `/download` and `/fr/download` with aligned metadata and structured data.
- [x] Add locale-aware navbar and footer Download links.
- [x] Run proportional automated proof; browser screenshot proof is unavailable in this runtime.

## Acceptance Criteria

- [x] CA 1: Both locale routes render the same platform order and state semantics.
- [x] CA 2: Windows points directly to the durable `windows-latest` `.exe` artifact.
- [x] CA 3: Linux points to `commandglows/communityglows/releases/latest` and is described as release-page discovery.
- [x] CA 4: Android and iOS show coming-soon state without active download anchors.
- [x] CA 5: Navbar and footer links preserve the active locale.
- [x] CA 6: Mobile and desktop layouts keep every platform visible and all active controls keyboard reachable by semantic source review; rendered screenshot proof remains unavailable.
- [x] CA 7: Site build, root token checks, diff check and changed-file drift check pass.

## Risks

- A future repository migration could stale hardcoded release destinations; central configuration limits the update to one file.
- “Latest” can be misread as a guaranteed Linux artifact; copy must say that the Releases page contains published assets rather than promising a package.
- Existing site navigation is dense at intermediate widths; the Download action must remain available in the mobile menu and avoid hiding essential controls.

## Open Questions

None. Availability and proof boundaries are fixed by the delegated implementation contract.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-08-08 | 100-sg-spec | GPT-5 | Formalized the bilingual Download prototype, evidence-backed platform states and proof contract. | ready | Implement the bounded site prototype. |
| 2026-08-08 | 101-sg-ready | GPT-5 | Confirmed unique scope, release-link authority, design-token constraints, locale parity and validation path. | ready | Begin implementation. |
| 2026-08-08 | 001-sg-build | GPT-5 | Implemented the shared bilingual Download page, typed release configuration and locale-preserving navigation links. | implemented | Verify local build and rendered route contract. |
| 2026-08-08 | 103-sg-verify | GPT-5 | Built both static routes and verified published links, planned states, token integrity, diff and design drift. | verified | Close locally; no ship authorization. |

## Current Chantier Flow

- 100-sg-spec: completed
- 101-sg-ready: ready
- 001-sg-build: completed
- 102-sg-start: completed
- 103-sg-verify: completed
- 104-sg-end: completed locally
- 005-sg-ship: not authorized
