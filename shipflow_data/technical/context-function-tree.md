---
artifact: documentation
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: "socialglowz"
created: "2026-04-26"
updated: "2026-08-03"
status: reviewed
source_skill: sf-docs
scope: function_tree
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
evidence:
  - "src/ui/setup/pages/SocialGlowz/main.ts"
  - "src/ui/setup/pages/SocialGlowz/App.vue"
  - "src/ui/setup/pages/SocialGlowz/assets/main.css"
  - "src/ui/setup/pages/SocialGlowz/components/ui/*.vue"
  - "src/ui/setup/pages/SocialGlowz/directives/tooltip.ts"
  - "src/utils/notifications.ts"
  - "src/ui/setup/pages/SocialGlowz/router/index.ts"
  - "src/stores/*.ts"
  - "src/lib/*.ts"
  - "src-tauri/src/lib.rs"
  - "convex/*.ts"
  - "manifest.config.ts"
  - "manifest.chrome.config.ts"
  - "manifest.firefox.config.ts"
depends_on:
  - "shipflow_data/technical/context.md"
supersedes: []
linked_systems:
  - "shipflow_data/technical/context.md"
  - "shipflow_data/technical/architecture.md"
  - "shipflow_data/technical/design-system-authority.md"
  - "AGENT.md"
next_step: "/sf-docs update shipflow_data/technical/context-function-tree.md"
---

# CONTEXT-FUNCTION-TREE.md

## Purpose

Vue fonctionnelle du cœur de SocialGlowz sans lire tout le projet.

## Runtime Entry Points

- `src/ui/setup/pages/SocialGlowz/main.ts`
  - Bootstrap Vue + Pinia + i18n + router + Notivue.
  - Enregistre `v-sg-tooltip`; ne charge plus PrimeVue dans le runtime Windows/Tauri.
  - Appelle `setupConvexAuth()` si `VITE_CONVEX_URL` est configuré.
  - Monte `App.vue`.
- `src/ui/setup/index.ts`
  - Entrée page setup de l'extension.
  - Route par défaut vers `/setup/install`.
- `src/ui/action-popup/index.ts`
  - Entrée popup navigateur.
- `src/ui/side-panel/index.ts`
  - Entrée panneau latéral navigateur.
- `src/ui/options-page/index.ts`
  - Entrée page paramètres navigateur.
- `src-tauri/src/lib.rs`
  - Exécuteur Rust/Tauri et expose les commandes IPC.
- `src-tauri/plugins/android-webview/android/src/main/java/com/socialglowz/webview/NativeWebViewPlugin.kt`
  - Reçoit les intents Android (barre native, partage texte/URL, commandes webview) et relaie les événements vers Vue.
- `src-tauri/src/main.rs`
  - Point d'entrée Rust.
- `convex/http.ts`
  - Expose les routes auth HTTP.
- `convex/users.ts`, `convex/socialAccounts.ts`, `convex/settings.ts`, `convex/profiles.ts`
  - Entrées backend métier.

## App Lifecycle (SocialGlowz)

- `src/ui/setup/pages/SocialGlowz/main.ts`
- `src/ui/setup/pages/SocialGlowz/App.vue`
  - Gère onboarding, thèmes, synchronisation cloud, nudge, événements Tauri.
- `src/ui/setup/pages/SocialGlowz/router/index.ts`
  - Routes réseau + auth guard.
- `src/ui/setup/pages/SocialGlowz/components/*`
  - Layouts, vues réseau, sidebars, popups, overlays.
- `src/ui/setup/pages/SocialGlowz/components/ui/*`
  - Wrappers SocialGlowz pour boutons, formulaires, dialogues, sélecteurs, avatars, badges et chargement.
  - Reka UI porte la sémantique, le focus, le clavier, les overlays et les splitters complexes; les wrappers portent le rendu et les tokens.
- `src/ui/setup/pages/SocialGlowz/assets/main.css`
  - Porteur central des tokens sémantiques Windows/Tauri et des thèmes clair/sombre.
