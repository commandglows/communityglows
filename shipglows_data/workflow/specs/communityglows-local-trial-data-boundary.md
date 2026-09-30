---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: communityglows
created: "2026-09-30"
created_at: "2026-09-30 11:39:14 UTC"
updated: "2026-09-30"
updated_at: "2026-09-30 11:39:14 UTC"
status: draft
source_skill: 100-sg-spec
source_model: "GPT-6 Codex"
scope: "native trial entry, local-data boundary, and paid-sync transition"
owner: Diane
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
user_story: "As a Windows or Android user, I want to try the full currently available CommunityGlows app during an eligible trial and know which data stays only on this device, so I can choose between managing manual backups and buying the lifetime license for the existing sync service."
linked_systems:
  - "src/ui/setup/pages/CommunityGlows/App.vue"
  - "src/ui/setup/pages/CommunityGlows/components/OnboardingFlow.vue"
  - "src/ui/setup/pages/CommunityGlows/components/SignupNudge.vue"
  - "src/ui/setup/pages/CommunityGlows/components/ProductAccessGate.vue"
  - "src/ui/setup/pages/CommunityGlows/components/BillingAccessPanel.vue"
  - "src/composables/useBillingAccess.ts"
  - "src/lib/cloudSettings.ts"
  - "src/lib/cloudSync.ts"
  - "src/locales/fr.json"
  - "src/locales/en.json"
  - "shipglows_data/workflow/specs/communityglows-first-run-access-clarity.md"
  - "shipglows_data/workflow/specs/login-local-kanban.md"
  - "shipglows_data/workflow/specs/communityglows-single-price-public-contract.md"
depends_on:
  - artifact: "shipglows_data/workflow/specs/unified-suite-commercial-entitlement-and-stripe.md"
    artifact_version: "1.3.3"
    required_status: "ready"
  - artifact: "shipglows_data/technical/design-system-authority.md"
    artifact_version: "1.5.0"
    required_status: "reviewed"
supersedes:
  - "native local-Kanban-only entry behavior and its local-only account/login claims in shipglows_data/workflow/specs/login-local-kanban.md"
evidence:
  - "Operator decision on 2026-09-30: preserve server-eligible trial policy (three 30-day cycles maximum, including up to two restarts) and EUR 149 incl. VAT one-time lifetime license."
  - "Operator decision on 2026-09-30: an authenticated account verifies/counts trial eligibility only; during a native trial all application data stays on-device, with no cloud hydration, app-data upload, cloud backup, or synchronization."
  - "Operator decision on 2026-09-30: manual local export/import remains available during trial; import must not trigger cloud writes."
  - "Operator decision on 2026-09-30: active paid lifetime access enables existing synchronization through a safe transition; remove native local-Kanban-only trial entry, consider Android parity because the same trial applies, and leave Chrome's free/local offer unchanged."
  - "Read-only route audit: App.vue contains a /local-kanban-only route and sidebar destination choice; TasksView.vue selects stores by route. login-local-kanban.md specifies isolated local tasks and explicit account merge."
  - "Read-only access audit: native access is governed by useBillingAccess and ProductAccessGate; first-run/billing UI describes the shared trial but not its device-only data boundary."
  - "The active suite contract sets 30 days per cycle, up to two user-requested restarts, server-owned eligibility, no permanent free native grant, and purchase after exhaustion."
  - "The public offer and first-run contracts set EUR 149 incl. VAT, paid once."
next_step: "Resolve the first paid-sync choice for divergent local and cloud data, then revise the spec and readiness review."
---

# CommunityGlows Native Trial and Local Data Boundary

## Status

Draft; readiness review found one unresolved paid-sync decision. Product, platform, trial, price, and data-location decisions are recorded. This spec changes native trial presentation and synchronization behavior; it does not change the commercial offer.

## User Story

As a Windows or Android user, I want to try all currently available CommunityGlows features during an eligible trial without confusing sign-in with cloud backup, so I can keep data on this device and export/import it myself, or buy the lifetime license to enable existing sync across devices.

