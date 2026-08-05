---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.2.0"
project: socialglowz
created: "2026-08-03"
created_at: "2026-08-03 10:35:20 UTC"
updated: "2026-08-05"
updated_at: "2026-08-05 00:00:00 UTC"
status: draft
source_skill: 100-sg-spec
source_model: GPT-5 Codex
scope: communityglows-cross-surface-rename
owner: Diane
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
user_story: "En tant qu'opératrice de CommunityGlows, je veux remplacer complètement SocialGlowz par CommunityGlows et communityglows.com sur toutes les surfaces, car aucun utilisateur ni donnée de production ne doit être migré ou préservé."
linked_systems:
  - README.md
  - AGENTS.md
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
depends_on:
  - artifact: "shipglows_data/business/product.md"
    artifact_version: "1.0.1"
    required_status: reviewed
  - artifact: "shipglows_data/business/branding.md"
    artifact_version: "1.0.0"
    required_status: active
  - artifact: "shipglows_data/technical/context.md"
    artifact_version: "1.4.0"
    required_status: reviewed
supersedes: []
evidence:
  - "Operator decision on 2026-08-03: product name selected as CommunityGlows."
  - "Operator decision on 2026-08-03: canonical domain purchased as communityglows.com."
  - "Operator decision on 2026-08-05: no users exist; do not preserve or migrate anything."
  - "Repository scan found active product, domain, package, route, deep-link, auth, billing, native, CI, site and documentation references to SocialGlowz."
next_step: "/101-sg-ready communityglows-cross-surface-rename"
---

# CommunityGlows Cross-Surface Rename

## Title

Replace SocialGlowz with CommunityGlows everywhere in the active product, including public identity, source namespaces, native identifiers, deep links, auth hosts, billing identifiers, CI artifacts and documentation.

## Status

Draft updated after the explicit clean-break decision. No implementation has started.

## User Story

En tant qu'opératrice, je veux une nouvelle première installation appelée CommunityGlows, reliée à `communityglows.com`, sans dette de compatibilité SocialGlowz.

Il n'existe aucun utilisateur ni donnée de production à migrer. Une ancienne installation de développement peut être désinstallée et son stockage local supprimé.

## Minimal Behavior Contract

Toutes les surfaces actives utilisent `CommunityGlows`, `communityglows.com`, le schéma `communityglows://`, les identifiants techniques `communityglows` et les namespaces `com.communityglows.*`.

Aucune ancienne valeur `SocialGlowz`, `socialglowz`, `socialglowz.com`, `socialglowz://`, ancien callback, ancien product ID, ancienne clé locale ou ancien package ne doit être acceptée comme compatibilité runtime.

## Success Behavior

- Site, app, extension, desktop, Android, auth, billing, emails, CI, releases et documentation actives affichent CommunityGlows.
- Les dossiers, routes, imports, modules, événements, classes CSS et clés de stockage spécifiques à l'ancien produit sont renommés ou supprimés.
- Le domaine canonique, les callbacks et les liens publics utilisent `communityglows.com`.
- Les nouvelles builds sont identifiées par `com.communityglows.desktop` et `com.communityglows.webview` lorsque les contrats de build le permettent.
- Convex et le bridge d'entitlements utilisent `communityglows`, les variables `COMMUNITYGLOWS_*` et l'offre `communityglows/lifetime_deal`.
- L'ancienne donnée locale n'est pas lue : l'app démarre sur un état vierge.

## Error Behavior

- Tout ancien deep link, callback host, route ou identifiant est rejeté explicitement, sans mutation d'auth, de session ou de stockage.
- Un scan de source/build échoue dès qu'une ancienne référence active non historique est détectée.
- Une configuration externe non encore renommée bloque la readiness ; elle ne reçoit pas de fallback silencieux.

## Problem

Le dépôt expose encore SocialGlowz sur de nombreuses surfaces. Comme aucun utilisateur n'existe, préserver les anciens contrats créerait une complexité inutile et laisserait deux identités en circulation.

## Solution

Effectuer un renommage complet et destructif des contrats produit. Réinitialiser les données locales de développement, remplacer les identifiants techniques et mettre à jour les configurations externes avant la première distribution CommunityGlows.

## Scope In

