---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: communityglows
created: "2026-08-11"
updated: "2026-08-11"
status: active
source_skill: sg-docs
scope: platform-usage-stripe-managed-payments
owner: Diane
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - shipglows_data/technical/code-docs-map.md
  - /home/claude/shipglows/shipglows_data/technical/external-platforms/stripe-managed-payments.md
  - /home/claude/commandglows/shipglows_data/technical/platforms/stripe-managed-payments.md
  - /home/claude/shipglows/shipglows_data/workflow/specs/unified-suite-commercial-entitlement-and-stripe.md
  - convex/billing.ts
  - src/composables/useBillingAccess.ts
  - site/src/config/site.ts
depends_on:
  - artifact: "/home/claude/shipglows/shipglows_data/technical/external-platforms/stripe-managed-payments.md"
    artifact_version: "2.0.0"
    required_status: active
  - artifact: "/home/claude/commandglows/shipglows_data/technical/platforms/stripe-managed-payments.md"
    artifact_version: "1.0.0"
    required_status: draft
  - artifact: "/home/claude/shipglows/shipglows_data/workflow/specs/unified-suite-commercial-entitlement-and-stripe.md"
    artifact_version: "1.0.0"
    required_status: ready
supersedes:
  - "shipglows_data/technical/platforms/lemonsqueezy.md v0.3.0"
evidence:
  - "Operator decision on 2026-08-11: Stripe Managed Payments is the only payment provider for CommunityGlows and every suite product."
  - "CommunityGlows already delegates durable entitlement decisions to the CommandGlows central Convex ledger."
next_review: "2026-09-11"
next_step: "Configure approved Stripe Price IDs and run hosted Stripe/Convex plus Windows/Android proof in a later authorized chantier."
---

# Stripe Managed Payments Usage

## Purpose

Define CommunityGlows adoption of the central suite Stripe Managed Payments
path. CommunityGlows owns product presentation, authenticated checkout start,
and access-state UX. CommandGlows owns Stripe secrets, Checkout Session
creation, exact-body webhook verification, event normalization, and Convex
fulfillment.

## Owned Files

- `convex/billing.ts`
- `src/composables/useBillingAccess.ts`
- `src/ui/setup/pages/CommunityGlows/components/BillingAccessPanel.vue`
- `src/ui/setup/pages/CommunityGlows/components/ProductAccessGate.vue`
- `site/src/config/site.ts`
- `site/src/pages/lifetime-deal.astro`
- `site/src/pages/fr/lifetime-deal.astro`

The Stripe adapter, webhook, offer registry, and provider secrets are owned by
`/home/claude/commandglows/commandglows_site` and must not be duplicated here.

## Entrypoints

- CommunityGlows suite bridge: the central authenticated entitlement endpoint.
- Central checkout: `POST /api/commerce/checkout` on CommandGlows.
- Central provider events: `POST /api/commerce/webhooks/stripe` on CommandGlows.

## Configuration Contract

- CommunityGlows server configuration names the central suite bridge and the
  non-secret CommunityGlows public origin used for success/cancel redirects.
- Stripe secret key, webhook secret, API version, Product IDs, and Price IDs
  remain server-only in CommandGlows.
- The central offer registry must map `communityglows/lifetime_deal` or its
  approved replacement to `productId=communityglows`, its approved `planId`,
  and an environment-backed Stripe Price ID key.
- No price amount is defined here. Missing approved Price ID configuration makes
  checkout unavailable.

## Identity And Checkout Flow

1. The user authenticates in CommunityGlows.
2. The CommunityGlows Convex adapter requests a short-lived,
   audience/product-bound signed checkout handoff from the central suite bridge.
3. The adapter posts the allowlisted offer and opaque handoff to the central
   checkout, then returns only the final Stripe URL to the client.
4. CommandGlows verifies signature, expiry, audience, environment, and
   offer/product compatibility, then derives the canonical global identity.
5. Stripe Checkout explicitly uses Managed Payments.
6. Only a verified signed Stripe webhook can create or change the Convex paid
   entitlement.
7. CommunityGlows refreshes its suite snapshot; a success redirect alone never
   unlocks access.

If a public site visitor is not authenticated, the CTA leads into this
authenticated product flow. Email-only checkout correlation and raw
client-provided global user IDs are forbidden.

## Invariants

- Active provider allowlist: exactly `stripe`.
- Lemon Squeezy and Polar events are rejected or non-granting
  `pending_review`; there is no fallback provider order.
- Convex remains the durable access authority.
- CommunityGlows stores no Stripe secret and exposes no local payment webhook.
- Refunds, disputes, revokes, and fraud transitions are non-granting and do not
  reset the three-cycle trial allowance.
- The public checkout redirect is UX only, never entitlement proof.

## Failure Modes

- Missing Price ID or Stripe server configuration -> checkout unavailable;
  never invent a price or fallback provider.
- Invalid/expired/mismatched handoff -> reject checkout creation.
- Invalid, malformed, replayed, unknown, or non-Stripe event -> no access grant.
- Delayed webhook -> show pending/retry state and keep protected access closed.
- Central bridge unavailable -> retain only the documented bounded recovery
  grace; do not create local paid state.

## Validation

Local implementation proof must cover offer mapping, signed identity handoff,
Stripe-only provider eligibility, exact-body webhook verification, paid/refund/
dispute normalization, replay idempotency, Convex forwarding, client refresh,
and fail-closed UI. Run CommunityGlows billing/composable/type checks and site
build plus the central CommandGlows commerce/bridge suites.

Hosted Stripe/Convex, provider account, deployment, and Windows/Android device
proof are explicitly deferred to a later authorized chantier.

## Reader Checklist

- Checkout CTA changed -> verify it enters the authenticated signed-handoff flow.
- Offer changed -> verify approved internal IDs and environment Price ID key;
  never add an amount here.
- Billing/access client changed -> verify Convex remains authoritative and
  non-Stripe inputs stay non-granting.
- Hosted proof starts -> apply the Freshness Gate against current official
  Stripe Managed Payments eligibility, API, pricing, and webhook docs.

## Maintenance Rule

Update this note when CommunityGlows offer mapping, checkout entry, signed
handoff, entitlement refresh, Stripe-only enforcement, or hosted proof status
changes.