## Minimal Behavior Contract

When a person first opens the native app, explain before sign-in or setup that an account is needed only to check and count eligibility for the existing trial. After the server confirms an eligible active trial, unlock the full currently available app on Windows and Android while keeping all application-data reads and writes local: no cloud hydration, app-data upload, cloud backup, or sync until the server confirms an active paid lifetime license. Keep manual export/import available; importing remains local and cannot enqueue cloud writes. If access cannot be checked, do not grant a new trial or call the user expired; offer retry and account recovery. When paid access becomes active, retain and reconcile local data safely with any existing cloud data before enabling existing sync. The easiest missed case is an account with pre-existing cloud data: trial sign-in must neither pull it into the device nor push local trial data into the account.

## Success Behavior

The entry offers the full eligible trial instead of a Kanban-only guest path and explains the access and data boundary in plain French and English. Authentication checks eligibility and counts the server-issued trial; it does not imply payment, cloud backup, or app-data synchronization. Users can use all currently available native product features in an active trial and manually export/import local data. Billing surfaces repeat that local data has no automatic cloud backup during trial. Existing cloud sync becomes available only after a fresh server decision confirms active paid lifetime access. Chrome extension free/local access remains unchanged.

## Error Behavior

- **Eligibility lookup unavailable:** show retry, account recovery, or support as applicable. Do not start/consume a trial locally, grant access using a cached UI flag, or report expiry/ineligibility from a transport error.
- **No eligibility:** show server-derived recovery and the EUR 149 incl. VAT one-time offer when available. Do not expose a Kanban-only native workaround or create a permanent free tier.
- **Expired/exhausted:** suspend protected product actions according to suite policy, but keep local data and manual export/import available. Offer an eligible restart or purchase, plus retry/recovery/support. Never delete local data on expiry.
- **Paid transition cannot reconcile:** keep local state intact; do not silently replace it with cloud state or claim sync completed. Preserve export and retry/conflict recovery.
- **Invalid/partial import:** explain failure without clearing current local data or sending imported values to cloud.

## Problem

The native first-run/login UI presents “Try Kanban locally” as a free local-only way into the app. That suggests only Kanban is available to try and obscures the actual offer: eligible users may access the full current app during the server-governed trial. Existing trial copy covers app access, duration, restarts, and price, but not that authentication is distinct from cloud sync. Cloud-setting and store-sync calls mean changing only the headline could leave trial data exposed to unintended reads/writes. Manual backup remains available and should be presented as the user's responsibility during trial.

## Solution

Replace the native local-Kanban-only entry with a clear eligible-trial path and local-data warning before account creation/sign-in. Preserve current trial lifecycle and one-time price. Enforce the copy in runtime behavior: trial permits required authentication/entitlement traffic but no app-data cloud hydration, upload, backup, or sync. Keep manual export/import usable and local. Present the EUR 149 incl. VAT lifetime license, paid once, as the path that enables existing sync. Gate and reconcile the first paid sync without silently losing or overwriting local or existing cloud data. Remove the local-Kanban-only native entry on Windows and apply the same trial/data boundary on Android. Leave Chrome's free/local offer unchanged.

## Bilingual Entry Copy Contract

Exact strings may be adjusted for layout while preserving each claim. Keep access terms and the data warning adjacent and readable before the first setup action.

