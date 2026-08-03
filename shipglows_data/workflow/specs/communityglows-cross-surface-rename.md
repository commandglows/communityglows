---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: socialglowz
created: "2026-08-03"
created_at: "2026-08-03 10:35:20 UTC"
updated: "2026-08-03"
updated_at: "2026-08-03 10:35:20 UTC"
status: draft
source_skill: 100-sg-spec
source_model: GPT-5 Codex
scope: communityglows-cross-surface-rename
owner: Diane
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
user_story: "En tant qu'utilisatrice de CommunityGlows, je veux retrouver le nouveau nom et le domaine communityglows.com sur toutes les surfaces publiques, web, extension, desktop, Android, auth et documentation, afin d'avoir une identité cohérente sans perdre mes sessions, accès, liens existants ni mises à jour d'application."
linked_systems:
  - README.md
  - AGENT.md
  - CLAUDE.md
  - src/ui/setup/pages/SocialGlowz/
  - src/lib/socialGlowzDeepLinks.ts
  - src-tauri/tauri.conf.json
  - src-tauri/src/lib.rs
  - src-tauri/plugins/android-webview/
  - convex/auth.config.ts
  - convex/billing.ts
  - site/
  - .github/workflows/
  - shipglows_data/business/
  - shipglows_data/technical/
  - shipglows_data/editorial/
depends_on:
  - artifact: "shipglows_data/business/product.md"
    artifact_version: "1.0.1"
    required_status: reviewed
  - artifact: "shipglows_data/business/branding.md"
    artifact_version: "1.0.0"
    required_status: active
  - artifact: "shipglows_data/business/gtm.md"
    artifact_version: "1.0.1"
    required_status: reviewed
  - artifact: "shipglows_data/technical/context.md"
    artifact_version: "1.2.0"
    required_status: reviewed
  - artifact: "shipglows_data/technical/design-system-authority.md"
    artifact_version: "1.0.0"
    required_status: draft
supersedes: []
evidence:
  - "Operator decision on 2026-08-03: product name selected as CommunityGlows."
  - "Operator decision on 2026-08-03: canonical domain purchased as communityglows.com."
  - "README.md defines extension, desktop, Android and planned iOS delivery surfaces."
  - "shipglows_data/technical/context.md defines Convex Auth, Tauri deep links, WebView sessions, sync and billing boundaries."
  - "shipglows_data/workflow/repurpose-packs/2026-08-03-verbatim-socialglowz-renaming.md preserves the naming decision conversation."
  - "shipglows_data/workflow/explorations/2026-08-03-social-platform-compliant-product-directions.md defines the Community Relationship OS direction and preserved platform boundaries."
  - "Repository scan on 2026-08-03 found active product, domain, package, route, deep-link, auth, billing, native, CI, site and documentation references to SocialGlowz."
next_step: "/101-sg-ready communityglows-cross-surface-rename"
---

# CommunityGlows Cross-Surface Rename

## Title

Rename the product from SocialGlowz to CommunityGlows across every user-visible and release-facing surface, with compatibility aliases for existing users and stable internal identifiers.

## Status

Draft spec created from the operator's confirmed product-name and domain decision. No implementation has started.

## User Story

En tant qu'utilisatrice de CommunityGlows, je veux voir et utiliser le nom CommunityGlows et le domaine communityglows.com sur le site, dans l'application, les extensions, les builds desktop/mobile, l'authentification, les emails et les documents actuels, afin que la marque soit cohérente et que le passage depuis SocialGlowz ne casse ni mes données, ni mes sessions, ni mes accès, ni les mises à jour installées.

Acteurs secondaires : opératrice du produit, utilisateurs d'une ancienne version SocialGlowz, services Convex/Auth, WinFlowz entitlement bridge, stores d'extensions, GitHub Releases, CI et hébergeur du site.

Déclencheur : une version rebrandée est construite ou un visiteur ouvre communityglows.com, une route d'authentification, un deep link ou un lien public CommunityGlows.

