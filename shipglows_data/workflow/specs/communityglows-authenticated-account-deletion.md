---
artifact: master_workflow
metadata_schema_version: "1.0"
artifact_version: "1.2.0"
project: communityglows
created: "2026-08-22"
created_at: "2026-08-22"
updated: "2026-08-22"
updated_at: "2026-08-22"
status: implemented_unverified
source_skill: 100-sg-spec
source_model: GPT-5
scope: authenticated-account-deletion
owner: Diane
confidence: high
risk_level: high
security_impact: high
docs_impact: yes
linked_artifacts:
  - shipglows_data/workflow/audits/2026-07-15-google-play-android-compliance.md
  - shipglows_data/business/product.md
  - shipglows_data/technical/platforms/stripe-managed-payments.md
  - /home/claude/commandglows/commandglows_site/src/pages/api/bridge/communityglows.ts
depends_on:
  - artifact: shipglows_data/workflow/audits/2026-07-15-google-play-android-compliance.md
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes: []
evidence:
  - "Operator approval on 2026-08-22: delete the authenticated CommunityGlows account and operational data while retaining only the minimum purchase proof needed to recover a paid license."
  - "Google Play requires an in-app deletion path, an external web resource, deletion of associated account data, and disclosure of legitimate retention."
  - "CommunityGlows stores account identity and synchronized product state in Convex; social-network credentials and cookies remain device-local."
next_step: "Configure hosted secrets, regenerate Convex API types, execute focused tests, then collect hosted and device proof."
---

# Title

Authenticated CommunityGlows Account Deletion With License Recovery

# Status

Implemented in source across CommunityGlows and CommandGlows. Executable verification and complete Google Play compliance remain dependent on generated types, hosted configuration, and hosted/device proof.

# User Story

As an authenticated CommunityGlows user, I can permanently delete my CommunityGlows account and associated synchronized data without affecting third-party social-network accounts, while a paid lifetime-license holder can recover only the purchased access after returning with the same verified email.

# Minimal Behavior Contract

From account settings, an authenticated email-account user opens a destructive confirmation, explicitly confirms deletion, and receives a terminal success state after the server removes the account identity and CommunityGlows operational data. The client then clears synchronized local state and authentication tokens. Unauthorized or incomplete requests change nothing. Paid-license proof may remain in a logically separate minimal retention record, but deleted profiles, preferences, workspaces, tasks, links, and prior account state never return.

# Success Behavior

- The current authenticated user can delete only their own account.
- CommunityGlows cloud rows linked to that user are deleted transactionally with the local auth identity and sessions.
- Device-side synchronized state and CommunityGlows authentication tokens are cleared after server success.
- Social-network accounts, passwords, cookies, and sessions are not represented as remotely deleted; local native WebView session deletion is outside this first bounded slice.
- A lifetime purchase retains only a pseudonymized lookup, plan, provider/order references, and timestamps needed for license recovery and legal proof.
- Re-registration with the same verified email may restore the license, never the deleted product data.

# Error Behavior

- Unauthenticated, anonymous-only, malformed, stale-session, or cross-user requests fail closed without deletion.
- A central-suite or retention-preparation failure stops before destructive local deletion.
- Repeated deletion calls are idempotent from the user's perspective and never delete another user's data.
- The UI stays signed in and presents a recoverable error if the server does not confirm deletion.

# Problem

CommunityGlows permits in-app account creation but currently provides no self-service deletion control. The public deletion URL is absent and policy copy says deletion is unavailable. This blocks Google Play submission and leaves users without control over cloud identity and synchronized data.

# Solution

Add one authenticated server-owned deletion operation with an explicit data inventory, a destructive settings confirmation, post-success local cleanup, focused tests, and truthful in-app/site documentation. Keep license evidence separate from active account data. Treat central-suite erasure and reassignment as an explicit integration boundary: do not claim complete provider deletion or automatic restoration until that contract is implemented and hosted-proven.

# Scope In

- Convex user identity and auth-linked records owned by CommunityGlows.
- `socialAccounts`, `activeAccounts`, `settings`, `profiles`, `customLinks`, `friendsFilters`, `workspaceState`, `subscriptions`, local compatibility entitlements, redemption ownership, and billing-event user linkage.
- Minimal separate license-retention record with pseudonymized email lookup and bounded commercial fields.
- Settings UI with clear consequences, explicit confirmation, loading/error/success states, and accessibility.
- Client cleanup of cloud-backed local state and CommunityGlows auth tokens after confirmed deletion.
- French and English product strings.
- In-app privacy wording and a public `/account-deletion` resource with retention disclosure.
- Focused backend and UI contract tests authored for deferred execution under `#nolocal`.