| Surface | Français | English |
|---|---|---|
| Headline | Essayez CommunityGlows | Try CommunityGlows |
| Access | Connectez-vous ou créez un compte pour vérifier si vous avez droit à une période d’essai. Si elle est accordée, utilisez toutes les fonctionnalités actuellement disponibles pendant 30 jours, sans carte bancaire ni prélèvement automatique. Jusqu’à deux nouvelles périodes de 30 jours peuvent être demandées si vous y êtes admissible. | Sign in or create an account to check whether you’re eligible for a trial. If granted, use every feature currently available for 30 days, with no payment card or automatic charge. You may request up to two additional 30-day periods if eligible. |
| Data warning | **Pendant l’essai, vos données restent uniquement sur cet appareil.** Rien n’est synchronisé ni sauvegardé dans le cloud. Vous pouvez exporter et importer une sauvegarde manuellement. Sans export, une panne, une réinitialisation, une désinstallation ou la perte de cet appareil peut entraîner la perte de vos données. | **During the trial, your data stays only on this device.** Nothing is synced or backed up to the cloud. You can export and import a backup manually. Without an export, device failure, reset, uninstall, or loss may cause your data to be lost. |
| Paid path | Avec la licence à vie à 149 € TTC, payée une seule fois, la synchronisation existante devient disponible pour les données compatibles sur vos appareils. | With the EUR 149 incl. VAT lifetime license, paid once, existing sync becomes available for supported data across your devices. |
| Primary CTA | Vérifier mon accès | Check my access |
| Returning account | J’ai déjà un compte | I already have an account |
| Offer CTA | Découvrir la licence à vie | View the lifetime license |
| Manual recovery | Importer une sauvegarde | Import a backup |

Eligibility is not guaranteed. Returning lifetime-license holders continue through paid access and are not told to start a trial. Preserve suite terms: at most three 30-day cycles in total, including two user-requested restarts, no card, no automatic charge, no permanent free native access, and purchase required after exhaustion for protected use. Trial start continues to follow the existing server contract. Do not promise every account a 90-day trial.

## Scope In

- Native Windows and Android first-run/login/entry copy and choice hierarchy.
- Removal of native local-Kanban-only entry CTA and route fallback; the full current native app is the trial scope.
- Local-only trial data boundary across application stores, settings, profiles/Bentos/network metadata, imports, startup hydration, and cloud mutation queues.
- Clear separation between authentication/eligibility requests and application-data transfer.
- FR/EN active-trial, billing/reminder, eligibility-error, expired, exhausted, restart, and purchase recovery copy.
- Existing manual export/import remains usable during trial and isolated from cloud mutation queues.
- Safe transition from trial to paid sync, including accounts with existing cloud data and interrupted/failed reconciliation.
- Focused regression tests and Windows/Android rendered/device proof contract.
- Narrow correction to first-run data/sync claims and login-local-kanban's superseded native entry.

## Scope Out

- Any change to eligibility, attempt counting, 30-day cycle, two-restart maximum, trial-start semantics, price, payment provider, checkout, tax, or license terms.
- Permanent free access to Windows/Android, a new tier, or Kanban-only trial/paid distinction.
- Chrome extension entry, permissions, and free/local offer.
- Redesign of sync coverage, including session cookies or any data not supported by existing sync.
- Cloud sync or cloud app-data backup during a trial, and automatic import-to-cloud behavior.
- Marketing-site redesign, sales activation, deployment, or release.

## Constraints

- **Commercial authority:** the unified suite contract owns server eligibility/cycles; the public offer and first-run specs establish EUR 149 incl. VAT, one-time lifetime price. This spec changes none of those terms.
- **Trial access vs data:** an active trial grants current product actions but is not permission to read/write synchronized app data. The only network traffic allowed for trial access is required auth/eligibility/entitlement traffic (and separately governed non-app-data operational requests). No profiles, settings, social metadata, tasks, links, Bentos, or imported app data may hydrate from or be written to cloud while trialing.
- **Fail closed:** local cached access, auth presence, offline state, or client flags cannot establish trial eligibility or paid sync permission. Follow suite bounded access/grace policy for access checks without authorizing app-data sync.
- **Storage:** use the same local product stores; do not fork a smaller guest-only feature store. Preserve local records across sign-out, failed refresh, expiry, and license activation.
- **Manual files:** export/import are user-initiated and local. Describe existing coverage accurately; do not imply export runs automatically or is cloud backup. Validate import before replacing state and recover from partial failure.
- **Paid transition:** a fresh `paid_active` snapshot verifies the license but does not by itself authorize first sync when both device and account already contain different app data. Until the operator defines that conflict journey, do not hydrate or write either snapshot; keep local data available and route to a recoverable state. Never silently delete/replace either side or report sync success before acknowledged writes. The already-defined empty-side seeding behavior may proceed only after tests prove that the other side contains no data.
- **UI authority:** use `shipglows_data/technical/design-system-authority.md` components/tokens; preserve focus, keyboard access, narrow-layout readability, and Windows/Android parity.
- **Locale and claims:** keep FR/EN equivalent. Do not guarantee that purchase prevents every form of loss; state that existing sync becomes available for supported data.
- **Supersession:** this spec supersedes only native local-Kanban trial entry and native data/sync assumptions in `login-local-kanban.md`. Extension behavior and account-task merge do not change unless needed for shared-code isolation.

