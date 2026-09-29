---
artifact: documentation
metadata_schema_version: "1.0"
artifact_version: "1.8.2"
project: "communityglows"
created: "2026-04-26"
updated: "2026-09-29"
status: reviewed
source_skill: 300-sg-docs
scope: context
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
evidence:
  - "README.md"
  - "package.json"
  - "vite.config.ts"
  - "vite.chrome.config.ts"
  - "vite.firefox.config.ts"
  - "vite.tauri.config.ts"
  - "src/ui/setup/pages/CommunityGlows/main.ts"
  - "src/ui/setup/pages/CommunityGlows/App.vue"
  - "src/ui/setup/pages/CommunityGlows/assets/main.css"
  - "src/ui/setup/pages/CommunityGlows/components/ui/"
  - "src/ui/setup/pages/CommunityGlows/directives/tooltip.ts"
  - "src/utils/notifications.ts"
  - "src/lib/convexAuth.ts"
  - "src/lib/cloudSync.ts"
  - "src-tauri/src/lib.rs"
  - "convex/schema.ts"
  - "convex/billing.ts"
  - "src/ui/setup/pages/CommunityGlows/components/BillingAccessPanel.vue"
  - "src/ui/setup/pages/CommunityGlows/components/ProductAccessGate.vue"
  - "src/lib/communityGlowsInstallation.ts"
  - "manifest.config.ts"
  - ".github/workflows/shipglows-required-gate.yml"
  - ".shipglows/required-gate.json"
depends_on:
  - "README.md"
  - "AGENT.md"
supersedes: []
linked_systems:
  - "README.md"
  - "AGENT.md"
  - "shipglows_data/technical/context-function-tree.md"
  - "shipglows_data/technical/android-webview-session-isolation.md"
  - "shipglows_data/technical/public-webview-platform-boundary.md"
  - "shipglows_data/technical/architecture.md"
  - "package.json"
  - "vite.config.ts"
  - "vite.tauri.config.ts"
  - "src-tauri/tauri.conf.json"
  - "shipglows_data/technical/design-system-authority.md"
  - "convex/schema.ts"
  - ".github/workflows/shipglows-required-gate.yml"
  - ".shipglows/required-gate.json"
next_step: "/300-sg-docs update shipglows_data/technical/context.md"
---

# CONTEXT

## What CommunityGlows Is

CommunityGlows est une application social multi-canaux avec une base Vue 3 commune et des cibles de distribution extension navigateur, desktop Tauri et mobile Tauri.

## Product/Platform Matrix

- Extension Chrome/Firefox
  - Build via `vite.chrome.config.ts` et `vite.firefox.config.ts`
  - Entrées HTML dans `src/ui/*`
  - Manifest CRX v3 dans `manifest.config.ts`
- Desktop/Tauri
  - Build via `vite.tauri.config.ts` + `pnpm tauri:bundle`
  - Entrée principale `src-tauri/src/lib.rs` + `src-tauri/tauri.conf.json`
- Android
  - Cible Tauri mobile avec plugin `src-tauri/plugins/android-webview`

## Repo Map

- `src/` : logique partagée, stores, composables, services, utilitaires.
- `src/ui/setup/pages/CommunityGlows/` : application principale.
- `src/ui/setup/pages/CommunityGlows/main.ts` : bootstrap front Windows/Tauri (Vue, Pinia, i18n, router, Notivue, directive tooltip CommunityGlows et Convex conditionnel).
- `src/ui/setup/pages/CommunityGlows/App.vue` : shell desktop/mobile principal et orchestration.
- `src/ui/setup/pages/CommunityGlows/components/ui/` : wrappers visuels CommunityGlows; Reka UI porte les comportements clavier/focus des contrôles composites.
- Bento : après validation ou annulation du renommage d'un groupe, `workspacePanelFocus.ts` rend le focus à l'onglet d'origine après le rendu Vue. Si l'onglet a été fermé ou qu'un autre panneau est devenu actif, il ne déplace pas le focus. Le nom et l'icône du Bento restent dans la sidebar ; les actions d'onglet sont accessibles au clavier dans les menus contextuels.
- Distribution Windows : le workflow manuel construit un artefact de recette sur une branche de travail, sans remplacer le téléchargement public. La publication de `windows-latest` est réservée à `main`, après validation de la version candidate. Le runtime EU est vérifié à partir de Doppler avant compilation.
- `design/tokens/reference.json` : autorité éditable des rôles sémantiques partagés, fondée sur le langage visuel dark-first du site.
- `src/ui/setup/pages/CommunityGlows/assets/main.css` : styles consommateurs et compatibilité Windows/Tauri; les valeurs canoniques viennent du carrier généré.
- `src/ui/*` : pages de shell navigateur (setup popup panel options).
- `convex/` : backend serverless auth + données persistées.
- `src-tauri/src/` : host natif, commandes IPC, création/gestion webviews.
- `src-tauri/plugins/android-webview/` : API native Android.
- `site/src/pages` : site marketing, incluant les pages de conversion (`/pricing`) et nouveaux flux de retour de paiement (`/purchase/success`, `/purchase/cancel`).

