---
artifact: documentation
metadata_schema_version: "1.0"
artifact_version: "1.2.3"
project: "communityglows"
created: "2026-04-26"
updated: "2026-08-13"
status: reviewed
source_skill: 300-sg-docs
scope: function_tree
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
evidence:
  - "src/ui/setup/pages/CommunityGlows/main.ts"
  - "src/ui/setup/pages/CommunityGlows/App.vue"
  - "src/ui/setup/pages/CommunityGlows/assets/main.css"
  - "src/ui/setup/pages/CommunityGlows/components/ui/*.vue"
  - "src/ui/setup/pages/CommunityGlows/directives/tooltip.ts"
  - "src/utils/notifications.ts"
  - "src/ui/setup/pages/CommunityGlows/router/index.ts"
  - "src/stores/*.ts"
  - "src/lib/*.ts"
  - "site/src/components/ui/*"
  - "site/src/pages"
  - "src-tauri/src/lib.rs"
  - "convex/*.ts"
  - "manifest.config.ts"
  - "manifest.chrome.config.ts"
  - "manifest.firefox.config.ts"
depends_on:
  - "shipglows_data/technical/context.md"
supersedes: []
linked_systems:
  - "shipglows_data/technical/context.md"
  - "shipglows_data/technical/architecture.md"
  - "shipglows_data/technical/design-system-authority.md"
  - "AGENT.md"
next_step: "/300-sg-docs update shipglows_data/technical/context-function-tree.md"
---

# CONTEXT-FUNCTION-TREE.md

## Purpose

Vue fonctionnelle du cÅ“ur de CommunityGlows sans lire tout le projet.

## Runtime Entry Points

- `src/ui/setup/pages/CommunityGlows/main.ts`
  - Bootstrap Vue + Pinia + i18n + router + Notivue.
  - Enregistre `v-sg-tooltip`; ne charge plus PrimeVue dans le runtime Windows/Tauri.
  - Appelle `setupConvexAuth()` si `VITE_CONVEX_URL` est configurÃ©.
  - Monte `App.vue`.
- `src/ui/setup/index.ts`
  - EntrÃ©e page setup de l'extension.
  - Route par dÃ©faut vers `/setup/install`.
- `src/ui/action-popup/index.ts`
  - EntrÃ©e popup navigateur.
- `src/ui/side-panel/index.ts`
  - EntrÃ©e panneau latÃ©ral navigateur.
- `src/ui/options-page/index.ts`
  - EntrÃ©e page paramÃ¨tres navigateur.
- `src-tauri/src/lib.rs`
  - ExÃ©cuteur Rust/Tauri et expose les commandes IPC.
- `src-tauri/plugins/android-webview/android/src/main/java/com/communityglows/webview/NativeWebViewPlugin.kt`
  - ReÃ§oit les intents Android (barre native, partage texte/URL, commandes webview) et relaie les Ã©vÃ©nements vers Vue.
- `src-tauri/src/main.rs`
  - Point d'entrÃ©e Rust.
- `convex/http.ts`
  - Expose les routes auth HTTP.
- `convex/users.ts`, `convex/socialAccounts.ts`, `convex/settings.ts`, `convex/profiles.ts`
  - EntrÃ©es backend mÃ©tier.

## Site Shared UI Layer

- `site/src/components/ui/`
  - Reusable Astro component layer for site pages (ActionLink, EyebrowPill, SectionHeading, SiteLogo, StatusBadge) used to avoid per-page duplication and keep shared surface patterns coherent.

## App Lifecycle (CommunityGlows)

- `src/ui/setup/pages/CommunityGlows/main.ts`
- `src/ui/setup/pages/CommunityGlows/App.vue`
  - GÃ¨re onboarding, thÃ¨mes, synchronisation cloud, nudge, Ã©vÃ©nements Tauri.
- `src/ui/setup/pages/CommunityGlows/router/index.ts`
  - Routes rÃ©seau + auth guard.
- `src/ui/setup/pages/CommunityGlows/components/*`
  - Layouts, vues rÃ©seau, sidebars, popups, overlays.
- `src/ui/setup/pages/CommunityGlows/components/ui/*`
  - Wrappers CommunityGlows pour boutons, formulaires, dialogues, sÃ©lecteurs, avatars, badges et chargement.
  - Reka UI porte la sÃ©mantique, le focus, le clavier, les overlays et les splitters complexes; les wrappers portent le rendu et les tokens.
- `site/src/components/ui/*`
  - Shared Astro UI atoms for site marketing surfaces (action links, section headings, status badges, logo block, contextual labels); use them before local duplication.
- `design/tokens/reference.json`
  - Source Ã©ditable unique des rÃ´les sÃ©mantiques partagÃ©s et de leurs modes clair/sombre.
- `src/ui/setup/pages/CommunityGlows/assets/generated/tokens.css`
  - Carrier gÃ©nÃ©rÃ© Windows/Tauri; `assets/main.css` conserve la composition et les alias de compatibilitÃ©.
- `src/ui/setup/pages/CommunityGlows/directives/tooltip.ts`
  - Directive d'infobulle accessible `v-sg-tooltip`: focus/pointeur, `aria-describedby`, `Escape`, mise Ã  jour et nettoyage.