## Test Contract

Proof order: source/data-flow inspection, automated focused tests, rendered UI, then authenticated/device proof. Static/build success does not prove the trial boundary.

- **Isolation:** in `trial_active`, assert startup, sign-in, settings/profile/Bento/task/link changes, export, and import produce zero app-data cloud queries, mutations, or queue enqueues. Assert authentication and eligibility traffic still works. Assert existing sync paths return only after fresh paid confirmation.
- **Backup:** round-trip supported data; malformed/partial import preserves current state; export is explicit; trial imports never create remote writes, including after reconnect/retry.
- **Transition:** cover empty/existing cloud, duplicate IDs, divergent records, interrupted reconciliation, stale entitlement, refund/revocation, retry, and acknowledged writes; prove both local and cloud records are preserved before sync success.
- **Access states:** first cycle, two restarts, exhaustion, ineligible identity/installation, paid account, lookup unavailable, offline/stale snapshot, sign-out, recovery. Trial must not be confused with permanent access or sync permission.
- **UI/locale:** render FR/EN entry/login, active reminder, backup, expired/restart-eligible, exhausted, lookup error, purchase, and paid-sync explanation on Windows desktop and Android/narrow width; verify parity, CTA clarity, keyboard/focus, accessible names, and no clipping.
- **Native proof:** use Doppler-managed development launch. On Windows and Android exercise an eligible trial identity and a paid identity without consuming extra trial attempts; capture requests showing no app-data reads/writes while trialing, then verify existing sync only after paid entitlement. Mocked flags are not entitlement proof.
- **Chrome:** verify the existing extension free/local entry and storage remain unchanged.
- **This spec pass:** no tests, builds, or runtime proof were run.

## Dependencies

- `shipglows_data/workflow/specs/unified-suite-commercial-entitlement-and-stripe.md` — trial lifecycle, access states, fail-closed authority.
- `shipglows_data/workflow/specs/communityglows-first-run-access-clarity.md` — access copy; align with local-data boundary.
- `shipglows_data/workflow/specs/login-local-kanban.md` — historical isolation/merge contract; native entry portion superseded.
- `shipglows_data/workflow/specs/communityglows-single-price-public-contract.md` — current price and feature claims.
- `shipglows_data/technical/design-system-authority.md` — native UI system and token validation.
- `shipglows_data/technical/context.md` — current local/cloud data map; align current sync/backup descriptions when implementing the new boundary.

## Invariants

- Server-issued trial remains account/installation eligible, at most three 30-day cycles and two user-requested restarts.
- Login verifies identity/access; it is not a paid license and does not imply app-data sync/backup.
- Throughout every trial cycle app data stays on-device: no cloud hydration, app-data upload, cloud backup, or sync.
- Manual export/import is user-controlled; neither operation silently causes cloud writes.
- Native trial unlocks all currently available CommunityGlows features, not only Kanban.
- Only verified active paid lifetime access enables existing supported sync.
- Local data survives expiry, lookup failure, sync setup failure, and license activation; initial paid reconciliation never silently overwrites either side.
- Chrome extension free/local behavior and the existing commercial offer remain unchanged.
- UI never guarantees trial eligibility, 90 days for all, or zero risk of loss after purchase.

## Links & Consequences