## Core Runtime Flows

### 1) Front boot + auth

1. Vite démarre une entrée UI.
2. `src/ui/setup/pages/CommunityGlows/main.ts` initialise Pinia, i18n, router, Notivue et `v-sg-tooltip`; PrimeVue, Aura et les services/directives PrimeVue ne sont plus chargés par cette entrée.
3. Si `VITE_CONVEX_URL` est présent, `getConvexClient()` et `setupConvexAuth()` chargent les jetons persistés avant de configurer Convex Auth.
4. Après une connexion par mot de passe, `signIn` et `signOut` passent par le client Convex temps réel comme dans l'adaptateur officiel; seul le renouvellement du jeton utilise un client HTTP non authentifié avec retry réseau. Le client attend ensuite la confirmation de session Convex avant d'exposer l'état authentifié et d'hydrater les données cloud. L'action d'authentification et chaque lecture cloud ont un délai terminal de 15 secondes et une étape diagnostique dédiée; un utilisateur cloud absent ou une lecture bloquée devient une erreur visible et aucun rechargement n'est lancé.
5. App bootstrap puis montage de l'application.

#### Couche UI Windows/Tauri

- `components/ui/` expose les boutons, champs, dialogues, switches, avatars, badges, sélecteurs, multi-sélecteurs et indicateurs de chargement CommunityGlows.
- Reka UI fournit les primitives maintenues de sémantique, focus, clavier, overlays et redimensionnement; les wrappers CommunityGlows restent propriétaires du rendu et des variantes.
- `assets/generated/tokens.css` porte les rôles canoniques générés; `assets/main.css` conserve la composition et les alias de compatibilité Windows.
- `src/utils/notifications.ts` configure Notivue; `App.vue` monte `Notivue`/`Notification`, et les producteurs utilisent `push`.
- `directives/tooltip.ts` possède les infobulles accessibles au focus et au pointeur, leur `aria-describedby`, leur fermeture par `Escape` et leur nettoyage.
- La source Windows, ses déclarations générées et un bundle Tauri propre ne contiennent aucun composant ni bootstrap PrimeVue. PrimeVue reste consommé par des surfaces extension historiques. PrimeIcons est encore importé par l'entrée Windows pour la compatibilité visuelle; PrimeFlex ne l'est plus. Aucun des deux ne porte l'autorité sémantique Windows.
- Le workspace desktop multi-réseaux utilise Dockview via un wrapper CommunityGlows. Dockview possède le docking, les onglets, le drag, les splits, le resize, le clavier et la sérialisation; les wrappers et tokens CommunityGlows possèdent le rendu, la validation des panneaux et la persistance locale.
- Chaque panneau réseau visible possède son `NetworkWebviewHost` et réutilise l'isolation native desktop `${profileId}-${networkId}`. Un onglet masqué ou un drag de docking suspend la WebView correspondante avec `Webview.hide()`/`show()` pour garder les overlays et zones de dépôt Vue accessibles. Les changements de bounds sont dédupliqués et coalescés par frame avant l'IPC natif; les sessions de drag sont aussi terminées sur annulation, `Escape`, perte de focus, masquage du document ou expiration du watchdog.
- Le pool desktop publie des diagnostics `total`/`visible`/`hidden`. L'isolation de données par couple profil/réseau est conservée tant que des mesures natives ne justifient pas une migration; aucun partage de répertoire de données ou de session n'est déduit des seuls coûts théoriques du runtime.

#### Android deeplinks (mobile/desktop Tauri)