# Scope Out

- Deleting Facebook, Instagram, LinkedIn, X, Gmail, or other third-party accounts.
- Claiming remote deletion of device-local WebView cookies that CommunityGlows does not store in Convex.
- Deploying Convex, publishing the website, generating Android artifacts, or changing Play Console declarations.
- Deploying the new central CommandGlows bridge operation before its contract and tests are reviewed.
- Legal advice or final accounting-retention periods.

# Constraints

- `#nolocal`: no build, install, test, lint, typecheck, server, browser, container, or generated runtime artifact in this run.
- No deletion begins until every prerequisite needed to preserve approved paid-license recovery succeeds.
- No plaintext email is stored in the retention record; use a keyed server-side digest, not an unsalted public hash.
- Retained data remains personal data, is purpose-limited, access-controlled, disclosed, and separated logically from active product data.
- Existing unrelated files and behavior remain untouched.

# Test Contract

- Backend tests: unauthenticated rejection; self-only deletion; complete per-table cascade; retained commercial fields only; billing-event anonymization; redemption unlinking; repeat safety; foreign-user isolation; precondition failure leaves all rows intact.
- UI tests: control visible only for authenticated email accounts; two-step destructive confirmation; pending state prevents duplicates; server error preserves session; success clears local synchronized state and closes settings.
- Auth/provider proof: hosted Convex account creation, deletion, token invalidation, failed refresh, and same-email re-registration.
- Commerce proof: paid lifetime access recovery restores access only; trial/abuse history does not reset; refunded/revoked access never restores.
- Manual proof: Windows and Android settings flow plus public deletion page.
- Current run exception: tests and rendered proof are authored but not executed because `#nolocal` forbids runtime workloads.

# Dependencies

- Existing Convex Auth tables and supported account/session deletion semantics.
- A server-only keyed-digest secret configured in hosted Convex.
- Central suite contract for tombstoning the former provider identity, removing its plaintext email from active identity records, and relinking the retained commercial entitlement after same-email verification.
- Confirmed legal/accounting retention policy for the seller entity.

# Invariants

- Authentication and user ownership are derived server-side; the client never supplies a target user ID.
- A failure before the transaction completes leaves the active account usable.
- Deleted product data never returns through license recovery.
- Retention records never contain password material, auth tokens, social cookies, profile data, task data, or backup payloads.
- Billing evidence is not used for marketing or general product profiling.
- A refunded or revoked license cannot be revived by account recreation.

# Links & Consequences

- Resolves the account-deletion blocker in the Google Play compliance audit only after hosted and device evidence passes.
- Changes account settings, auth lifecycle, cloud-sync cleanup, privacy disclosures, and public deletion support.
- Requires the Data Safety declaration and privacy inventory to be updated before Play submission.
- The central entitlement bridge remains authoritative for access; local evidence cannot silently override it.

# Documentation Coherence

- Update in-app privacy copy to describe self-service deletion accurately once implemented.
- Add the public account-deletion page and link it from privacy/support surfaces.
- Update the Google Play audit gate only after implementation and proof, preserving the remaining release blockers.
- Document retained fields, purpose, access, and provisional duration subject to legal/accounting confirmation.

# Edge Cases

- **Z — Zero/empty:** a user with no synchronized rows can still delete the auth account.
- **O — One:** one paid entitlement retains only its minimum recovery evidence.
- **M — Many:** every row in every user-indexed table is removed, not just the first.
- **B — Boundary:** oversized or malformed confirmation input is rejected client-side; server ignores client identity claims.
- **I — Interface:** provider/retention failure occurs before destructive deletion; post-success client cleanup tolerates already-cleared keys.
- **E — Error:** retries do not cross tenant boundaries or resurrect partial product state.
- **S — Security:** stale tokens, anonymous identities, concurrent requests, enumeration, and sensitive logging are explicitly rejected or redacted.

# Implementation Tasks

1. Add a server-owned deletion module and internal helpers that inventory and delete every CommunityGlows row for the authenticated user, unlink retained billing rows safely, and remove supported auth records last.
2. Add the minimal license-retention schema and keyed lookup boundary without plaintext identifiers or product-state payloads.
3. Add focused Convex tests covering authorization, cascade completeness, retention minimization, idempotency, and failure atomicity.
4. Add the settings destructive confirmation using canonical components/tokens and explicit paid-license consequences.
5. Add the client deletion call, server-success-only sign-out/token cleanup, and synchronized local reset.
6. Add French/English strings and focused UI contract tests.
7. Add the public account-deletion resource and reconcile in-app/site privacy wording without claiming central-suite proof that has not passed.
8. Perform static review under `#nolocal`; defer executable, hosted, Android, and browser evidence truthfully.

