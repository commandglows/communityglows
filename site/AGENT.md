---
artifact: documentation
metadata_schema_version: "1.0"
artifact_version: "1.4.0"
project: "communityglows-site"
created: "2026-04-26"
updated: "2026-09-28"
status: "active"
source_skill: "300-sg-docs"
scope: "file"
owner: "Diane"
confidence: "high"
risk_level: "low"
security_impact: "no"
docs_impact: "yes"
linked_systems:
  - "CommunityGlows app"
  - "Astro"
  - "Tailwind CSS"
depends_on: []
supersedes: []
evidence:
  - "README.md"
  - "package.json"
  - "src/config/site.ts"
  - "src/layouts/Layout.astro"
  - "src/pages/index.astro"
  - "src/pages/fr/index.astro"
next_step: "npm run build"
---

# AGENT

## Purpose

This directory contains CommunityGlows’ public marketing site: an Astro site with English and French acquisition pages, product information, legal pages, and a blog. It links to the CommunityGlows app and downloads; it is not the app itself.

## Working assumptions

- The site is static-first and deployed through Vercel.
- Public site, app, and email URLs are defined in `src/config/site.ts` and configured through `PUBLIC_SITE_URL`, `PUBLIC_APP_URL`, and `PUBLIC_EMAIL_DOMAIN`.
- Canonical URLs, language alternates, Open Graph, JSON-LD, `robots.txt`, and `sitemap.xml` affect search and social sharing.
- Marketing, pricing, security, privacy, and availability claims must match current product behavior and documented proof.

## Stack and entrypoints

- Astro 7 with static output; Tailwind CSS 4 through Vite.
- `src/pages/` and `src/pages/fr/`: English and French public routes.
- `src/pages/blog/` and `src/content/blog/`: blog routes and articles.
- `src/layouts/Layout.astro`: shared metadata, canonical and language links, Open Graph, JSON-LD, fonts, motion, and accessibility shell.
- `src/config/site.ts`: public URL and contact-email helpers.
- `scripts/generate-sitemap.mjs`: sitemap generation from built canonical pages.
- `scripts/check-launch.mjs`: generated-route and SEO checks.

## Agent guidance

- Treat `src/config/site.ts` as the source of truth for public URLs.
- Preserve canonical URLs, only valid `hreflang` peers, Open Graph tags, and JSON-LD.
- Keep English and French experiences aligned; publish language alternates only where a paired route exists.
- Blog content in `src/content/blog/*.md` must satisfy `src/content.config.ts`.
- Verify product claims against the CommunityGlows app before strengthening public copy.
- Keep payment credentials, unsigned checkout creation, and app-only behavior out of this static site.

## Commands

- `npm run dev`: local development
- `npm run build`: build the site and generate its sitemap
- `npm run check:launch`: check generated routes, links, metadata, language alternates, robots, and sitemap
- `npm test`: run site unit tests
- `npm run preview`: preview the built site

## Known risks

- English and French pages can drift when updated independently; verify both versions together.
- A new route must be intentionally paired or left without `hreflang` alternates.
- Pricing, feature, and security claims must be checked against current product behavior before release.