Résultat observable : les surfaces actives affichent CommunityGlows, utilisent communityglows.com comme URL canonique, produisent les nouveaux artefacts de release et conservent les anciens points d'entrée nécessaires à la migration.

## Minimal Behavior Contract

Quand une surface publique, une build, une route d'authentification, un lien applicatif, un email ou une documentation actuelle expose l'ancien nom, elle doit exposer CommunityGlows et, quand elle concerne le web public, communityglows.com comme destination canonique. Les anciens liens, schémas et identifiants indispensables à la compatibilité doivent continuer à être acceptés ou redirigés pendant la transition, sans créer une seconde source de vérité, un nouveau produit d'entitlement ou une fusion silencieuse de comptes. Si un alias ancien ne peut pas être conservé, la surface doit échouer par un message explicite et récupérable ; l'edge case principal est de ne pas renommer les identifiants techniques persistants au point de casser les mises à jour natives, les accès payants, les sessions ou les données existantes.

## Success Behavior

- Le site public, les métadonnées SEO, les emails de contact, les pages de politique et les CTA utilisent CommunityGlows et communityglows.com.
- L'application Vue, les pages popup/options/side panel/setup, les titres, menus, onboarding, erreurs et paramètres affichent CommunityGlows.
- Les builds Chrome, Firefox, desktop, Android et les artefacts CI/release portent CommunityGlows dans leurs noms visibles.
- Les routes internes et fichiers source sont alignés sur le nouveau nom lorsque cela ne modifie pas un contrat externe ; les routes et imports historiques nécessaires restent aliasés de manière explicite.
- `socialglowz.com` reste accepté comme callback/auth alias pendant la migration si le domaine est contrôlé ; communityglows.com devient le callback et domaine canonique.
- Les liens `socialglowz://` restent acceptés par les applications déjà distribuées ; `communityglows://` est ajouté pour les nouvelles installations si Tauri permet la double déclaration.
- L'identifiant Tauri/package Android, le product ID d'entitlement `socialglowz`, les noms d'environnement serveur et les chemins de bridge restent stables dans cette migration, avec des alias de code et une documentation de compatibilité plutôt qu'une rupture de données.
- Les données locales, profils, sessions WebView, settings Convex, entitlements et codes d'activation restent lisibles sans migration destructive.

## Error Behavior

- Une route legacy non migrable retourne une redirection ou une page d'upgrade explicite vers communityglows.com ; elle ne boucle pas et ne mélange pas les domaines.
- Un callback OAuth provenant d'un domaine non allowlisté est rejeté comme aujourd'hui, sans muter l'état d'authentification, et le domaine manquant est signalé dans les diagnostics sans secret ni token.
- Une migration de clé locale échoue de façon non destructive : la clé ancienne reste lisible, la nouvelle valeur n'est écrite qu'après validation, et aucune session, préférence ou entitlement n'est supprimé.
- Une build qui contient encore une mention publique SocialGlowz échoue au scan de rebranding, sauf si la mention est explicitement classée `legacy-compatibility`, `historical-record` ou `stable-technical-id` dans la liste de contrôle.
- Un checkout ou un bridge qui reçoit encore `socialglowz/lifetime_deal` continue de fonctionner ; aucune nouvelle offre ou ligne d'entitlement parallèle `communityglows/*` n'est créée dans cette tranche.
- Une URL ancienne non contrôlée par l'opérateur ne doit pas être présentée comme redirigeable ; le site CommunityGlows doit tout de même définir ses URLs canoniques et ses nouveaux liens.

## Problem

Le produit a changé de nom mais le dépôt contient encore des références SocialGlowz dans les surfaces publiques, le code partagé, les chemins Vue, l'authentification, les deep links, les builds natives, les workflows CI, le site marketing, le checkout, les emails, la documentation et les artefacts de support. Une substitution globale aveugle serait dangereuse : elle pourrait casser les updates Tauri/Android, les callbacks OAuth, les entitlements, les anciennes installations, les profils persistés et les liens déjà distribués.

## Solution