1. `main.ts` écoute les événements `deep-link://new-url` du plugin deep-link et lit aussi `plugin:deep-link|get_current` au démarrage.
2. Les deeplinks applicatifs `communityglows://app/open?network=<id>` ouvrent un réseau dans CommunityGlows avec le profil courant par défaut; `communityglows://app/billing` ouvre la surface de facturation authentifiée sans transporter de jeton ni d'identité.
3. Le même deeplink accepte `profile=choose` ou `chooseProfile=1` pour ouvrir le sélecteur de profil puis lancer le réseau choisi après sélection.
4. Sur Android, CommunityGlows apparaît aussi dans la feuille de partage système pour les contenus texte/URL (`ACTION_SEND` avec `text/*`).
5. Quand une URL est partagée depuis Android, l'app ouvre le formulaire `/tasks` avec l'URL HTTPS préremplie; elle ne lit pas la page et ne navigue pas automatiquement vers le réseau. Les deep links applicatifs `communityglows://app/open` conservent leur comportement d'ouverture de réseau/profil.
6. Lorsqu'une requête OAuth démarre, l'app enregistre un `state`/`nonce` pending local via `communityglows:android-oauth-request-started`.
7. Chaque URL candidate OAuth est validée côté Rust via `validate_android_oauth_callback` contre cette requête pending (host/schéma allowlist, `state`, `nonce`, TTL 5 min, anti-rejeu).
8. Un callback rejeté ne doit pas muter l'état auth/session et déclenche un signal Sentry anonymisé si le SDK est disponible.
9. Le lock session n'autorise pas de création PIN depuis l'écran verrouillé: si aucun PIN préenregistré, l'utilisateur retourne au login.

### 2) Navigation CommunityGlows

1. `src/ui/setup/pages/CommunityGlows/router/index.ts` route selon hash.
2. `AuthGuard` protège les vues réseau.
3. Vue réseau utilise `webviewStore` et store profils pour ouvrir le bon WebView.
4. Sur desktop/mobile, le front appelle des commandes natives Tauri via IPC.
5. Sur desktop, `DesktopWorkspace.vue` ouvre ou active un panneau par réseau; plusieurs groupes Dockview peuvent rester visibles simultanément, tandis que le réseau du panneau actif reste synchronisé vers les sidebars et raccourcis existants.

### 3) Sync et persistance

