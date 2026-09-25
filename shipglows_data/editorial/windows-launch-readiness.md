# Windows-first editorial launch readiness

Updated: 2026-09-05. Scope: local website corrections, not a public release approval.

## Distribution truth

- Public GitHub releases expose `windows-latest` as a prerelease, not a stable latest release. `/releases/latest` returns 404.
- Public installer: `https://github.com/commandglows/communityglows/releases/download/windows-latest/CommunityGlows-Windows-latest.exe`.
- Release metadata inspected on 2026-09-05: target commit `0fb768ae13f454b101dd954fad360628d20e2fe4`; installer updated 2026-08-15T12:10:49Z, 2,912,209 bytes. API-reported SHA-256: `79d82a5ae1e84ff6573a663e8f19b8df14b5902f3d8a0438663e23f062dfb873` (not a fresh binary hash verification).
- Current source and local changes do not prove inclusion in this installer. Bento refinements, Scenes and Tasks must be version-qualified. Android, Chrome/Firefox extensions, Linux and Apple platforms have no public availability promise in this launch.

## Commercial source and public boundary

`convex/billing.ts` and the suite commercial specification define authenticated Stripe checkout, an initial 30-day cycle and at most two explicit restarts. The intended lifetime price is EUR 79 once. CommandGlows is the provider identity used by the current implementation.

The site describes these direct-sale terms but does not assert that hosted checkout is launch-verified. Acquisition CTAs lead to localized download pages; billing links open the installed application. Newsletter signup remains a required launch feature, not a cancelled channel. Its temporary announcement does not collect email; Postmark delivery must be connected through the approved CommandGlows consent system.

## AppSumo and private LTD launch extension

Operator confirmed these acquisition channels on 2026-09-05. Do not publish prices, tiers, code stacking, device limits or refund promises without the actual offer contract. The EUR 79 direct offer is not automatically the marketplace contract. Purchase does not imply newsletter consent.

- Existing CommunityGlows code supports activation-code redemption and internal `appsumo` provenance, but that is not evidence of an operational AppSumo integration.
- Buyer Help now distinguishes activation codes from Stripe discounts, links to installed-app billing, warns against duplicate purchases and keeps code/order data out of public issues.
- Audit identified local billing state per composable consumer, non-reactive expiry/grace checks and no discoverable code entry on the locked gate. These require correction and buyer-flow proof before launch; unit helper/bridge tests alone do not cover them.
- The false redemption-success issue has a local regression-first repair: three negative cases first failed, then the four targeted suites passed (57 tests); the composable rerun with null-return assertions passed 28/28. `BUG-2026-09-05-001` remains fixed-pending-verify until native/provider proof. Do not equate this one fix with complete entitlement recovery.

### Newsletter dependency verified in the current checkout

CommandGlows `unified-identity-email-consent-and-delivery.md` defines central consent/audience storage, versioned server-to-server intake and Postmark delivery. Current newsletter routes still use Resend and a Windows-course welcome message. No `src/pages/api/v1/email` directory or target email-domain tables were found in the inspected CommandGlows checkout. Implementing the missing shared backend expands beyond CommunityGlows website changes and requires explicit cross-project scope. Do not reuse the legacy audience or create a competing CommunityGlows contact ledger.

Provider documentation checked: https://postmarkapp.com/developer/api/message-streams-api and https://postmarkapp.com/support/article/1299-how-to-include-a-list-unsubscribe-header. Broadcast unsubscribe handling must be proved; account approval alone is not delivery/integration proof. No provider, DNS, contact-list or real send mutation occurred.

## Delivered editorial surfaces

- Localized acquisition, availability, pricing, features, comparison and footer.
- FR/EN Windows tutorial and help/FAQ, including account context, backups and troubleshooting.
- Explicit blog language and reciprocal translation metadata; monolingual historical articles remain English-only without invented French alternates.
- French privacy, terms and account-deletion pages; session-sync wording corrected in both terms pages.
- Generated-site verification: `npm run build` then `node scripts/check-launch.mjs` in `site` checks links, anchors, headings, retired destinations and alternate-language routes.

## Local verification completed

- Final Astro build passed: 49 pages. Existing CSS `@theme` minifier warning remains non-blocking.
- Generated checks passed on all 49 pages: one H1, local links, anchors, locale alternates, no retired GitHub destination or fake newsletter form.
- Browser checks at 1440px and 390px covered nine key FR/EN routes; the French blog tag-row overflow found on mobile was fixed in both hubs and retested. Six additional mobile page checks passed without horizontal overflow.
- FAQ expansion works. Homepage Download click leads to `/fr/download`, whose Windows link targets the explicit prerelease installer.
- Four purchase-return pages respond in their intended language, are noindex, and do not claim payment confirmation. They do not validate Stripe or entitlement state.
- Visual review: French blog mobile and download desktop. App screenshots and native install proof are not included.

## Remaining release gates

1. Choose and distribute a release candidate built from the approved application commit; preserve and reconcile unrelated local app changes separately.
2. On the distributed installer: installation, first launch, first profile, network sign-in, profile isolation, recovery and uninstall/reinstall checks.
3. Hosted trial start, expiration, both explicit restarts, authenticated checkout, webhook entitlement activation and restoration after reauthentication. No real purchase was performed in this editorial task.
4. Resolve existing backend deployment prerequisites recorded in `shipglows_data/workflow/TASKS.md`, including Bento schema deployment and suite payment proof.
5. Capture real screenshots from the release candidate and finish illustrated tutorial verification. No synthetic screenshot is presented as app evidence.
6. Deploy the reviewed site changes, then recheck public CTAs, legal/help language links and the full acquisition journey. Local build success is not production proof.