Appliquer le renommage dans l'ordre suivant : inventaire et classification des occurrences, contrat de compatibilité, surfaces runtime et source, site/domain/SEO/auth, build/release, documents canoniques et validation multi-plateforme. Utiliser CommunityGlows comme identité publique et conserver explicitement les identifiants stables `socialglowz` là où ils constituent un contrat de données, de bridge, de package, de scheme ou de déploiement.

## Scope In

- Nom public : `CommunityGlows` ; domaine canonique : `https://communityglows.com`.
- Site Astro : navigation, footer, titres, descriptions, JSON-LD, canonical/hreflang, RSS, robots, liens GitHub/download, pricing, checkout success/cancel, privacy, terms, blog et emails.
- App Vue : nom affiché, titres, onboarding, auth, settings, help/privacy/terms, erreurs, notifications, headers et textes i18n.
- Extension Chrome/Firefox : manifest display name/description, setup, popup, options, side panel, update/install pages, Firefox ID fallback visible et routes de lancement.
- Tauri desktop/mobile : product name, fenêtre, tray/menu/tooltip, release labels, deep-link schemes, OAuth callback hosts et public-facing diagnostics.
- Android plugin : labels et documentation publiques ; conservation contrôlée du namespace/package plugin natif pour la compatibilité des builds existantes.
- Source-facing rename des dossiers et symboles `SocialGlowz` quand il est sûr, notamment `src/ui/setup/pages/CommunityGlows/`, `CommunityGlows.vue`, le module de deep links et les imports associés.
- Auth/domain configuration : nouveaux hosts communityglows.com et conservation temporaire des hosts socialglowz.com selon le contrôle DNS/deployment.
- Billing/entitlement : affichage et documentation CommunityGlows, mais conservation du produit interne `socialglowz` et des contrats WinFlowz existants.
- CI/CD, artifact names, GitHub release labels, package/site names et variables publiques de build.
- Documentation canonique active et contenu public actuel.
- Scans, tests, checks, redirections, migrations de clés et preuves manuelles Chrome/Firefox/Windows/Android/site.

## Scope Out

- Changer le product ID durable `socialglowz` dans le ledger d'entitlements ou migrer les données Convex vers une nouvelle table.
- Changer immédiatement `com.socialglowz.desktop`, `com.socialglowz.webview`, les package IDs Android/iOS ou le chemin d'update natif ; une migration de package séparée nécessitera une spec dédiée.
- Supprimer les schémas `socialglowz://`, les callback hosts legacy, les alias de route ou les clés de stockage sans preuve de migration complète.
- Réécrire les archives, snapshots, anciennes specs, bugs, audits, changelogs historiques ou traces `socialflow` ; ils restent historiques et doivent être marqués comme tels si nécessaire.
- Ajouter les trois piliers futurs, les connecteurs API, un calendrier éditorial, une inbox ou un CRM ; cette spec ne fait que renommer les surfaces et aligner les promesses existantes.
- Changer le design system, les tokens, le logo ou la palette au-delà de l'adaptation nécessaire du nom ; toute évolution visuelle substantielle sera une spec/design séparée.
- Modifier les règles de WebView, les permissions sociales, les scopes OAuth ou les mécanismes de collecte de données tierces.

## Constraints

- Source de vérité produit : le nom public CommunityGlows et le domaine communityglows.com, avec `shipglows_data/business/branding.md`, `product.md`, `gtm.md` et le README alignés avant les surfaces dérivées.
- Source de vérité technique : les configs Vite/Tauri/manifest, Convex Auth, le bridge d'entitlements et les contrats de deep link existants.
- Les identifiants `socialglowz` conservés doivent être documentés comme compatibility IDs et ne doivent pas apparaître dans du copy public hors contexte de migration.
- Les événements, routes et schémas legacy ne peuvent être supprimés qu'après une preuve de compatibilité et une décision de retrait séparée.
- Les valeurs visuelles restent dans les carriers déclarés par `shipglows_data/technical/design-system-authority.md`; aucun hardcode visuel ne doit être ajouté pour le rebrand.
- Le nom du dépôt GitHub et les emails de domaine externes peuvent nécessiter une coordination opérateur ; la spec doit prévoir leurs nouveaux liens sans prétendre les avoir modifiés automatiquement.
- `fresh-docs checked` pour les contrats locaux et Tauri/Convex existants ; l'implémentation doit revalider les docs officielles actuelles de Tauri deep-link, Convex Auth domain, Chrome/Firefox manifest IDs et Android package/update rules avant de modifier ces contrats externes.