- État local : Pinia + localStorage via stores.
- Scènes desktop : `src/lib/desktopWorkspaceLayouts.ts` valide et persiste jusqu'à douze bentos nommés par profil, une sélection par profil et un brouillon local distinct par profil. Les Scènes sont synchronisées ensemble dans l'état workspace Convex existant par une file hors ligne, avec un plafond global de 500 000 caractères, et incluses dans les sauvegardes chiffrées; les brouillons et sessions restent locaux. Le format v2 migre une fois l'ancien état global et son autosave vers le profil actif final, puis supprime les clés v1 seulement après écriture v2 réussie. Changer de profil suspend l'autosave, sauvegarde le brouillon sortant, vide les panneaux puis restaure le brouillon entrant; supprimer un profil purge ses Scènes et son brouillon. Une restauration exécutable n'accepte que les réseaux intégrés sur leur domaine canonique (ou ses sous-domaines autorisés) et les liens personnalisés UUID présents dans le profil actif avec leur URL exacte; les URL avec identifiants intégrés, non HTTPS, inconnues ou corrompues sont ignorées sans bloquer le démarrage. Chaque layout est borné à 24 panneaux, 64 niveaux et 4 096 nœuds JSON; chaque autosave est limité à 500 000 caractères sérialisés et l'état local des Scènes à 2 000 000. Les références de groupes/panneaux doivent être complètes et uniques, tandis que les groupes flottants ou popout restent refusés. Un stockage indisponible, saturé ou excessif produit un résultat contrôlé et un avertissement utilisateur au lieu d'une exception UI. Une Scène contenant un lien personnalisé structurellement valide peut rester stockée pendant l'hydratation du catalogue, mais ne peut pas être exécutée avant sa résolution.
- Tâches contextuelles : `src/stores/contextualTasks.ts` et `src/services/contextualTasksService.ts`, stockage local versionné `contextual-tasks-v1`, sans sync Convex en V1.
- Sync cloud : `src/lib/cloudSyncQueue.ts`, `src/lib/cloudSettings.ts`, `src/lib/cloudSync.ts`.
- Backend : tables Convex (`users`, `socialAccounts`, `activeAccounts`, `settings`, `profiles`, `customLinks`, `friendsFilters`, `entitlements`, `redemptionCodes`, `billingEvents`, `subscriptions`). Les tables `entitlements`/`redemptionCodes`/`billingEvents` sont des surfaces de compatibilité locale en transition pendant la migration vers le ledger canonique de suite.
- Accès produit : `convex/billing.ts` agit comme adaptateur `server -> suite bridge`, avec un point de vérité durable côté CommandGlows (`globalUsers`/`identityAccounts`/`productEntitlements`/`productAccessEvents`). Chaque période d'essai dure 30 jours; deux relances utilisateur sont autorisées, puis l'achat est obligatoire après la troisième période. Aucun fallback gratuit permanent n'est autorisé. Le client persiste un identifiant d'installation aléatoire local et n'envoie qu'un hash pseudonymisé au bridge; l'API CommandGlows applique un second HMAC avec `SUITE_TRIAL_SIGNAL_SECRET` avant persistance ou comparaison. La couche locale ne sert pas d'autorité durable ; elle reste utilisée uniquement pour audit/migration manuelle non destructive. Les rappels J-7, J-3 et J-1 dérivent exclusivement des timestamps d'essai vérifiés; leur report local de 24 heures est associé à la période et au jalon, sans modifier ni prolonger l'entitlement. Leur carte de conversion rappelle uniquement les bénéfices effectivement disponibles, précise que les données restent conservées et réutilise le checkout Stripe authentifié à 149 € TTC sans modifier le prix ni la logique d'accès. Après expiration, `ProductAccessGate` reprend cette proposition de valeur et ajoute une note personnelle de la fondatrice, tout en conservant visiblement toute relance autorisée par le serveur et les parcours de récupération.
- Achat : l'action Convex CommunityGlows demande au bridge central un handoff d'identité signé, l'utilise côté serveur pour démarrer `communityglows/lifetime_deal` sur le checkout Stripe central, puis ne retourne au client que l'URL Stripe finale. Aucun secret Stripe, Price ID, webhook ou handoff brut n'est exposé dans CommunityGlows.
- Android WebView (plugin natif) : quand Android WebKit `MULTI_PROFILE` est disponible, chaque session `${profileId}-${networkId}` utilise un profil WebKit natif distinct et un hôte WebView chaud dans un pool LRU borné. En fallback, le plugin revient au mode single-WebView avec cookies + snapshots `localStorage` persistés par session et par origin exacte. CinderReels déclare une origin explicite car son auth utilise `localStorage`; les autres réseaux utilisent le même mécanisme via leur URL principale.
- Les origins additionnelles où l'isolation scriptée s'applique sont déclarées côté front dans `src/config/socialNetworks.ts` puis transmises à `open_webview` et `set_bar_networks` (validation HTTPS/allowlist côté Rust Android), afin de couvrir les réseaux dont l'auth/app traverse plusieurs domaines et les switches natifs de la bottom bar Android.
- Mode dégradé explicite si `DOCUMENT_START_SCRIPT` ou `WEB_MESSAGE_LISTENER` ne sont pas disponibles.
- Mode dégradé explicite aussi si `MULTI_PROFILE` est indisponible : le multi-WebView chaud est désactivé pour éviter un partage du `CookieManager` global. Les snapshots fallback ne couvrent pas IndexedDB, CacheStorage, service workers, HTTP cache WebView global, credential stores système. `sessionStorage` n'est pas une garantie durable.
- Détail du contrat : `shipglows_data/technical/android-webview-session-isolation.md`.
- La frontière publique des WebViews tierces est distincte de l'isolation de session : aucun consentement, contournement d'identité, automatisation d'interface ou filtrage de contenu tiers ne doit être réintroduit. Les préférences visuelles restantes sont conditionnelles à la compatibilité par réseau. Détail : `shipglows_data/technical/public-webview-platform-boundary.md`.

### 4) Extension surfaces