- Marque et domaine : `CommunityGlows`, `communityglows.com`.
- Vue, routes, imports, stores, modules, événements, classes CSS, clés locales et textes.
- Site Astro, SEO, JSON-LD, Open Graph, RSS, robots, emails, politiques, blog et liens de téléchargement.
- Manifestes Chrome/Firefox, extension IDs visibles, setup, popup, options et side panel.
- Tauri : `productName`, identifier, fenêtre, tray/menu, backup filenames, deep links et callbacks.
- Android : namespace, package/plugin registration, labels et documentation.
- Convex Auth, URLs de callback, product/offer IDs, bridge paths, headers, secrets et scripts d'activation.
- CI, releases, artefacts, package names, variables d'environnement et documentation active.
- Réinitialisation/suppression du stockage local de développement et régénération des artefacts.

## Scope Out

- Aucune compatibilité, migration, alias, redirection ou double lecture SocialGlowz.
- Aucune conservation des anciennes installations, sessions, profils, backups, settings, entitlements ou codes d'activation.
- Aucun changement fonctionnel vers les trois piliers, les connecteurs API ou une nouvelle feature produit.
- Aucune réécriture des archives historiques `shipglows_data/workflow/archives/`, qui restent des preuves historiques et non une surface active.
- Aucun changement de logo, palette ou design system au-delà des libellés nécessaires.
- Le renommage du chemin de workspace Git local et du remote GitHub est une opération opérateur séparée ; les liens actifs devront néanmoins viser le dépôt CommunityGlows cible.

## Constraints

- Une seule source de vérité publique : CommunityGlows / communityglows.com.
- Aucun ancien identifiant ne doit rester un contrat runtime.
- Les nouvelles URLs, secrets, callbacks et identifiants doivent être configurés avant toute publication.
- Les docs actives décrivent le nouvel état ; les archives ne sont pas modifiées.
- Les règles de sécurité OAuth, scopes et permissions ne sont pas élargies.
- Les docs officielles actuelles de Tauri, Android, Convex, Chrome et Firefox doivent être revalidées avant de changer leurs identifiants externes.

## Test Contract

- Scan strict des occurrences anciennes dans le code, les builds, les manifestes, le site et les docs actives, avec allowlist limitée aux archives et à cette spec.
- Typecheck Vue/TypeScript, tests Convex/billing, Vitest deep links, build Astro, lint manifestes, `cargo check` et build Android si disponibles.
- Vérification que `communityglows.com`, `communityglows://`, `com.communityglows.*`, `communityglows` product ID et `COMMUNITYGLOWS_*` sont utilisés partout.
- Vérification que toute ancienne route, callback, clé locale et valeur billing est rejetée ou absente.
- Test sur état local vide, sans migration ni reprise de session.
- Preuve des configurations DNS/TLS, Convex, bridge, stores, CI et emails avant release.

## Dependencies

- DNS/TLS/hosting et emails de `communityglows.com`.
- Configuration Convex Auth et variables de déploiement.
- Tauri deep-link, package/update rules et plugin Android.
- Chrome Web Store, Firefox Add-ons, GitHub Releases et secrets CI.
- WinFlowz bridge et ledger d'entitlements à renommer de `socialglowz` vers `communityglows`.

## Invariants

- Une seule identité active : CommunityGlows.
- Aucun ancien chemin de compatibilité dans le runtime.
- Les frontières WebView, permissions et scopes sociaux restent inchangées.
- Les secrets ne sont jamais ajoutés aux logs, docs ou artefacts.
- Les archives historiques restent non modifiées.

## Links & Consequences

- `SocialGlowz` → `CommunityGlows` sur toutes les surfaces actives.
- `socialglowz.com` → `communityglows.com` sans obligation de redirect.
- `socialglowz://` → `communityglows://` sans dual scheme.
- `com.socialglowz.*` → `com.communityglows.*` ; les builds anciennes sont abandonnées.
- Product ID, offer ID, bridge path, headers et variables serveur sont recréés sous `communityglows`.
- Une installation de développement doit être désinstallée/réinitialisée avant validation.

## Documentation Coherence

- Mettre à jour README, AGENTS/CLAUDE actifs, business docs, technical context/function tree, docs éditoriales, release docs et site.
- Ne pas réécrire `shipglows_data/workflow/archives/`.
- Documenter explicitement le clean break et l'absence de migration, sans présenter les anciens identifiants comme supportés.

## Edge Cases

- Une ancienne app ou un ancien deep link doit échouer proprement, sans ouvrir CommunityGlows par alias.
- Un callback reçu sur `socialglowz.com` doit être rejeté.
- Un stockage local contenant `sfz_*` ou une ancienne clé doit être ignoré ; l'état neuf est la réponse attendue.
- Un ancien entitlement ou code `socialglowz` doit être considéré invalide dans le nouvel environnement.
- Les mentions historiques dans les archives ne doivent pas déclencher un faux échec du scan actif.