## Test Contract

- Surface profile : Vue 3 + Vite + Vue Router + Pinia + Astro + Tauri 2 + Rust + Kotlin Android plugin + Convex Auth/backend + Chrome/Firefox manifests + GitHub Actions.
- Automated proof : static identity scan avec allowlist, TypeScript/vue-tsc, Convex typecheck/tests, Vitest deep-link/storage/billing tests, Astro build, manifest lint, Rust check/build si toolchain disponible, Android/desktop CI build.
- Contract proof : vérifier les URLs canoniques, auth callback allowlists, old/new deep links, entitlement product ID, Tauri identifier, Android plugin registration et absence de duplication de produit.
- Browser proof : ouvrir communityglows.com, pages en/fr, pricing/checkout success/cancel, privacy/terms/help, route auth et liens download ; vérifier title, canonical, JSON-LD, Open Graph, email links et redirect behavior.
- Extension proof : charger les builds Chrome et Firefox, ouvrir popup/options/side panel/setup/update, lancer un réseau et vérifier qu'un ancien lien de setup ne casse pas.
- Native proof : installer un build Windows et Android, vérifier label, tray/menu, auth callback, `communityglows://` et `socialglowz://`, partage Android, profils, sessions et backup filenames.
- Manual checklist : créer `shipglows_data/workflow/test-checklists/communityglows-cross-surface-rename.md` pendant l'implémentation, avec preuve horodatée par surface.
- Observability : préserver les diagnostics existants ; si une surface runtime expose des logs, les entêtes de diagnostics doivent rester identifiables par commit/build et dates Paris/UTC. Aucun nouveau Sentry setup n'est requis par un renommage statique ; les erreurs auth/deep-link doivent rester visibles et redacted.

## Dependencies

- DNS, TLS, hosting et redirect configuration pour `communityglows.com` et, si disponible, `socialglowz.com`.
- Convex Auth `CONVEX_SITE_URL` et allowlists/deployment configuration.
- Tauri deep-link plugin 2.10.1 et les règles de package/update des builds natives.
- Chrome/Firefox extension manifest rules and store metadata.
- WinFlowz suite bridge et son contrat de product/offer ID `socialglowz/lifetime_deal`.
- GitHub repository/releases, CI secrets and Doppler runtime configuration.
- Local governance docs listed in `depends_on`; versions above are the evidence available at spec creation time.

## Invariants

- Une seule identité publique canonique : CommunityGlows / communityglows.com.
- Une seule source de vérité des données et entitlements ; aucun nouveau ledger CommunityGlows parallèle.
- Les profils, sessions WebView, settings, tâches, backups, comptes et accès existants restent accessibles.
- Les plateformes tierces restent manipulées selon les frontières publiques existantes : pas de scraping, injection fonctionnelle, consentement automatisé ou contournement.
- Les permissions, scopes OAuth et sécurité des callbacks ne sont pas élargis par le renommage.
- Les anciennes installations natives peuvent recevoir une mise à jour et les anciens liens utiles restent récupérables pendant la transition.
- Les routes, tests et erreurs restent déterministes et ne dépendent pas d'une chaîne de marque non validée.

## Links & Consequences

