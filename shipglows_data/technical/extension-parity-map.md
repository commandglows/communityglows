---
artifact: documentation
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: "communityglows"
created: "2026-05-25"
updated: "2026-09-05"
status: active
source_skill: 102-sg-start
scope: extension-parity
owner: "Diane"
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
depends_on:
  - "shipglows_data/workflow/specs/extension-tauri-feature-parity.md"
supersedes: []
linked_systems:
  - "manifest.config.ts"
  - "manifest.chrome.config.ts"
  - "manifest.firefox.config.ts"
  - "src/platform/capabilities.ts"
  - "src/platform/webExtensionApi.ts"
  - "src/platform/extensionNetworkLauncher.ts"
  - "src/ui/action-popup/pages/index.vue"
  - "src/ui/side-panel/pages/index.vue"
  - "src/ui/options-page/pages/index.vue"
  - "src/ui/setup/pages/install.vue"
  - "src/ui/setup/pages/update.vue"
  - "src/ui/setup/pages/CommunityGlows.vue"
  - "src/content-script/index.ts"
  - "src/devtools/index.ts"
  - "src/offscreen/index.ts"
evidence:
  - "manifest.config.ts no longer injects content scripts or devtools by default."
  - "manifest.chrome.config.ts adds side_panel + sidePanel permission only for Chrome."
  - "manifest.firefox.config.ts keeps Firefox-compatible baseline without side panel fields."
  - "src/platform/extensionNetworkLauncher.ts enforces normalized HTTPS URLs and blocks embedded credentials."
  - "src/platform/webExtensionApi.ts centralizes browser-promise and chrome-callback compatibility for runtime, tabs, sidePanel, and storage APIs."
  - "Generated manifests require Chrome 116 for sidePanel.open and Firefox 142 for data_collection_permissions."
  - "ShipGlows Extension Lab loaded Chromium 153 with an observed worker and an error-free popup; Firefox Nightly 153 installed the temporary extension/background but its direct popup navigation timed out."
  - "Extension UI surfaces now render ExtensionParitySurface instead of scaffold/demo views."
next_step: "/103-sg-verify extension-tauri-feature-parity"
---

# Extension Parity Map

## Contract

Cette carte décrit la parité réelle entre la cible extension (Chrome/Firefox) et la cible native Tauri.

## Capability Matrix

| Capability | Tauri | Extension Chrome | Extension Firefox | Permissions / API | Notes |
|---|---|---|---|---|---|
| Social catalog launcher (`src/config/socialNetworks.ts`) | Native WebView open | Browser tab open (`tabs.create`) | Browser tab open (`tabs.create`) | `tabs` | URL validée/normalisée en HTTPS avant ouverture. |
| Custom links launcher | Native open via app shell | HTTPS-only + credentials blocked | HTTPS-only + credentials blocked | `tabs` | Rejette `javascript:`, `data:`, `file:`, `chrome:`, `moz-extension:` et `user:pass@`. |
| Toolbar launcher | N/A | Oui (`action` popup) | Oui (`action` popup) | `action` | Plus de scaffold UI. |
| Side panel launcher | N/A | Oui (Chrome uniquement) | Non | `sidePanel` (Chrome) | Firefox n’expose pas de promesse side panel. |
| Options/settings surface | N/A | Oui | Oui | `options_page`, `storage` | Contrôle profil, langue, thème, liens, limitations. |
| Browser API compatibility | N/A | Callback fallback (`chrome.*`) | Promise-first (`browser.*`) | `tabs`, `storage`, `runtime`, `sidePanel` | Un adaptateur typé unique normalise les erreurs et évite les appels dispersés. |
| Install/update setup flows | N/A | Oui (`/setup/install`, `/setup/update`, `/setup/CommunityGlows`) | Oui | `tabs` + background install/update tab | Routes orientées produit, pas de texte démo. |
| Native WebView orchestration | Oui | Non | Non | N/A | Dégradé explicite: onglets navigateur classiques seulement. |
| Per-profile native session isolation | Oui (Android/Tauri) | Non | Non | N/A | Dégradé explicite: pas d’isolation cookies/localStorage par profil en extension. |
| Native haptics + Android bottom bar | Oui | Non | Non | N/A | Dégradé explicite. |
| Native backup/restore (.sfbak, filesystem natif) | Oui | Non | Non | N/A | Dégradé explicite dans UI extension. |
| Global injected iframe on every site | N/A | Désactivé par défaut | Désactivé par défaut | Aucune `content_scripts` active | Le content script est neutre; pas d’injection globale active. |
| Devtools/offscreen scaffold | N/A | Non exposé en production | Non exposé en production | Pas de `devtools_page` active | Entrées conservées mais no-op/quarantaine. |