- `src/utils/notifications.ts` + `App.vue`
  - Configuration Notivue, montage du carrier `Notivue`/`Notification` et rendu des notifications tokenisÃ©es.
- `src/stores/webviewState.ts`
  - Ã‰tat `activeNetworkId`, `activeUrl`, mode profiles.
- `src/stores/profiles.ts`
  - Gestion des profils utilisateur pour sÃ©paration de sessions.

## Shared Layer (`src/`)

- `src/lib/convex.ts`
  - Construction du client Convex singleton.
- `src/lib/convexAuth.ts`
  - Wrapper Vue d'auth alignÃ© sur l'adaptateur officiel: signIn/signOut temps rÃ©el, refresh HTTP avec retry, token storage et confirmation de session avant hydratation.
- `src/lib/communityGlowsDeepLinks.ts`
  - Parse les deeplinks applicatifs CommunityGlows, les ouvertures de rÃ©seau/profil et les liens partagÃ©s destinÃ©s Ã  crÃ©er une tÃ¢che.
- `src/lib/cloudSync*.ts`
  - Sync settings, queue de sync, feedback post-auth, diagnostics et dÃ©lais terminaux par lecture cloud; Ã©chec explicite si la session n'expose aucun utilisateur cloud.
- `src/utils/disableCopyProtection.ts`
  - Effet anti-copie, hooks installÃ©s cÃ´tÃ© entrÃ©e UI.
- `src/composables/*`
  - Hooks transverses (auth, locales, webviews, settings, signup nudge).
- `src/stores/*`
  - Ã‰tat applicatif global (theme, socialNetworks, settings, onboarding, kanban, contextualTasks, etc.).
- `src/services/*`
  - Appels API externes (Gmail, autres intÃ©grations) et service local des tÃ¢ches contextuelles.

## Tauri IPC Surface

- `open_webview`
- `resize_webview`
- `close_webview`
- `hide_webview`
- `show_webview`
- `set_grayscale`
- `set_dark_mode`
- `set_text_zoom`
- `set_bar_networks`
- `set_profiles`
- `set_locale`
- `inject_script`
- `delete_profile_session`
- `delete_network_session`
- `create_backup`
- `restore_backup`

## Convex Function Tree

- `convex/auth.config.ts`
  - Domaines providers auth.
- `convex/http.ts`
  - Montage routes HTTP auth.
- `convex/users.ts`
  - getMe, hasEmail, emailExists.
- `convex/socialAccounts.ts`
  - list, upsert, remove, setActive, listActive.
- `convex/settings.ts`
  - getOrCreate, updateSettings, getSettings.
- `convex/profiles.ts`
  - liste/crÃ©ation/maj/suppression profils.
- `convex/customLinks.ts`
  - liens personnalisÃ©s.
- `convex/friendsFilters.ts`
  - filtres amis par rÃ©seau.
- `convex/schema.ts`
  - tables et indexes de donnÃ©es.

## Extension Shell Flow

- `manifest.config.ts` -> permissions + pages d'extension.
- `manifest.chrome.config.ts` / `manifest.firefox.config.ts` -> variantes manifeste.
- `src/platform/capabilities.ts` -> dÃ©tection de capacitÃ© extension/Tauri (side panel, native webview, backup natif).
- `src/platform/extensionNetworkLauncher.ts` -> launcher onglets + validation URL HTTPS.
- `src/platform/extensionTaskCapture.ts` -> capture explicite de lâ€™URL de lâ€™onglet actif pour le popup, sans lecture de page.
- `src/background/index.ts`
  - hooks install/update et redirection setup.
- `src/content-script/index.ts`
  - no-op par dÃ©faut (pas d'injection globale).

## High-change Areas

- `src-tauri/src/lib.rs` et plugin Android: changements de commandes natives.
- `src/stores/webviewState.ts`: impact direct sur comportement rÃ©seau multi-webview.
- `src/ui/setup/pages/CommunityGlows/components/NetworkWebviewHost.vue` et `composables/useNetworkWebview.ts`: orchestration webview principale.
- `src/ui/setup/pages/CommunityGlows/components/ui/`, `directives/tooltip.ts` et `assets/main.css`: contrats clavier/focus, composants visibles et autoritÃ© de tokens Windows.
- `site/src/components/ui/*`: shared marketing UI atoms now owned by the site surface for CTA/branding consistency.
- `src/ui/setup/pages/CommunityGlows/main.ts`, `App.vue` et `src/utils/notifications.ts`: enregistrement de la directive et carrier global de notifications.
- `convex/schema.ts`: changement de schÃ©ma de donnÃ©es.

## Validation Routes

- Composants et raccourcis: `pnpm test:once` puis `pnpm run typecheck:core`.
- Source Windows: inventaire ciblÃ© des imports/configurations PrimeVue sous `src/ui/setup/pages/CommunityGlows/` et `vite.tauri.config.ts`.
- Bundle Windows: `pnpm run tauri:build`, puis inventaire du bundle propre et des dÃ©clarations gÃ©nÃ©rÃ©es.
- Tokens: `python3 "${SHIPGLOWS_ROOT:-$HOME/shipglows}/tools/design_system_drift_check.py" --changed --format markdown`.
- Preuve finale: parcours manuel dans l'exÃ©cutable Windows pour clavier/focus, sidebars, thÃ¨mes, notifications et WebViews.
