---
artifact: documentation
metadata_schema_version: "1.0"
artifact_version: "1.6.0"
project: "communityglows"
created: "2026-05-14"
updated: "2026-08-11"
status: active
source_skill: 300-sg-docs
scope: code_docs_map
owner: "communityglows-team"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "README.md"
  - "shipglows_data/technical/context.md"
  - "src/ui/setup/pages/CommunityGlows/main.ts"
  - "src/ui/setup/pages/CommunityGlows/assets/main.css"
  - "src/ui/setup/pages/CommunityGlows/components/ui/"
  - "src/ui/setup/pages/CommunityGlows/directives/tooltip.ts"
  - "src/utils/notifications.ts"
  - "src/ui/setup/pages/CommunityGlows/views/SessionLockView.vue"
  - "src/lib/convexAuth.ts"
  - "src/lib/convexAuth.test.ts"
  - "convex/billing.ts"
  - "convex/billing.test.ts"
  - "scripts/importCommunityGlowsActivationCodes.ts"
  - "src/composables/useBillingAccess.ts"
  - "src/ui/setup/pages/CommunityGlows/components/BillingAccessPanel.vue"
  - "src-tauri/src/lib.rs"
  - "src-tauri/Cargo.toml"
  - "src-tauri/capabilities/default.json"
  - "src-tauri/tauri.conf.json"
depends_on:
  - "shipglows_data/technical/context.md"
supersedes: []
evidence:
  - "src-tauri/src/lib.rs"
  - "src-tauri/plugins/android-webview/src/mobile.rs"
  - "src-tauri/plugins/android-webview/android/src/main/java/com/communityglows/webview/NativeWebViewPlugin.kt"
  - "shipglows_data/technical/android-webview-session-isolation.md"
  - "shipglows_data/technical/design-system-authority.md"
next_step: "/300-sg-docs maintain shipglows_data/technical/code-docs-map.md"
---

# CODE DOCS MAP

## Windows/Tauri component and design-system runtime

- Code:
  - `src/ui/setup/pages/CommunityGlows/main.ts`
  - `src/ui/setup/pages/CommunityGlows/App.vue`
  - `src/ui/setup/pages/CommunityGlows/assets/main.css`
  - `src/ui/setup/pages/CommunityGlows/components/ui/`
  - `src/ui/setup/pages/CommunityGlows/directives/tooltip.ts`
  - `src/utils/notifications.ts`
  - `vite.tauri.config.ts`
- Behavior:
  - Reka UI owns maintained keyboard, focus, overlay and splitter behavior for composite Windows controls.
  - CommunityGlows wrappers own visible composition and consume generated semantic tokens; `design/tokens/reference.json` is the editable cross-platform authority, while `main.css` provides composition and compatibility aliases.
  - Notivue owns notification transport/rendering through the carrier mounted by `App.vue`; `v-sg-tooltip` owns accessible tooltips.
  - The Windows/Tauri source, generated declarations and clean bundle contain no PrimeVue runtime. PrimeVue/PrimeFlex/PrimeIcons remain scoped to legacy extension consumers where applicable.
- Docs:
  - `shipglows_data/technical/design-system-authority.md`
  - `shipglows_data/technical/context.md`
  - `shipglows_data/technical/context-function-tree.md`
  - `shipglows_data/workflow/specs/windows-reka-ui-design-system-migration.md`
- Validation:
  - `pnpm test:once`
  - `pnpm run typecheck:core`
  - `pnpm run tauri:build`
  - Design drift scan and clean PrimeVue source/declaration/bundle inventories
  - Manual Windows executable proof remains required

## Unified suite product access and Stripe checkout

- Code:
  - `convex/schema.ts`
  - `convex/billing.ts`
  - `convex/billing.test.ts`
  - `scripts/importCommunityGlowsActivationCodes.ts`
  - `scripts/importCommunityGlowsActivationCodes.test.ts`
  - `src/composables/useBillingAccess.ts`
  - `src/composables/useBillingAccess.test.ts`
  - `src/lib/communityGlowsInstallation.ts`
  - `src/lib/communityGlowsInstallation.test.ts`
  - `src/ui/setup/pages/CommunityGlows/components/BillingAccessPanel.vue`
  - `src/ui/setup/pages/CommunityGlows/components/ProductAccessGate.vue`
  - `src/ui/setup/pages/CommunityGlows/components/billingAccessComponents.test.ts`
  - `src/ui/setup/pages/CommunityGlows/components/AppSettings.vue`
  - `src/ui/setup/pages/CommunityGlows/components/MobileSettingsSheet.vue`
  - `site/src/config/site.ts`
  - `site/src/pages/pricing.astro`
  - `site/src/pages/purchase/success.astro`
  - `site/src/pages/purchase/cancel.astro`