- Before → after : `SocialGlowz` / `socialglowz.com` comme identité publique → `CommunityGlows` / `communityglows.com` comme identité canonique.
- Before → after : app source `SocialGlowz` → source `CommunityGlows` quand le renommage est interne et sans contrat externe.
- Preserved downstream : `socialglowz` product ID, `com.socialglowz.*` native IDs, `socialglowz://`, legacy auth host, environment/bridge keys and historical records.
- User journey affected : découverte du site → téléchargement/installation → auth → ouverture d'un réseau/profil → settings/billing → support/recovery.
- Critical moments : premier chargement du nouveau domaine, callback auth, première mise à jour native, ouverture d'un ancien deep link, lecture d'un entitlement existant.
- SEO consequence : canonical, sitemap, robots, hreflang, RSS, JSON-LD, Open Graph and old-domain redirect must be coherent or search engines may split authority.
- Auth consequence : domain allowlist and callback host changes must be deployed before links are advertised; rejected callbacks must not mutate auth state.
- Data consequence : persisted local keys and Convex records must remain readable; display-only renames must not be used as data migration keys.
- Release consequence : changing native identifiers is a separate migration; the first CommunityGlows build must remain an update-compatible build.
- Documentation consequence : active docs must say CommunityGlows; historical evidence must remain truthful and untouched.

## Documentation Coherence

- Update canonical product/brand/GTM/technical docs: `README.md`, `AGENT.md`, `AGENTS.md`, `CLAUDE.md`, `shipglows_data/business/{product,business,branding,gtm,project-competitors-and-inspirations}.md`, `shipglows_data/technical/{context,context-function-tree,architecture,guidelines,extension-parity-map,public-webview-platform-boundary,android-webview-session-isolation,code-docs-map}.md`.
- Update current editorial/public docs and site content, including metadata, policy pages, FAQ, blog author/brand references, content map, public surface map and roadmap labels.
- Update current operational docs, test checklists and release instructions that describe the active product.
- Preserve archived snapshots, old specs, old bugs, historic audit logs and `socialflow` archive content; do not rewrite history to CommunityGlows.
- Add a short compatibility note documenting the stable internal IDs and the old-domain/deep-link transition, without exposing secrets or claiming legal trademark clearance.
- Update `shipglows_data/technical/design-system-authority.md` and `shipglows_data/business/branding.md` only for the brand identity/source names; do not introduce parallel token authorities.

## Edge Cases

- Existing Android/desktop installation must update rather than install as an unrelated second app.
- An old `socialglowz://app/open` link must still open the selected network/profile while a new `communityglows://app/open` link follows the same validation path.
- OAuth callback may arrive on old or new HTTPS host during rollout; both must be explicitly allowlisted only while controlled and required.
- An old extension setup route, Firefox fallback ID or Chrome side-panel path may be present in bookmarks or store packaging; preserve alias behavior where technically possible.
- A user may have localStorage, IndexedDB, backup files or persisted Pinia state keyed by old names; read/alias before writing new labels and never delete automatically.
- Existing purchase/entitlement events may contain `socialglowz`; they remain valid and must not be duplicated as `communityglows` events.
- A site page, sitemap, RSS link, email address or GitHub release URL can be missed by a source-only rename; validate rendered HTML and built artifacts, not only source grep.
- A historical document may contain SocialGlowz intentionally; scans must distinguish historical evidence from active product copy.
- A copied diagnostic, error message or support link must not leak tokens, cookies, private URLs or user content while changing brand labels.

## Implementation Tasks

- [ ] Tâche 1 : Establish the rename matrix and compatibility allowlist before editing.
  - Fichier : `shipglows_data/workflow/test-checklists/communityglows-cross-surface-rename.md`
  - Action : Classify every occurrence as `public-canonical`, `source-rename`, `legacy-compatibility`, `stable-technical-id`, `historical-record` or `third-party/archive`; record old value, new value, owner and proof.
  - User story link : prevents incomplete or destructive cross-surface rename.
  - Depends on : none.
  - Validate with : repository scan and checklist review.
  - Notes : Exclude `shipglows_data/workflow/archives/`, historic workflow records and prior specs from automatic replacement.