## Security Notes

- Le launcher extension est un boundary de sécurité: il n’ouvre que des URLs HTTPS validées.
- Les erreurs UI n’exposent pas de token/cookie/payload backup ni URL sensible complète.
- Le manifeste baseline retire les permissions non nécessaires (`background`, `sidePanel` hors Chrome).
- Les profils, liens et tâches de l'extension conservent leurs clés localStorage historiques. Chaque mutation acquiert un Web Lock commun à l'origine, relit le stockage, puis publie après succès. Les événements storage et un événement du document synchronisent les vues. L'adaptateur chrome.storage reste disponible pour les consommateurs historiques ; il n'est pas le stockage des liens actifs.
- Le background n'utilise aucun état global durable: son listener d'installation est enregistré synchroniquement et ses effets passent par l'adaptateur, ce qui reste compatible avec les redémarrages du worker MV3.

## Proof Path

- Tests ciblés:
  - `src/platform/capabilities.test.ts`
  - `src/platform/extensionNetworkLauncher.test.ts`
  - `src/platform/webExtensionApi.test.ts`
  - `src/platform/manifest.test.ts`
- Build/lint:
  - `pnpm test:once`
  - `pnpm typecheck:extension`
  - `pnpm test:extension`
  - `pnpm build:chrome`
  - `pnpm build:firefox`
  - `pnpm lint:manifest`
  - `s extension-inspect -ProjectPath <project> -Json`
  - `s extension-lab -ProjectPath <project> -Browser chromium -Headless -Json`
  - `s extension-lab -ProjectPath <project> -Browser firefox -Headless -Json`
  - `python3 /home/claude/shipflow/tools/shipflow_metadata_lint.py shipglows_data/technical/extension-parity-map.md`

## Correction de l'audit Chrome du 5 septembre 2026

Le parcours de tâches local est accessible par « Mes tâches » (`/setup/tasks`) : création manuelle ou capture volontaire de l'URL, édition, changement d'état et suppression. L'URL éditée est respectée. Un échec de persistance conserve la saisie. Les liens locaux proposent ajout, édition et suppression ; les écritures entre popup, options et panneau sont sérialisées. Auth/cloud et gestion complète des profils restent hors du périmètre confirmé pour l'extension.

Le routeur publie sept pages explicites ; les composants desktop ne sont plus des pages implicites. Les deux alertes image-size restantes concernent web-ext (outil de validation), pas le JavaScript distribué à Chrome. Les changements de permissions et d'appels de polices tiers restent à décider séparément.

## Guidance toward native apps — 2026-09-05

All extension surfaces, including tasks, show an optional native-app guide in FR/EN. It distinguishes native workspace/session capabilities from backup features simply absent in this extension version. A profile hint explains that organizing links does not isolate browser logins. The CTA opens the official localized download page in a new tab, without replacing the current form or starting an installation. No automatic transfer or cloud sync is promised; the current local data boundary is stated before leaving. Windows is the currently published target; other-platform availability is delegated to the official catalog.

In the popup, native-download navigation is deferred while a task form or link input is pending. An accessible message asks the user to save or cancel first because focusing another tab may close the popup. This protection does not claim durable draft persistence.

## Compagnon des onglets Chrome

Le panneau latéral suit plusieurs groupes Chrome, leurs noms, leur ordre et leurs onglets actifs. Le worker conserve le suivi d'un onglet déplacé vers une autre fenêtre et l'active sur place sans rechargement imposé. L'intégration d'un onglet personnel, son retour dans la fenêtre du panneau et le rassemblement des onglets gérés sont des actions explicites. Une fermeture reste fermée jusqu'au prochain clic d'ouverture. Les groupes mixtes restent sous contrôle Chrome pour le nom et le repli.

La reprise MV3 utilise les identifiants de session. La reprise du navigateur conserve uniquement les identités métier : le panneau demande de rattacher l'onglet restauré ou d'ouvrir explicitement un nouvel onglet. Le compagnon ne confond pas deux liens identiques ni les espaces CommunityGlows avec des sessions Chrome séparées. Scénarios automatisés : `scripts/verifyManagedNetworkTabs.mjs`. Limite de preuve : Chromium isolé avec document du panneau rendu comme page d'extension ; panneau natif du profil Chrome personnel et accès authentifié non vérifiés.