- Behavior:
  - CommunityGlows lit l’accès produit via le bridge suite CommandGlows ; les tables locales `entitlements`/`redemptionCodes`/`billingEvents` ne sont plus des sources de vérité, elles servent au passage/compatibilité de migration.
  - Le contrat partagé accorde des périodes de 30 jours, deux relances maximum, puis exige l'achat; les snapshots propagent `trialAttempt`, `trialRestartsRemaining`, `trialRestartEligible` et `trial_exhausted` sans recomputage client.
  - `communityGlowsInstallation.ts` persiste un identifiant aléatoire propre à l'app et envoie uniquement son hash pseudonymisé; l'API CommandGlows le re-pseudonymise par HMAC serveur avant stockage, et aucun identifiant matériel n'est lu.
  - `billing.startCheckout` conserve le handoff signé côté serveur, appelle le checkout Stripe central et retourne uniquement l'URL Stripe finale. Les pages publiques ouvrent `communityglows://app/billing` au lieu d'un checkout non signé.
  - `billing.redeemCode` permet à un user authentifié d’activer un code Lifetime Deal, early-bird, partner, ou manual dans l’entitlement ledger suite (`productId=communityglows`, `plan=lifetime_deal` par défaut).
  - `billing.adminUpsertRedemptionCode` est protégé par `COMMUNITYGLOWS_BILLING_ADMIN_SECRET` et réservé aux imports/ops serveur.
  - `scripts/importCommunityGlowsActivationCodes.ts` importe des batches JSON/JSONL/CSV de codes Lifetime Deal ou early-bird via l'action admin existante, redige les codes dans la sortie, et ne contourne pas le bridge suite.
  - `billing.getProductAccess` renvoie une réponse suite-driven et retourne un état sûr si le bridge est indisponible ou mal configuré.
  - `billingEvents` conserve les événements historiques de redemption/admin sans devenir une autorité d'accès; les types provider actifs locaux sont limités à Stripe avec les sources manuelles/partenaires nécessaires aux codes.
  - `BillingAccessPanel.vue` et `ProductAccessGate.vue` exposent relance, compteur restant, épuisement et achat Stripe; `useBillingAccess.ts` conserve les données sensibles en mémoire et mappe les erreurs vers des clés i18n sûres.
- Docs:
  - `shipglows_data/workflow/specs/communityglows-billing-entitlements-foundation.md`
  - `shipglows_data/workflow/specs/communityglows-redemption-ui.md`
  - `shipglows_data/workflow/specs/communityglows-suite-entitlement-adapter.md`
  - `shipglows_data/workflow/specs/communityglows-processor-agnostic-ltd-commerce.md`
  - `shipglows_data/technical/billing-activation-code-import.md`
  - `shipglows_data/technical/platforms/stripe-managed-payments.md`
  - `shipglows_data/technical/context.md`

## Auth/session hardening (Android)

- Code:
  - `src/ui/setup/pages/CommunityGlows/views/SessionLockView.vue`
  - `src/lib/convexAuth.ts`
  - `src/lib/convexAuth.test.ts`
- Behavior:
  - Lock screen only unlocks with pre-enrolled session PIN.
  - If no PIN exists for a locked session, relogin is required.
  - Session restore requires both JWT + refresh token in namespaced storage.
  - Legacy auth keys are purged during bootstrap.
- Docs:
  - `README.md` (section "Sécurité auth Android (hardening)")
  - `shipglows_data/technical/context.md` (Android OAuth callback hardening flow)

## Android deep-link OAuth callback validation

- Code:
  - `src/ui/setup/pages/CommunityGlows/main.ts`
  - `src-tauri/src/lib.rs`
  - `src-tauri/Cargo.toml`
  - `src-tauri/capabilities/default.json`
  - `src-tauri/tauri.conf.json`
