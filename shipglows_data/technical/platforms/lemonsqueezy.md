---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: communityglows
created: "2026-05-30"
updated: "2026-08-11"
status: superseded
superseded_by: "/home/claude/commandglows/shipglows_data/technical/platforms/stripe-managed-payments.md"
source_skill: 300-sg-docs
scope: platform-usage-lemonsqueezy
owner: Diane
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - shipglows_data/technical/code-docs-map.md
  - /home/claude/shipglows/shipglows_data/technical/external-platforms/lemonsqueezy.md
  - /home/claude/commandglows/shipglows_data/technical/platforms/lemonsqueezy.md
  - site/src/config/site.ts
  - site/src/pages/pricing.astro
  - site/src/pages/purchase/success.astro
  - site/src/pages/purchase/cancel.astro
depends_on:
  - artifact: "/home/claude/shipglows/shipglows_data/technical/external-platforms/lemonsqueezy.md"
    artifact_version: "0.2.0"
    required_status: "draft"
  - artifact: "/home/claude/commandglows/shipglows_data/technical/platforms/lemonsqueezy.md"
    artifact_version: "0.6.0"
    required_status: "draft"
supersedes: []
evidence:
  - "CommunityGlows public site delegates direct Lifetime Deal checkout to the CommandGlows suite commerce route."
  - "Fresh Lemon Squeezy docs checked on 2026-05-30; no official CLI or MCP was identified."
  - "Operator decision on 2026-08-11: CommunityGlows moves to the suite Stripe-only contract; Lemon Squeezy remains historical evidence only."
next_review: "2026-09-11"
next_step: "Remove the active Lemon Squeezy path during the central Stripe migration; retain this note for provenance."
---

# Lemon Squeezy Usage

> **Superseded on 2026-08-11.** CommunityGlows must use the central Stripe
> Managed Payments checkout and webhook path. This note preserves the former
> Lemon Squeezy contract only as migration history.

## Purpose

Migration history only. This file documents a former integration path.

CommunityGlows never owns Lemon Squeezy API keys, webhooks, refunds, or durable payment truth.
The active contract now routes checkout and entitlement through the central Stripe-only suite.

Use these provider notes:

- Global source note: `/home/claude/shipglows/shipglows_data/technical/external-platforms/lemonsqueezy.md`
- Suite usage note: `/home/claude/commandglows/shipglows_data/technical/platforms/lemonsqueezy.md`

## Usage Summary

- Provider role: historical checkout reference during migration.
- Historical CommunityGlows role: public CTA, success/cancel pages, app activation/status flow.
- Applies to paths:
  - `site/src/config/site.ts`
  - `site/src/pages/pricing.astro`
  - `site/src/pages/purchase/success.astro`
  - `site/src/pages/purchase/cancel.astro`
  - `site/.env.example`
  - `site/README.md`
- Environment references are historical only.
- Validation is now performed by the central Stripe-only suite contract.
- Owner: Diane.
- Last verified: 2026-05-30 by local build and official docs review; provider smoke not yet executed.

## Local Configuration

| Item | Value or rule | Secret? | Notes |
| --- | --- | --- | --- |
| Suite checkout base URL | `PUBLIC_COMMANDGLOWS_CHECKOUT_URL` | no | Public site points to the CommandGlows suite checkout route at `https://www.commandglows.com` by default. |
| Public site URL | `PUBLIC_SITE_URL` | no | Used for success/cancel callback URLs. |
| App URL | `PUBLIC_APP_URL` | no | Used by result pages for activation/status guidance. |
| Lemon Squeezy API key | not stored in CommunityGlows site | yes | Historical note only. |
| Lemon Squeezy webhook secret | not stored in CommunityGlows site | yes | Historical note only. |

## Runtime And Integration Notes

- Pricing CTA should link to the CommandGlows suite checkout route for `offerId=communityglows/lifetime_deal`.
- Public pages should say "Lifetime Deal", "early-bird", or "activation code"; do not use "founder" wording.
- Public pages must not route direct buyers to AppSumo or another commission marketplace as the default fallback.
- The success page is not payment proof. It should guide the buyer to app activation/status while the suite waits for a signed webhook.
- CommunityGlows app access must come from the suite entitlement adapter, not Lemon Squeezy payloads.

## MCP / CLI Policy

Current status:

- Official Lemon Squeezy CLI: not identified.
- Official Lemon Squeezy MCP: not identified.
- CommunityGlows-adopted automation layer: none.

CommunityGlows should not connect a third-party Lemon Squeezy MCP directly to public site or app code. Any future MCP/CLI automation belongs in the CommandGlows suite/operator layer after review.

## Invariants

- CommunityGlows site remains acquisition/checkout-start only.
- CommandGlows suite remains the payment and entitlement fulfillment owner.
- No Lemon Squeezy secret appears in CommunityGlows client/site env.
- Direct buyers were routed through this path in historical Commerce integration.
- CommunityGlows app never requires users to understand Lemon Squeezy.

## Failure Modes

- `PUBLIC_COMMANDGLOWS_CHECKOUT_URL` missing or wrong -> CTA cannot start checkout; fix site env and rebuild.
- CommandGlows checkout provider missing env -> buyer receives unavailable checkout response; no AppSumo fallback.
- Lemon Squeezy webhook delayed -> success page still only gives activation/status guidance; no access grant from redirect alone.
- Third-party MCP suggested for CommunityGlows -> route to the CommandGlows/provider usage note; do not add it to CommunityGlows app/site.

## Security Notes

- Do not add Lemon Squeezy API keys, webhook secrets, store ids, variant ids, raw order payloads, customer emails, or provider logs to CommunityGlows public docs or code.
- Treat checkout URLs and activation codes as potentially sensitive support artifacts when tied to a real buyer.
- CommunityGlows public copy must avoid exposing marketplace fallback channels that route users away from direct checkout.

## Validation

Local checks:

```bash
npm -C /home/claude/communityglows/site run build
python3 /home/claude/shipglows/tools/shipglows_metadata_lint.py /home/claude/communityglows/shipglows_data/technical/platforms/lemonsqueezy.md
```

Cross-project provider smoke is owned by CommandGlows:

```text
Create checkout from CommunityGlows pricing -> legacy Lemon Squeezy check (historical) -> suite entitlement path -> non-granting on refund/revoke.
```

## Reader Checklist

- `site/src/config/site.ts` or `pricing.astro` changed -> verify checkout URL, success/cancel URLs, and no public marketplace fallback.
- Purchase result pages changed -> verify they do not claim payment/access before webhook fulfillment.
- CommunityGlows app billing/access changed -> verify suite entitlement adapter remains the source of truth.
- Lemon Squeezy CLI/MCP question appears -> use global and CommandGlows notes; do not introduce a CommunityGlows-local provider automation layer.

## Maintenance Rule

Update this note when the CommunityGlows checkout CTA, public checkout copy, result pages, app activation path, suite checkout base URL, or Lemon Squeezy tool/automation policy changes.