## Implementation Tasks

- [ ] Tâche 1 : établir la matrice des occurrences et l'allowlist limitée aux archives.
- [ ] Tâche 2 : mettre à jour les docs canoniques et la configuration de marque.
- [ ] Tâche 3 : renommer `src/ui/setup/pages/SocialGlowz/`, routes, imports, types et modules.
- [ ] Tâche 4 : renommer les deep links, événements, stores, clés locales, classes CSS et copy runtime.
- [ ] Tâche 5 : renommer Tauri, le plugin Android, les namespaces, packages et artefacts natifs.
- [ ] Tâche 6 : renommer site, domaine canonique, SEO, callbacks, emails et liens publics.
- [ ] Tâche 7 : renommer Convex Auth, billing, bridge, offer ID, headers, secrets et scripts.
- [ ] Tâche 8 : renommer manifestes, CI, releases, package names et documentation active.
- [ ] Tâche 9 : supprimer/réinitialiser les données locales de développement et régénérer les builds.
- [ ] Tâche 10 : exécuter la validation stricte et documenter les blocages externes restants.

## Acceptance Criteria

- [ ] CA1 : aucun nom, domaine, scheme, callback, clé locale, product ID, package ou namespace SocialGlowz n'est utilisé par une surface active.
- [ ] CA2 : les surfaces publiques et les builds affichent CommunityGlows et pointent vers communityglows.com.
- [ ] CA3 : `communityglows://` et les callbacks CommunityGlows fonctionnent ; les anciennes valeurs sont rejetées.
- [ ] CA4 : le site, l'app, les extensions, Tauri, Android, Convex, billing et CI passent le scan strict.
- [ ] CA5 : une installation neuve démarre avec un stockage vide et aucune migration implicite.
- [ ] CA6 : les tests et builds requis passent, ou chaque limite d'environnement/externe est explicitement listée.
- [ ] CA7 : les archives historiques restent intactes et exclues du scan de surface active.

## Test Strategy

1. Scan strict source/docs/builds avec allowlist minimale.
2. Typecheck, tests ciblés, build site, manifestes, Rust et Android.
3. Validation navigateur de communityglows.com et des métadonnées rendues.
4. Smoke tests extension, desktop, Android, auth, billing et deep links sur installation neuve.
5. Revue finale des configurations externes et des artefacts de release.

## Risks

- Élevé : changement d'identifiants natifs et de package ; les anciennes installations ne seront plus supportées.
- Élevé : callbacks ou bridge non configurés ; la première release doit attendre leur configuration.
- Élevé : erreurs de product ID ; le nouvel environnement billing doit être vérifié avant toute vente.
- Moyen : occurrences oubliées dans des artefacts générés, emails ou docs actives.
- Faible : confusion entre références historiques et surfaces actives ; l'allowlist doit rester minimale.

## Execution Notes

- Lire `README.md`, `AGENTS.md`, `shipglows_data/technical/context.md` et `context-function-tree.md` avant implémentation.
- Utiliser des renommages ciblés (`git mv`/patch), jamais un remplacement aveugle dans les archives.
- Revalider les contrats externes avec leurs documentations officielles actuelles.
- Ne pas prétendre que le domaine, les callbacks, les stores ou le bridge sont prêts avant preuve réelle.
- L'implémentation locale a commencé : les chemins, contrats et surfaces actives sont renommés ; la configuration externe et la preuve native restent à finaliser.

## Open Questions

Aucune question produit. Restent des actions opérateur : confirmer le dépôt GitHub cible, configurer DNS/TLS/email, recréer les secrets/produits du bridge et publier les nouveaux identifiants stores.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
| --- | --- | --- | --- | --- | --- |
| 2026-08-03 10:35 UTC | 100-sg-spec | GPT-5 Codex | Création de la spec initiale. | draft | clean-break revision |
| 2026-08-05 | 100-sg-spec | GPT-5 Codex | Révision selon la décision explicite de ne rien conserver. | draft | 101-sg-ready |
| 2026-08-05 | 001-sg-build / sg-development | GPT-5 Codex | Renommage local des surfaces actives, contrats runtime, chemins source, site, billing et documentation ; preuves locales exécutées. | partial | configuration externe et preuve native |

## Current Chantier Flow

100-sg-spec ✅ → 101-sg-ready ✅ → 102-sg-start partial → 103-sg-verify pending → 104-sg-end not started → 005-sg-ship not started