# Acceptance Criteria

- An authenticated user can initiate deletion from settings without contacting support.
- No request can select or delete another user.
- All inventoried CommunityGlows operational rows for the user are absent after success.
- Auth credentials and active sessions for the deleted account no longer authenticate.
- The client clears CommunityGlows auth and synchronized local state only after server success.
- The interface states what is deleted, what is retained, and that social-network accounts are unaffected.
- A paid-license recovery record contains no plaintext email and no deleted product data.
- Same-email recovery cannot restore revoked/refunded access or reset exhausted trial history.
- A public deletion resource is discoverable and truthful.
- No Google Play compliance completion is claimed before central-suite, hosted, and device proof.

# Test Strategy

Author narrow unit/contract tests beside the existing Convex and component suites. Use `convex-test` to seed two users and every user-owned table, then assert isolation and cascade behavior. Mock the client deletion boundary for UI state tests. After `#nolocal` is lifted or CI is authorized, run focused Vitest, core and Convex typechecks, token-drift scan, hosted auth deletion/re-registration, and Windows/Android manual smoke.

# Risks

- **Data loss:** intentional and irreversible; mitigated by explicit confirmation and server-derived identity.
- **Partial deletion:** mitigated by a single mutation boundary for local records and fail-before-delete integration preparation.
- **License loss or duplication:** central-suite contract and revoked/refunded guards are mandatory before automatic restoration is claimed.
- **Privacy misrepresentation:** copy must distinguish deleted product data from retained commercial evidence and device-local third-party sessions.
- **Secret misuse:** keyed digest secret is server-only and never logged or returned.

## OWASP Security Gate

- A01 Broken Access Control: derive user ID from auth and test foreign-user isolation.
- A02 Cryptographic Failures: use a server-secret HMAC/keyed digest; never a raw email hash.
- A04 Insecure Design: prepare retention before deletion and keep recovery fail-closed.
- A07 Identification and Authentication Failures: require an authenticated email account, invalidate sessions, and reject stale tokens.
- A09 Security Logging and Monitoring Failures: log only coarse deletion outcomes without email, tokens, order payloads, or user data.

# Execution Notes

- The CommandGlows retention boundary was implemented as a separated sequential work package; CommunityGlows integration remained owned by the primary implementation lane.
- Both repositories contained only the scoped implementation changes at final static review; no unrelated changes were rewritten.
- Source edits and tests may be authored under the approved plan; executable workloads, commit, push, deploy, and external writes remain excluded by `#nolocal` or separate authority.

# Open Questions

None for implementation. The operator explicitly approved coordinated CommunityGlows and CommandGlows changes on 2026-08-22. Legal/accounting confirmation controls the final retention duration; Google Play closure remains blocked until hosted and device proof passes.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-08-22 | sg-development | GPT-5 | Captured the approved authenticated deletion and minimal license-recovery contract. | reviewed | Readiness review, then bounded implementation. |
| 2026-08-22 | sg-development | GPT-5 | Integrated the approved cross-project central entitlement boundary and completed adversarial readiness review. | ready | Implement central retention/relink first, then CommunityGlows deletion. |
| 2026-08-22 | sg-development | GPT-5 | Implemented central HMAC retention/relink, authenticated local cascade, settings confirmation, client cleanup, bilingual copy, public deletion resource, and focused source tests. | implemented_unverified | Regenerate API types and run focused/hosted/device verification after `#nolocal`. |
| 2026-08-22 | sg-planning | GPT-5 | Added the unfinished verification and deployment outcome to the P0 execution queue with dependencies and acceptance evidence. | tracked | Configure hosted retention, deploy, and collect executable and device proof. |
| 2026-08-22 | sg-planning | GPT-5 | Made the remaining documentation gates explicit in the P0 task: legal retention duration, Play Data Safety, and post-proof audit update. | tracked | Complete these gates after hosted and device verification. |

# Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| Spec and readiness | ready | Behavior, data boundaries, retention, cross-project authority, proof, and central-suite dependency are explicit. |
| Implementation | completed | Coordinated source changes exist in CommunityGlows and CommandGlows. |
| Verification | pending | Static diff checks passed; runtime proof remains deferred under `#nolocal`. |
| Closure | pending | Forbidden until central-suite and hosted/device evidence pass. |
| Ship | pending | No commit, push, deployment, or release authorized. |