- Trial/access authority stays in the suite entitlement ledger and `useBillingAccess`; no client-side trial or paid grant is introduced.
- `App.vue`, native store/bootstrap, settings sync, cloud queues, import/export, and gated views use one authoritative local-only/paid-sync capability rather than independently guessing permission.
- Existing sync is available for supported data only when paid. The transition is verified against cloud snapshots and queue acknowledgements.
- `login-local-kanban.md` remains authority for Chrome's local offer and account-task merge; its native local trial route is superseded here.
- `communityglows-first-run-access-clarity.md` continues to own trial eligibility, duration, restarts, price, and pre-setup terms; update its claims about trial data sync.
- Public price/offer remains governed by `communityglows-single-price-public-contract.md`; no public offer changes are specified.

## Documentation Coherence

When implementation lands, update current native trial/login sections of `communityglows-first-run-access-clarity.md` and `login-local-kanban.md`, preserving historical run rows and annotating supersession. Update FR/EN locale JSON. No suite offer, website price, or Chrome extension copy change. Do not update TODO/task trackers or unrelated docs in this spec pass.

## Edge Cases

- Signed-in trial user has previous cloud records: do not hydrate them during trial.
- Local-trial user signs into an identity with active paid access: use paid transition, preserving local and cloud data.
- Trial expires offline: keep data exportable; product access follows last server-verified grace policy; sync remains disabled.
- Offline with no verified eligibility: offer retry/account recovery; never grant a new trial locally.
- Restart requested: server decides eligibility; local data stays local and warning remains.
- Export/import/reconnect during trial: imported state stays local and creates no queued cloud write.
- Payment succeeds but access refresh is delayed: do not claim sync is enabled; preserve work and offer retry/restore.
- Refund/revocation after sync: stop new sync when no longer authorized and retain local data/export paths.
- Duplicate/conflicting records or partial reconciliation: preserve both sides; retry/review; never report partial writes as full sync.
- Chrome shares login components: retain its local route, storage, and offer.
- Existing lifetime-license holder opens the entry: verify paid access; do not make trial eligibility the only path.

## Implementation Tasks

1. **Define one sync capability from verified access.** Route every app-data hydration, mutation, and queue through a policy false in trial/local state and true only for fresh `paid_active`; keep auth/eligibility traffic. Story: separate trial access from cloud data. Dependency: suite entitlement authority. Validation: inventory call sites and test denial/allowance for every query/mutation. Constraint: no commercial-policy change.
2. **Make startup and stores local-safe.** Prevent trial startup/sign-in from hydrating or queuing app data; keep local stores usable through sign-out, refresh, expiry, and connectivity changes. Story: use all current features locally. Dependency: task 1. Validation: startup-order tests and local CRUD with zero app-data requests.
3. **Keep backup local and recoverable.** Verify export/import coverage; validate before apply, preserve state on malformed/partial input, and prevent remote enqueue in trial. Story: user-managed backups. Dependency: task 2. Validation: round-trip, failure/rollback, reconnect, and queue tests.
4. **Implement the paid transition only after its conflict journey is approved.** In this spec, verify whether local and cloud snapshots are empty or populated. Empty-side seeding may follow current sync behavior only after proving no data on the other side. If both contain data, do not hydrate/write either side; preserve local mode and surface the approved recoverable next step. Do not invent merge keys, conflict policy, or destructive-choice copy. Story: paid access enables supported cross-device sync without losing data. Dependency: operator decision on first-sync divergence. Validation after decision: exact local/cloud/conflict fixtures, cancellation, interruption, retry, revocation, restore.
5. **Replace native entry and clarify FR/EN choice.** Remove native local-Kanban CTA/path on Windows and Android; present eligibility, full current-app scope, cycle terms, no card/charge, device-only warning, manual backup, and EUR 149 sync path. Story: informed first use. Dependency: tasks 1–4. Validation: trace copy to state branches, render locales at desktop/narrow widths, confirm no native fallback bypasses the trial gate.
6. **Align recovery and current docs.** Update active, reminder, expiry, exhausted, billing, signup, and lookup-error copy plus current first-run/login clauses. Preserve Chrome, history, commercial terms, and unrelated dirty edits. Story: understand trial-to-paid recovery. Dependency: task 5. Validation: bilingual state matrix and search for conflicting current claims.