- [ ] Tâche 2 : Update canonical product and brand contracts.
  - Fichier : `README.md`, `shipglows_data/business/product.md`, `shipglows_data/business/business.md`, `shipglows_data/business/branding.md`, `shipglows_data/business/gtm.md`.
  - Action : Set CommunityGlows and communityglows.com as the public identity, document the product promise and compatibility ID policy.
  - User story link : establishes one public source of truth.
  - Depends on : Tâche 1.
  - Validate with : metadata lint, claim/brand scan and rendered copy review.

- [ ] Tâche 3 : Rename the main Vue source-facing surface and update imports/generated route types.
  - Fichier : `src/ui/setup/pages/SocialGlowz/` → `src/ui/setup/pages/CommunityGlows/`, `src/ui/setup/pages/SocialGlowz.vue` → `CommunityGlows.vue`, `vite.tauri.config.ts`, `tsconfig.typecheck.core.json`, `src/types/typed-router.d.ts` and affected imports.
  - Action : Rename internal source paths and symbols where safe; retain explicit old route aliases needed by extension bookmarks or generated router compatibility.
  - User story link : makes the application surface itself coherent.
  - Depends on : Tâche 1.
  - Validate with : typecheck, route generation, source scan and extension launch smoke.

- [ ] Tâche 4 : Align shared runtime copy, events and deep links.
  - Fichier : `src/components/AppHeader.vue`, `src/ui/common/pages/*.vue`, `src/ui/*/pages/*.vue`, `src/locales/{en,fr}.json`, `src/lib/socialGlowzDeepLinks.ts`, `src/stores/socialNetworks.ts`, affected tests.
  - Action : Rename public labels and source module to CommunityGlows; add new event/scheme constants while accepting legacy event names and URLs during transition.
  - User story link : keeps app UX and recovery paths consistent.
  - Depends on : Tâche 3.
  - Validate with : targeted Vitest deep-link/auth tests, source scan and manual extension/Tauri smoke.

- [ ] Tâche 5 : Update Tauri desktop/mobile public identity while preserving update/package contracts.
  - Fichier : `src-tauri/tauri.conf.json`, `src-tauri/src/lib.rs`, `src-tauri/src/backup.rs`, `src-tauri/plugins/android-webview/src/lib.rs`, Android metadata/proguard/build files.
  - Action : Change productName, window/tray/menu/tooltips, backup display filenames and callback labels to CommunityGlows; add `communityglows` scheme/host support; retain `com.socialglowz.*` identifiers and legacy `socialglowz` scheme.
  - User story link : preserves existing native users while presenting the new brand.
  - Depends on : Tâche 4.
  - Validate with : Rust check, Android compile/CI build, installed update test, old/new deep-link test and auth callback rejection test.

- [ ] Tâche 6 : Migrate site domain, public metadata, auth links and checkout-facing copy.
  - Fichier : `site/src/config/site.ts`, `site/src/layouts/Layout.astro`, `site/src/components/*`, `site/src/pages/*`, `site/src/content/*`, `public/robots.txt`, site env examples/config.
  - Action : Make communityglows.com canonical, update titles/copy/JSON-LD/OG/RSS/hreflang/emails/download links and add old-domain redirects only where DNS/hosting control is confirmed.
  - User story link : makes discovery, trust and support coherent.
  - Depends on : Tâche 2.
  - Validate with : Astro build, rendered HTML checks, canonical/redirect/browser proof and sitemap/robots inspection.

- [ ] Tâche 7 : Update Convex Auth, OAuth and runtime environment configuration.
  - Fichier : `convex/auth.config.ts`, `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json`, deployment configuration and `.env.example`.
  - Action : Add/activate communityglows.com as canonical auth site/callback domain and retain socialglowz.com only as a controlled migration alias; do not rename stable billing secrets/product IDs in the same change.
  - User story link : prevents login and callback breakage.
  - Depends on : Tâche 5 and Tâche 6.
  - Validate with : official auth callback smoke on old/new domains, rejected-host test, redacted env presence check and Convex typecheck.

