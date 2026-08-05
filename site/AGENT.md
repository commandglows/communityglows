---
artifact: documentation
metadata_schema_version: "1.0"
artifact_version: "1.2.0"
project: "tubeflow-site"
created: "2026-04-26"
updated: "2026-08-05"
status: "reviewed"
source_skill: "300-sg-docs"
scope: "file"
owner: "Diane"
confidence: "high"
risk_level: "low"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "TubeFlow app"
  - "Astro"
  - "Tailwind CSS"
  - "Sentry"
depends_on: []
supersedes: []
evidence:
  - "README.md"
  - "package.json"
  - "src/config/site.ts"
  - "src/layouts/Layout.astro"
  - "src/pages/index.astro"
  - "src/pages/fr/index.astro"
  - "/home/claude/shipflow/skills/references/sentry-observability.md"
next_step: "npm run build"
---

# AGENT

## Purpose

This repository is the public marketing site for TubeFlow. It is an Astro site with static pages for acquisition, SEO, pricing, product education, and a small blog.

## Working assumptions

- The site is content-first and mostly static.
- Primary conversion targets point to the TubeFlow app, usually `appUrl('/videos')`.
- The codebase does not include the product app itself; it only links to it.
- Route copy and structured data matter as much as visuals because this repo is SEO-facing.
- Sentry is intentionally not required while this remains a static marketing/content site with no authentication or user-specific runtime workflow.

## Stack

- Astro 6
- Tailwind CSS 4
- TypeScript
- Markdown blog content via `astro:content`
- Minimal client-side JavaScript embedded in Astro templates

## Core entrypoints

- `src/pages/index.astro`: English landing page assembled from shared, locale-aware components
- `src/pages/fr/index.astro`: French landing page assembled from the same shared, locale-aware components
- `src/pages/features.astro`: feature marketing page
- `src/pages/pricing.astro`: pricing and FAQ page
- `src/pages/compare.astro`: comparison page positioning TubeFlow against YouTube
- `src/pages/blog/index.astro`: blog listing
- `src/pages/blog/[slug].astro`: blog article route
- `src/pages/blog/feed.xml.ts`: RSS feed
- `src/layouts/Layout.astro`: global SEO shell, fonts, JSON-LD injection, reduced-motion handling, and reveal/scroll behavior
- `src/config/site.ts`: canonical site/app URL helpers and contact email composition

## Agent guidance

- Treat `src/config/site.ts` as the source of truth for public URLs and email domain.
- Preserve canonical URLs, `hreflang`, Open Graph tags, and JSON-LD when editing pages.
- Do not add Sentry browser instrumentation just to satisfy the monorepo observability default while the site remains static.
- Add Sentry, or revisit this exception, as soon as the site gains authentication, account state, protected routes, checkout/payment flows, form submissions with server handling, or other user-specific runtime behavior.
- Keep English and French experiences aligned through the shared landing component tree and locale dictionaries in `src/i18n/`.
- Blog content lives in `src/content/blog/*.md` and must satisfy the schema in `src/content.config.ts`.
- Prefer editing shared components when changing either homepage, and update both locale dictionaries when copy changes.
- Expect some marketing claims to be copy assumptions unless they are traceable to the product app.

## Commands

- `npm run dev`: local development
- `npm run build`: production build
- `npm run preview`: local preview of the build

## Known risks for future agents

- French and English copy can still drift when locale dictionaries are updated independently; review both locales together.
- Many conversion links assume `/videos` is the stable app entrypoint.
- Pricing, feature, and security claims are marketing copy in this repo; verify them against the product before strengthening them.