## Acceptance Criteria

- [ ] FR/EN native entry explains sign-in checks access; eligible new users can start a trial, while existing lifetime-license holders continue on paid access; no account is promised trial eligibility.
- [ ] Entry states all current features are available in an eligible trial and gives the existing terms: maximum three 30-day cycles, two optional restarts, no card/automatic charge, EUR 149 incl. VAT paid once for lifetime access.
- [ ] Before account/setup action, the warning says trial data is only on this device, no sync/cloud backup occurs, manual export/import is available, and device failure/reset/uninstall/loss can lose unexported data.
- [ ] Windows and Android have no Kanban-only native guest/trial entry; protected actions cannot bypass trial access through local navigation.
- [ ] Trial sign-in/startup makes zero app-data cloud query, hydration, upload, backup, mutation, or queued write; auth/entitlement requests still work.
- [ ] All currently available protected native features are accessible during a valid trial, subject to existing product/platform limitations.
- [ ] Manual export/import stays available after expiry; import applies locally and creates no cloud writes, including after reconnect.
- [ ] Only fresh server-confirmed paid lifetime access enables sync; cached, trial, stale, failed, or unknown states do not.
- [ ] A paid entitlement alone cannot hydrate/write when both local and cloud app-data snapshots are populated and diverge; preserve both and use the operator-approved conflict journey before enabling sync.
- [ ] The approved transition choice preserves both snapshots until every selected write is acknowledged; cancel, interruption, or failure leaves a recoverable state, retries are idempotent, and no success claim precedes acknowledged reconciliation.
- [ ] Expiry, exhausted trial, failed lookup, payment delay, sync error, and revocation preserve local export/recovery and report the correct state.
- [ ] Chrome extension free/local access is regression-tested and unchanged.
- [ ] Current docs/locales match; historical evidence remains; offer policy, price, and provider are unchanged.

## Test Strategy

Use focused tests at the actual sync capability boundary, not UI text alone. Spy on cloud repositories/queues to prove zero app-data operations in trial and authorized existing sync only after fresh paid confirmation and completed user-reviewed reconciliation. Test import/export integrity and transition recovery. Inspect all shared sync call sites, including settings writes from `App.vue` and onboarding. Render FR/EN states on Windows desktop and Android narrow layouts. Then use Doppler-managed launches and real eligible trial/paid identities on both native platforms; correlate entitlement requests separately from app-data traffic. Verify Chrome unchanged. Mocks/builds alone do not prove provider/device isolation.

## ZOMBIES Coverage

- **Zero:** ineligible, unknown, unavailable, no paid license; no app-data cloud permission.
- **One:** first cycle, local backup, first paid transition.
- **Many:** three cycles; multiple profiles/networks/tasks/links; duplicate/divergent records.
- **Boundaries:** expiry, exactly two restarts, exhaustion, paid activation/revocation, stale snapshots.
- **Interfaces:** login/onboarding, stores, settings, cloud queues, backup, billing/gate, locales, Chrome shared code.
- **Exceptions:** offline, lookup timeout, malformed import, interrupted reconcile, delayed payment refresh, partial writes.
- **Simple:** one eligibility authority, one sync policy, unchanged offer.

## OWASP Security Gate

- **Trust boundary:** client auth/cached access cannot authorize trial eligibility or sync. Verify server-side and gate data operations at their source, not only in UI.
- **Data minimization:** trial transmits only identity/auth/eligibility data needed by access flow; app records do not enter logs, analytics, crash context, retries, or queues.
- **Authorization:** test unauthenticated, trial, expired, stale, forged-paid, wrong-product, and revoked states cannot invoke paid cloud reads/writes; server remains authoritative.
- **Import safety:** validate schema/size before apply; prevent partial destructive replacement; never execute imported content or treat it as authority.
- **Applicable areas:** OWASP Top 10:2025 A01 Broken Access Control, A02 Security Misconfiguration, A08 Software/Data Integrity Failures, A09 Security Logging and Monitoring Failures; A04 applies only if existing backup encryption is changed. Selected ASVS v5.0.0 controls: `v5.0.0-1.5.2` safe deserialization of imported data, `v5.0.0-2.2.2` validation at a trusted service layer, and `v5.0.0-2.3.3` atomic business operations/rollback. Prove denied and allowed branches, safe import validation, and atomic/recoverable reconciliation; this is not a claim of ASVS compliance.