- [ ] Tâche 8 : Align billing/entitlement code labels without changing durable product identity.
  - Fichier : `convex/billing.ts`, `convex/billing.test.ts`, `scripts/importSocialGlowzActivationCodes.ts`, related technical billing docs and package scripts.
  - Action : Rename public/admin function labels and docs where safe, retain aliases for existing Convex callers, preserve `socialglowz/lifetime_deal`, bridge paths, headers and secret names unless a separate migration contract exists.
  - User story link : preserves paid access and operator workflows.
  - Depends on : Tâche 2.
  - Validate with : billing tests, existing entitlement lookup/redeem/revoke/refund tests and bridge contract smoke.

- [ ] Tâche 9 : Update extension manifests, CI workflows, release artifacts and operator-facing active docs.
  - Fichier : `manifest*.config.ts`, `.github/workflows/*.yml`, `SHIPFLOW.md`, `ecosystem.config.cjs`, `site/package.json`, `site/package-lock.json`, active technical/editorial/workflow docs.
  - Action : Update display names, release labels, artifact labels, public package names and current instructions; retain technical IDs and historical artifact references explicitly.
  - User story link : makes every distribution surface recognizable as CommunityGlows.
  - Depends on : Tâche 3, Tâche 5 and Tâche 6.
  - Validate with : manifest lint, CI config scan, package lock consistency and built artifact inspection.

- [ ] Tâche 10 : Run cross-surface validation and document residual compatibility references.
  - Fichier : `shipglows_data/workflow/test-checklists/communityglows-cross-surface-rename.md`, `shipglows_data/technical/context.md`, `shipglows_data/technical/context-function-tree.md`, `shipglows_data/business/branding.md`.
  - Action : Execute automated, browser, auth, extension, desktop and Android proof; update the compatibility matrix and record any unverified external deployment step.
  - User story link : proves the rename is complete without masking migration risk.
  - Depends on : Tâches 1–9.
  - Validate with : complete Test Contract and final source/build artifact scan.

## Acceptance Criteria

- [ ] CA1 : Given a visitor opens `https://communityglows.com`, when the site renders, then title, visible brand, canonical URL, JSON-LD, Open Graph, sitemap/robots and contact links use CommunityGlows/communityglows.com.
- [ ] CA2 : Given a visitor opens a current French or English public page, when metadata and navigation are inspected, then no unclassified public SocialGlowz copy remains.
- [ ] CA3 : Given a user opens the Chrome popup, Firefox popup, options, Chrome side panel or setup/update surface, then the visible product name is CommunityGlows and the existing network launcher still works.
- [ ] CA4 : Given an existing user has SocialGlowz local state, profiles, settings, tasks, backup or sessions, when the CommunityGlows build starts, then data remains readable and no destructive reset occurs.
- [ ] CA5 : Given an old `socialglowz://app/open` link is received, when it contains a valid network and profile target, then it opens the same validated flow; given a new `communityglows://app/open` link, then it follows the same flow.
- [ ] CA6 : Given an OAuth callback arrives on a configured old or new allowed host, when state/nonce/TTL/replay checks pass, then auth continues; when any check fails, then auth state is unchanged and the error is recoverable/redacted.
- [ ] CA7 : Given an already installed Tauri/Android app updates, when the new artifact is installed, then it is recognized as the same app according to the preserved native identifiers and existing user data remains available.
- [ ] CA8 : Given an existing entitlement or activation code uses `socialglowz/lifetime_deal`, when CommunityGlows checks access, then the same access is returned without a duplicate product or second ledger.
- [ ] CA9 : Given a build or source scan finds SocialGlowz, when the occurrence is not classified as legacy compatibility, stable technical ID or historical record, then the check fails with the file and reason.
- [ ] CA10 : Given public WebView behavior is exercised after the rename, when a network is opened, then the existing no-scraping/no-functional-injection boundary remains unchanged.
- [ ] CA11 : Given the site and app are built, when typecheck/tests/build/manifest checks run, then they pass or report an explicit environment/external deployment limitation; no success claim hides missing native or DNS proof.
- [ ] CA12 : Given support or diagnostics copy is generated, when it is inspected, then it starts with the current build identity and Paris/UTC timestamps where the existing runtime contract requires it, and contains no secrets, cookies, tokens or private user data.