- `src/background/index.ts` gère install/update et ouvre la page setup.
- `src/content-script/index.ts` est neutre par défaut (pas d'injection globale active).
- `src/ui/action-popup`, `src/ui/options-page`, `src/ui/side-panel` exposent des pages dédiées au navigateur.
- `src/platform/capabilities.ts` centralise la détection extension/Tauri.
- `src/platform/extensionNetworkLauncher.ts` ouvre les réseaux en onglets navigateur avec validation stricte HTTPS.
- `src/platform/extensionTaskCapture.ts` lit uniquement `tab.url` après un clic explicite sur « Utiliser l’onglet actif »; aucun content script ni host permission n’est requis.
- Le side panel est activé uniquement sur Chrome via `manifest.chrome.config.ts`; Firefox conserve un fallback popup/options/setup.
- Le détail de parité est dans `shipglows_data/technical/extension-parity-map.md`.

## Technical Decisions

- La branche GitHub `main` accepte les changements par pull request avec le statut obligatoire `ShipGlows required gate`. Le workflow `.github/workflows/shipglows-required-gate.yml` s’exécute sur chaque push et pull request vers `main`; il sélectionne les lanes dans le job et publie un succès explicite lorsqu’une lane n’est pas concernée.
- `.shipglows/required-gate.json` déclare les vérifications de l’application (Node 24, tests, tokens, typechecks et lint) et du site (Node 24, build Astro, checks de routes et tests). La ruleset active de la branche par défaut exige la pull request et le statut strict, et conserve les blocages de suppression et de force-push; aucune approbation humaine n’est imposée.
- Tauri est retenu pour la couche desktop/mobile pour partager la même base JS tout en gardant contrôle WebView natif.
- L'application CommunityGlows reste dans `src/ui/setup/pages/CommunityGlows` avec réutilisation contrôlée des modules partagés de `src/`.
- Le runtime Windows/Tauri utilise Reka UI pour les interactions composites et des wrappers/tokens CommunityGlows pour l'autorité visuelle. Les composants PrimeVue et PrimeFlex sont limités aux anciennes surfaces extension; PrimeIcons reste la seule dépendance visuelle Prime active dans l'entrée Windows.
- Dockview est la primitive maintenue spécifique au workspace desktop; les groupes flottants sont désactivés pour conserver les WebViews enfants dans la fenêtre Tauri principale.
- Les commandes WebView desktop revalident à la frontière Rust les identifiants de profil/réseau, les bounds finis et positifs, HTTPS sans credentials et l'allowlist de domaine des réseaux intégrés; les chemins de session ne sont jamais construits à partir de segments arbitraires.
- La stratégie auth-connexion privilégie Convex Auth avec fallback offline.

## Hotspots

- `src/ui/setup/pages/CommunityGlows/App.vue` : flux global, sync, gestion évènements natifs.
- `src/ui/setup/pages/CommunityGlows/components/ui/` et `assets/main.css` : contrats de composants, accessibilité et autorité visuelle Windows.
- `src/ui/setup/pages/CommunityGlows/directives/tooltip.ts` et `src/utils/notifications.ts` : comportements d'infobulle et de notification.
- `src/stores/webviewState.ts` : state réseau actif, ouverture/fermeture et profils.
- `src/ui/setup/pages/CommunityGlows/components/DesktopWorkspace.vue` et `src/lib/desktopWorkspaceLayouts.ts` : docking multi-réseaux, autosave et layouts nommés locaux.
- `src/lib/cloudSync.ts` : sync de settings et données entre local et Convex.
- `src-tauri/src/lib.rs` : commandes natives critiques (webview, session, commande Android).
- `convex/socialAccounts.ts`, `convex/settings.ts`, `convex/profiles.ts` : tables cœur métier.
- `convex/billing.ts` : adaptateur serveur suite-bridge pour l’accès produit et le redemption code, en lecture/écriture via le bridge CommandGlows.
- `src/ui/setup/pages/CommunityGlows/components/BillingAccessPanel.vue` : entrée settings desktop/mobile pour lire l'accès produit et activer un code Lifetime Deal ou early-bird.
- `site/src/config/site.ts` + `site/src/pages/pricing.astro` : route le CTA d'achat vers `communityglows://app/billing`; seul le parcours authentifié de l'app peut démarrer le checkout Stripe central.
- `site/src/pages/purchase/success.astro` et `site/src/pages/purchase/cancel.astro` : pages post-webhook de reprise du parcours direct.

## Read by Task

- Changer UI/UX Windows : lire d'abord `shipglows_data/technical/design-system-authority.md`, `assets/main.css` et `components/ui/`, puis la vue concernée.
- Changer logique métier : lire `src/` puis la vue CommunityGlows correspondante.
- Changer extension shell : lire `src/ui/*`, manifest et `shipglows_data/technical/context-function-tree.md`.
- Changer backend : lire `convex/*`, `src/lib/convex.ts`, `src/lib/convexAuth.ts`, puis mise à jour docs.
- Changer build : lire scripts dans `package.json` puis configs Vite correspondantes.

## Update Rule

### Catalogue : outils commerciaux (2026-09-05)

Breakcold, ClarkUp et Clay sont des services optionnels du catalogue partagé, proposés dans la sélection initiale mais non cochés par défaut. Leurs URLs d'application sont respectivement `https://us.breakcold.com/login`, `https://app.clarkup.com/` et `https://app.clay.com/`, identifiées via les liens de connexion des sites officiels [Breakcold](https://www.breakcold.com/), [ClarkUp](https://clarkup.com/) et [Clay](https://www.clay.com/). Un profil ayant explicitement choisi de tout afficher les voit également.

La sidebar, le Bento, les sélecteurs Vue et les surfaces extension consomment le catalogue. L'extension ouvre leurs applications web ; cet ajout n'installe pas leurs extensions Chrome. Android possède aussi les trois entrées natives et une autorisation d'hôte limitée à chaque sous-domaine d'application. La politique d'isolation existante reste applicable ; aucun cookie d'authentification, domaine OAuth ou changement de User-Agent spécifique n'est supposé. Connexion, détection native de connexion et parcours protégés restent à vérifier sur Windows/Android. Les icônes génériques et couleurs sont des choix de présentation CommunityGlows, pas des logos officiels.

Dex est également disponible avec l'URL fournie `https://getdex.com/`, sous l'identifiant `dex`, dans l'onboarding comme dans l'application, sans sélection par défaut. Les métadonnées Android et l'hôte natif autorisé sont ajoutés ; connexion et redirections authentifiées non vérifiées. [Source officielle : CRM personnel Dex](https://getdex.com/).

### Catégories du catalogue et groupes personnels

- `src/config/socialNetworkGroups.ts` classe les 58 sites dans 12 catégories stables, dont `webdev` et `crm`. Le test de couverture interdit les omissions et doubles affectations. Les identifiants des sites restent indépendants des libellés et des groupes personnels.
- L'onboarding, la sidebar, la sélection des profils, le mobile et les surfaces extension affichent les catégories. Les contrôles individuels existants restent utilisés ; les en-têtes sont des boutons, sans nouvelle case à cocher. Un groupe partiel ou vide se sélectionne entièrement, un groupe complet se désélectionne. Le repli est une action distincte en mode sélection.
- Les préférences restent des `hiddenNetworks` par profil. `setNetworksHidden` applique une sélection groupée en un seul upsert ; `setExtensionNetworksHidden` utilise le verrou partagé des documents extension et relit l'état avant écriture. Aucun groupe n'ouvre automatiquement tous ses sites.
- Dans le Bento, chaque nouvel onglet peut rejoindre sa catégorie ou une destination personnelle choisie dans la barre existante. `communityGlowsCatalogGroupId`, conservé dans les `componentParams` du groupe Dockview, permet de retrouver une catégorie après renommage. Aucun déplacement des panneaux existants ; les anciens layouts restent inchangés.
- Le choix « nouveau groupe » crée un groupe puis cible son identifiant pour les ajouts suivants. Si une destination personnelle n'existe plus, l'ajout reste sans groupe. Les libellés ne sont jamais utilisés comme identifiants ; les limites de 24 panneaux et les frontières de profils/Scènes restent applicables. Une fermeture puis réouverture après disparition du groupe crée un nouveau placement, sans mémoire indépendante des panneaux fermés.
- La structure du catalogue est commune aux surfaces ; la liberté de regroupement d'onglets reste propre au Bento desktop. La barre native Android demeure une navigation mono-site.

Mettre à jour `shipglows_data/technical/context.md` si les flux ci-dessus changent (nouveaux entry points, nouveaux stores critiques, nouveau comportement de sync ou de commande native).