- Behavior:
  - Tauri deep-link plugin registered at native runtime.
  - Frontend records pending OAuth requests through `communityglows:android-oauth-request-started`.
  - Frontend listens to deep-link URLs and forwards callback validation to Rust command `validate_android_oauth_callback` only when the callback `state` matches a pending request.
  - Validation enforces callback allowlist, state/nonce checks against the pending request, TTL and replay protection.
  - Rejected callbacks emit an anonymized Sentry message when a runtime Sentry SDK is available.
- Docs:
  - `README.md`
  - `shipglows_data/technical/context.md`

## Security rendering guard

- Code:
  - `src/ui/setup/pages/CommunityGlows/main.ts`
- Behavior:
  - Auth bootstrap error screen message is rendered with `textContent`, not interpolated `innerHTML`.
- Docs:
  - `README.md`

## Android WebView storage isolation and pooling

- Code:
  - `src/config/socialNetworks.ts`
  - `src/ui/setup/pages/CommunityGlows/composables/useNetworkWebview.ts`
  - `src/ui/setup/pages/CommunityGlows/composables/useWebviewPreload.ts`
  - `src-tauri/src/lib.rs`
  - `src-tauri/plugins/android-webview/src/mobile.rs`
  - `src-tauri/plugins/android-webview/android/src/main/java/com/communityglows/webview/NativeWebViewPlugin.kt`
- Behavior:
  - Quand Android WebKit `MULTI_PROFILE` est disponible, le plugin rattache chaque WebView de session `${profileId}-${networkId}` à un profil WebKit natif distinct via `WebViewCompat.setProfile`, avant toute configuration ou navigation.
  - Les hôtes WebView de session sont conservés dans un pool LRU borné pour accélérer les switches; `hide_webview`/`show_webview` Android reflètent maintenant ce contrat au lieu de détruire systématiquement la WebView.
  - Si `MULTI_PROFILE` est indisponible ou échoue, le plugin annonce un fallback single-WebView et désactive le pooling multi-WebView pour éviter un partage du `CookieManager` global.
  - Une matrice déclarative définit la politique d'isolation (par défaut `cookies` + `localStorage`, non-couverture `sessionStorage`/`IndexedDB`/`CacheStorage`/`serviceWorker`) et les origins additionnelles par réseau.
  - Le front passe `storageOrigins` à `open_webview` pour ouverture normale/preload et `storageOriginsByNetwork` à `set_bar_networks` pour les switches de la bottom bar native.
  - Rust Android valide/normalise ces origins (HTTPS + host autorisé par réseau + réseau visible pour la bottom bar) puis les transmet au plugin mobile.
  - Le plugin Kotlin élargit `allowedOrigins` des hooks d'isolation/capture stockage sans branche réseau spécifique, y compris lors d'un changement de réseau piloté uniquement côté natif.
- Docs:
  - `shipglows_data/technical/context.md`
  - `shipglows_data/workflow/specs/android-webview-storage-isolation.md`

## Public WebView platform boundary

- Code:
  - `src-tauri/src/lib.rs`
  - `src-tauri/plugins/android-webview/android/src/main/java/com/communityglows/webview/NativeWebViewPlugin.kt`
  - `src/ui/setup/pages/CommunityGlows/App.vue`
  - `src/ui/setup/pages/CommunityGlows/components/BitwardenExtensionSettings.vue`
  - `src/ui/setup/pages/CommunityGlows/components/MobileSettingsSheet.vue`
- Behavior:
  - The public build leaves third-party consent dialogs under user control and uses the actual WebView user agent.
  - It does not include anti-detection, consent/app-banner automation, desktop identity or viewport forcing, arbitrary desktop script injection, or friends-only feed filtering.
  - Dark/light appearance, grayscale, mute, and native text zoom are retained only as user visual preferences and remain subject to per-platform compatibility testing.
  - Windows Settings can import a user-selected official Bitwarden Chromium ZIP into bounded local application data, persist only its managed installation reference, and apply enable/disable changes after an explicit restart. The archive is not uploaded and CommunityGlows does not read vault or filled-field values.
- Docs:
  - `shipglows_data/technical/public-webview-platform-boundary.md`
  - `shipglows_data/technical/android-webview-session-isolation.md`
  - `shipglows_data/workflow/audits/2026-07-15-google-play-android-compliance.md`