## Test Strategy

1. Automated static scan with a committed allowlist for public, source, legacy, stable and historical occurrences.
2. TypeScript/vue-tsc, Convex tests/typecheck, targeted deep-link/storage/billing tests, Astro build and Firefox manifest lint.
3. Rust/Tauri check and Android build through the existing CI workflow; preserve existing dependency/security checks.
4. Browser proof on communityglows.com for canonical metadata, redirects, auth entry, policy pages, pricing, downloads and bilingual routes.
5. Extension proof on Chrome and Firefox for popup, options, side panel, setup/update, network opening and old route fallback.
6. Native proof on Windows and Android for update compatibility, title/tray, auth callback, old/new scheme, shared URL/task flow, profile/session continuity and backup.
7. Review diff and scan historical/archive boundaries before readiness; unresolved DNS, store metadata or external auth configuration remains explicitly partial.

## Risks

- High: changing native identifiers or schemes can create a second app or break updates; preserved IDs and dual scheme testing are mandatory.
- High: changing auth callback domains without deploying Convex/hosting configuration first can lock users out; deployment order is part of the implementation.
- High: renaming billing product identifiers can orphan access; stable product/offer IDs remain unchanged in this spec.
- Medium: local persistence and generated typed routes can be missed by source-only replacement; migration aliases and built-artifact tests are required.
- Medium: old domain ownership, DNS and email forwarding are external facts; the spec does not claim redirects or mail delivery until verified.
- Medium: SEO can fragment between old and new domains; canonical, redirect, sitemap and Search Console/deployment proof must be checked.
- Low: historical documents may be incorrectly rewritten; archive and evidence boundaries are explicit.
- Low: design assets may contain baked-in SocialGlowz text not found by `rg`; visual asset inspection is required before release.

## Execution Notes

- Read first: `README.md`, `AGENT.md`, `shipglows_data/technical/context.md`, `src-tauri/tauri.conf.json`, `site/src/config/site.ts`, `convex/billing.ts`.
- Implement canonical contract/docs first, then source/runtime, then domain/auth, then CI/site/release labels, then proof.
- Use `git mv`/targeted edits for source directories; do not use blind global replacement across `shipglows_data/workflow/archives/`, old specs, bug reports, audit history, binary assets or stable IDs.
- Preserve `socialglowz` as a compatibility namespace until a separate product-ID/package migration is specified and verified.
- Before changing Tauri, Convex Auth, manifest IDs or Android package behavior, consult current official documentation and record the exact source/version in the implementation handoff (`fresh-docs checked`).
- Do not add a new design token or visual value. If logo/asset text requires a visual update, route the asset work through the declared design-system authority and run the design-system drift checks.
- Do not claim the new domain is live, old-domain redirectable, OAuth-configured, store-updated or email-deliverable until the corresponding external proof exists.
- Stop implementation and route to a separate spec if the operator requests changing the durable product ID, native package identifier, auth provider model, entitlement ledger or public WebView behavior.

## Open Questions

No product naming or scope question remains: CommunityGlows and communityglows.com are confirmed. The following are external rollout prerequisites, not reasons to invent a different product contract: confirm control of socialglowz.com for redirect/legacy callback use; configure DNS/TLS/hosting for communityglows.com; configure email forwarding for `support@`, `privacy@` and `legal@`; and confirm store/release metadata ownership. If an old domain cannot be controlled, keep the new site canonical and document the absence of redirect proof rather than simulating compatibility.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
| --- | --- | --- | --- | --- | --- |
| 2026-08-03 10:35 UTC | 100-sg-spec | GPT-5 Codex | Created the draft contract for the CommunityGlows cross-surface rename after repository inventory and product-direction review. | draft | 101-sg-ready |

## Current Chantier Flow

100-sg-spec ✅ → 101-sg-ready pending → 102-sg-start not started → 103-sg-verify not started → 104-sg-end not started → 005-sg-ship not started
