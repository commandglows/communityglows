# CommunityGlows Site

Marketing site for CommunityGlows, built with Astro.

## Environment

Copy `.env.example` and override these values when the domains change:

```bash
PUBLIC_SITE_URL=https://communityglows.com
PUBLIC_APP_URL=https://communityglows.com/download
PUBLIC_EMAIL_DOMAIN=communityglows.com
```

All canonicals, structured data URLs, and marketing CTA links read from these variables through `src/config/site.ts`.

Without `PUBLIC_APP_URL`, acquisition CTAs use `/download` or `/fr/download` for the current language. A custom override must lead to a working acquisition destination, never the site home or a retired repository. Purchase and purchase-return buttons use the installed-app billing deep link separately.

## Windows launch content

Windows is the current public preview download. Other targets must not be advertised as publicly available without a verified distribution URL. Features present in source do not establish inclusion in the downloadable installer. Release-gating evidence is recorded in `../shipglows_data/editorial/windows-launch-readiness.md`.

The newsletter remains a planned launch feature, using the approved CommandGlows-owned consent/subscription system and Postmark transport. Signup is not operational yet: the section currently states this explicitly and links to release notes. Do not wire it to the legacy CommandGlows Resend signup (different audience and welcome content), invent a new contact store, or expose transport credentials in Astro public variables. Help is available at `/help` and `/fr/help`, with buyer activation guidance at `#activation`. Blog translations use declared article peers rather than generated `/fr/blog/...` URLs.

After building, run `node scripts/check-launch.mjs` to check generated internal links, anchors, headings, locale alternates and retired placeholders.

### Checkout and payment flow

- Public purchase CTAs use `communityglows://app/billing` to enter the
  authenticated app flow.
- The static site never creates an unsigned checkout and owns no Stripe secret,
  Price ID, SDK, or webhook.
- The authenticated app obtains a server-side signed handoff and opens the
  central Stripe checkout. A return page alone never grants access.

Required result pages:

- `/purchase/success`
- `/purchase/cancel`

These pages keep the buyer on the public site and point to support/app activation guidance.

## Observability

Sentry is not required for this site while it remains a static marketing/content surface with no authentication or user-specific runtime workflow.

Add Sentry before introducing authentication, account state, protected routes, checkout/payment flows, server-handled form submissions, or other runtime behavior where a user action can fail outside the build/deploy pipeline.

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm ci`                  | Installs locked dependencies                     |
| `npm audit --json`        | Checks npm dependencies for known advisories     |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