## Risks

- **High — hidden sync bypass:** startup hydration, settings, or background queues can evade a UI gate. Mitigate with a call-site inventory, one capability policy, and zero-network assertions.
- **High — paid-transition loss:** local/cloud data may diverge. Mitigate with non-destructive reconciliation, conflict review, idempotency, interruption recovery, and acknowledgement-based success.
- **High — misleading backup assurance:** login or paid sync may be mistaken for a complete independent backup. Explain manual trial backup and state supported-data scope precisely.
- **Medium — accidental trial consumption:** access checks may mutate server attempt state. Keep the explicit CTA and do not consume a cycle merely by viewing onboarding; honor server start semantics.
- **Medium — Chrome regression:** shared route changes could remove extension's offer. Add extension entry/storage regression.
- **Residual:** local trial data is vulnerable to device failure, user deletion/reset, or loss until exported. Purchase enables existing supported sync, not an absolute guarantee against all loss.

## Links & Consequences

- Governed truth: suite trial policy, supported sync coverage, public price, and design tokens. Do not imply universal sync coverage.
- User choice: try the full app locally with manual backup, or purchase the lifetime license to enable supported existing sync. Account creation is not paid access.
- Before → after: native “Try Kanban locally”/isolated guest task route → eligible full-app trial with device-only data; trial app-data transfer → none; paid access → existing sync after safe reconciliation.
- Release proof requires Windows and Android interactive evidence; screenshots and mocks do not prove network isolation or eligibility.

## Open Questions

Open: when a paid account already has cloud app data that differs from local trial data, what user-visible first-sync choice/recovery policy should apply before either side is overwritten? The paid license enables existing sync, but no conflict-resolution UX or merge semantics are assumed here. Until this operator decision is captured, this spec is not ready for implementation of that transition. Other decisions are confirmed: full native trial scope, local-only trial data, manual backup, unchanged trial/price, Android parity, and unchanged Chrome offer.

## Execution Notes

Read first: `App.vue`, onboarding/login/signup/access gate/billing, `useBillingAccess.ts`, cloud settings/sync repositories and callers, native backup/import, `login-local-kanban.md`, `communityglows-first-run-access-clarity.md`, suite and price contracts, design authority. Preserve existing dirty work. Use Doppler for later build/runtime work. Do not create extra trial attempts, activate purchases, deploy, or ship without separate authorization.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-09-30 | 100-sg-spec | GPT-6 Codex | Captured native full-app trial entry, local-only trial data boundary, manual backup, paid-sync transition, unchanged offer, and Chrome exclusion | draft | 101-sg-ready review of data and transition contract |
| 2026-09-30 | 101-sg-ready | GPT-6 Codex | Independently reviewed user-story fit, data/auth boundaries, commercial/design authorities, bilingual entry, transition failures, proof, and documentation consequences | not ready | Obtain operator decision for first paid sync when local and existing cloud data diverge; no merge semantics inferred |

## Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| Spec | draft | New native trial-entry/data-boundary contract recorded; source code and existing files untouched. |
| Readiness | not ready | Operator decision pending for the user-visible choice when local trial data and existing cloud data differ; no sync/merge policy inferred. |
| Implementation | pending | Enforce local-only trial data, replace native Kanban-only entry, preserve backup and paid sync. |
| Verification | pending | Automated isolation tests, bilingual rendered review, Doppler-managed Windows/Android trial and paid proof. |
| Ship | not authorized | No publication, commit, or deployment in scope. |