- `src/ui/setup/pages/SocialGlowz/directives/tooltip.ts`
  - Directive d'infobulle accessible `v-sg-tooltip`: focus/pointeur, `aria-describedby`, `Escape`, mise à jour et nettoyage.
- `src/utils/notifications.ts` + `App.vue`
  - Configuration Notivue, montage du carrier `Notivue`/`Notification` et rendu des notifications tokenisées.
- `src/stores/webviewState.ts`
  - État `activeNetworkId`, `activeUrl`, mode profiles.
- `src/stores/profiles.ts`
  - Gestion des profils utilisateur pour séparation de sessions.

## Shared Layer (`src/`)

- `src/lib/convex.ts`
  - Construction du client Convex singleton.
- `src/lib/convexAuth.ts`
  - Wrapper d'auth, token storage, signIn/signOut.
- `src/lib/socialGlowzDeepLinks.ts`
  - Parse les deeplinks applicatifs SocialGlowz, les ouvertures de réseau/profil et les liens partagés destinés à créer une tâche.
- `src/lib/cloudSync*.ts`
  - Sync settings, queue de sync, feedback post-auth.
- `src/lib/disableCopyProtection.ts`
  - Effet anti-copie, hooks installés côté entrée UI.
- `src/composables/*`
  - Hooks transverses (auth, locales, webviews, settings, signup nudge).
- `src/stores/*`
  - État applicatif global (theme, socialNetworks, settings, onboarding, kanban, contextualTasks, etc.).
- `src/services/*`
  - Appels API externes (Gmail, autres intégrations) et service local des tâches contextuelles.

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
  - liste/création/maj/suppression profils.
- `convex/customLinks.ts`
  - liens personnalisés.
- `convex/friendsFilters.ts`
  - filtres amis par réseau.
- `convex/schema.ts`
  - tables et indexes de données.

## Extension Shell Flow

- `manifest.config.ts` -> permissions + pages d'extension.
- `manifest.chrome.config.ts` / `manifest.firefox.config.ts` -> variantes manifeste.
- `src/platform/capabilities.ts` -> détection de capacité extension/Tauri (side panel, native webview, backup natif).
- `src/platform/extensionNetworkLauncher.ts` -> launcher onglets + validation URL HTTPS.
- `src/platform/extensionTaskCapture.ts` -> capture explicite de l’URL de l’onglet actif pour le popup, sans lecture de page.
- `src/background/index.ts`
  - hooks install/update et redirection setup.
- `src/content-script/index.ts`
  - no-op par défaut (pas d'injection globale).

## High-change Areas

- `src-tauri/src/lib.rs` et plugin Android: changements de commandes natives.
- `src/stores/webviewState.ts`: impact direct sur comportement réseau multi-webview.
- `src/ui/setup/pages/SocialGlowz/components/NetworkWebviewHost.vue` et `composables/useNetworkWebview.ts`: orchestration webview principale.
- `src/ui/setup/pages/SocialGlowz/components/ui/`, `directives/tooltip.ts` et `assets/main.css`: contrats clavier/focus, composants visibles et autorité de tokens Windows.
- `src/ui/setup/pages/SocialGlowz/main.ts`, `App.vue` et `src/utils/notifications.ts`: enregistrement de la directive et carrier global de notifications.
- `convex/schema.ts`: changement de schéma de données.

## Validation Routes

- Composants et raccourcis: `pnpm test:once` puis `pnpm run typecheck:core`.
- Source Windows: inventaire ciblé des imports/configurations PrimeVue sous `src/ui/setup/pages/SocialGlowz/` et `vite.tauri.config.ts`.
- Bundle Windows: `pnpm run tauri:build`, puis inventaire du bundle propre et des déclarations générées.
- Tokens: `python3 "${SHIPGLOWS_ROOT:-$HOME/shipglows}/tools/design_system_drift_check.py" --changed --format markdown`.
- Preuve finale: parcours manuel dans l'exécutable Windows pour clavier/focus, sidebars, thèmes, notifications et WebViews.
