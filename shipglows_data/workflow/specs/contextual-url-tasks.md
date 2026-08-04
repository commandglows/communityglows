---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "socialglowz"
created: "2026-08-03"
created_at: "2026-08-03 00:00:00 UTC"
updated: "2026-08-03"
updated_at: "2026-08-03 11:45:00 UTC"
status: ready
source_skill: 100-sg-spec
source_model: "GPT-5 Codex"
scope: "gestionnaire de tâches textuelles avec capture explicite d’URL"
owner: "Diane"
user_story: "En tant que créatrice qui repère une conversation ou un post important, je veux créer en quelques secondes une tâche textuelle reliée à son URL, afin de revenir au bon endroit et d’entretenir ma communauté sans automatiser ni extraire le contenu des réseaux."
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "manifest.config.ts"
  - "manifest.chrome.config.ts"
  - "manifest.firefox.config.ts"
  - "src/ui/action-popup/pages/index.vue"
  - "src/ui/setup/pages/SocialGlowz/router/index.ts"
  - "src/ui/setup/pages/SocialGlowz/components/AppSidebar.vue"
  - "src/ui/setup/pages/SocialGlowz/components/MobileLayout.vue"
  - "src/ui/setup/pages/SocialGlowz/App.vue"
  - "src/ui/setup/pages/SocialGlowz/services/kanbanService.ts"
  - "src/stores/kanban.ts"
  - "src/lib/socialGlowzDeepLinks.ts"
  - "src/platform/extensionNetworkLauncher.ts"
  - "src/ui/setup/pages/SocialGlowz/composables/useBackup.ts"
depends_on:
  - artifact: "shipglows_data/business/product.md"
    artifact_version: "1.0.1"
    required_status: reviewed
  - artifact: "shipglows_data/technical/context-function-tree.md"
    artifact_version: "1.0.0"
    required_status: reviewed
  - artifact: "shipglows_data/technical/design-system-authority.md"
    artifact_version: "1.0.0"
    required_status: draft
  - artifact: "shipglows_data/technical/public-webview-platform-boundary.md"
    artifact_version: "1.0.0"
    required_status: reviewed
  - artifact: "shipglows_data/workflow/explorations/2026-08-03-social-platform-compliant-product-directions.md"
    artifact_version: "1.3.0"
    required_status: reviewed
  - artifact: "shipglows_data/workflow/research/social-messaging-crm-compliance.md"
    artifact_version: "1.4.0"
    required_status: reviewed
supersedes: []
evidence:
  - "Le Kanban existant est local (`kanban-state`) et déjà sauvegardé/restauré par `useBackup.ts`, mais ne porte pas une URL de contexte ni de formulaire de création de tâche."
  - "Le popup extension réutilise aujourd’hui `ExtensionParitySurface`; il ne lit aucun onglet et n’injecte aucun contenu tiers."
  - "Le manifeste extension ne déclare ni `host_permissions` ni `content_scripts`; sa permission `tabs` existe déjà pour les lanceurs d’onglets."
  - "`normalizeHttpsUrl` rejette déjà les schémas dangereux, HTTP et les identifiants embarqués; la V1 doit l’étendre à la persistance sûre des liens de tâche."
  - "L’entrée Android reçoit déjà un lien partagé, mais l’ouvre comme réseau; elle doit plutôt proposer la création explicite d’une tâche."
  - "Les politiques de plateformes étudiées interdisent ou encadrent strictement scraping, injection et automatisation; le produit se limite à une URL capturée après geste explicite."
  - "fresh-docs checked: Chrome `activeTab` et Tabs API, ainsi que MDN `tabs.query()`, ont été vérifiés le 2026-08-03."
next_step: "/102-sg-start contextual-url-tasks"
---

# Spec: Tâches contextuelles par URL

## Title

Tâches contextuelles par URL

## Status

Ready — le périmètre fonctionnel, la frontière de conformité, le stockage V1, les surfaces concernées et les preuves attendues sont suffisamment définis pour l’implémentation. La validation rendue devra encore distinguer les checks locaux de la preuve manuelle Chrome/Firefox/Android.

## User Story

En tant que créatrice qui repère une conversation ou un post important, je veux créer en quelques secondes une tâche textuelle reliée à son URL, afin de revenir au bon endroit et d’entretenir ma communauté sans automatiser ni extraire le contenu des réseaux.

## Minimal Behavior Contract

Une tâche contextuelle est un objet SocialGlowz créé par l’utilisateur. Elle contient un titre, une URL HTTPS normalisée, une note facultative, des tags facultatifs, une échéance facultative, une priorité et un état. Son URL est un pointeur vers un lieu de travail : SocialGlowz n’en lit que le protocole et l’hôte, ne charge pas la page pour l’enrichir, et ne collecte aucun contenu tiers.

Dans l’extension, l’utilisateur clique explicitement sur « Utiliser l’onglet actif » dans le popup. Seulement à ce moment, l’extension demande l’onglet actif de la fenêtre courante et ne conserve que son URL après assainissement. Sur desktop, l’utilisateur colle l’URL. Sur Android, le partage système d’une URL HTTPS ouvre le même formulaire de création de tâche prérempli. Dans chaque cas, enregistrer crée une tâche locale et le bouton « Ouvrir » ouvre ultérieurement l’URL dans le contexte navigateur/WebView déjà géré par SocialGlowz.

Le cas limite principal est l’URL elle-même : elle peut contenir un fragment, des identifiants ou des paramètres d’accès. Elle doit être validée et assainie avant tout affichage persistant, export, backup, journal technique ou ouverture.

## Success Behavior

- Le produit présente cette fonction comme un « gestionnaire de tâches contextuelles », jamais comme un scraper, une inbox unifiée ou un CRM de conversations extraites.
- Une tâche créée possède au minimum un titre saisi par l’utilisateur et une URL HTTPS sûre.
- Le formulaire permet de saisir volontairement : titre, note, tags, priorité, échéance et état; aucune de ces valeurs ne provient de la page liée.
- L’hôte et le réseau SocialGlowz éventuellement reconnu sont dérivés de l’URL uniquement, sans lecture du titre d’onglet, favicon, HTML, Open Graph, auteur, image, message ou liste de participants.
- Une tâche nouvellement créée apparaît immédiatement dans la vue « Tâches » et dans le résumé latéral de tâches existant.
- L’utilisateur peut modifier ses champs, déplacer une tâche entre les états, la supprimer et ouvrir l’URL associée.
- Le popup extension peut créer une tâche depuis l’onglet actif après un clic explicite; il n’observe ni l’historique, ni les changements d’onglet, ni la navigation en arrière-plan.
- Le partage Android d’une URL HTTPS ouvre le formulaire de tâche prérempli; il ne déclenche pas automatiquement une navigation vers le réseau.
- Les tâches sont sauvegardées localement dans chaque installation et incluses dans le backup SocialGlowz existant.
- La V1 ne promet aucune synchronisation entre l’extension, le desktop et Android, ni entre plusieurs appareils. Cette synchronisation est un chantier ultérieur séparé.

## Error Behavior

- Une URL vide, invalide, non HTTPS, avec identifiants embarqués, ou utilisant un schéma interdit ne peut pas être enregistrée; le formulaire affiche une explication concise et conserve le texte saisi.
- Si l’onglet actif ne renvoie pas d’URL exploitable (page navigateur, extension, page vide ou API indisponible), le popup affiche l’erreur et laisse l’utilisateur coller une URL HTTPS manuellement.
- Si l’URL contient un fragment ou des paramètres dont le nom évoque un secret (`token`, `access_token`, `auth`, `code`, `state`, `session`, `key`, `secret`, `password`, `sig`, `signature`, sans distinction de casse), ils sont supprimés avant enregistrement et l’interface l’indique. Les autres paramètres sont conservés pour préserver un lien de conversation précis.
- Une erreur de stockage local laisse la tâche non enregistrée, affiche un état d’échec et ne prétend pas que la tâche a été créée.
- Si l’ouverture du lien échoue, la tâche reste intacte et l’interface affiche une erreur sans réafficher l’URL complète dans un toast ou un log.
- Si un ancien état Kanban est illisible, la nouvelle fonctionnalité n’écrase pas la donnée source; elle signale l’erreur et conserve une voie de récupération par backup.

## Problem

Pour servir une vraie communauté, l’utilisatrice doit pouvoir retenir les échanges qui demandent une action humaine — répondre, relancer, remercier ou vérifier un point — sans copier une conversation à la main dans un CRM et sans risquer les politiques des plateformes par un scraper ou une automatisation.

SocialGlowz dispose déjà d’un Kanban local, mais celui-ci est historiquement centré sur des éléments génériques ou des e-mails et ne permet pas de créer rapidement une tâche sûre depuis un lien courant. L’extension ne doit pas devenir une couche qui lit ou modifie les pages sociales, et le produit ne doit pas imposer d’API sociale à une développeuse solo.

## Solution

Faire évoluer le Kanban local en gestionnaire de tâches contextuelles, en préservant les données existantes. Ajouter une vue dédiée « Tâches », un formulaire commun et trois moyens explicites de préremplir l’URL : onglet actif dans le popup extension, collage desktop, partage Android.

La V1 choisit une persistance locale par runtime. Ce choix réduit le lot à l’expérience essentielle et évite de modifier le schéma Convex, le flux d’authentification ou les connecteurs sociaux. Une éventuelle synchronisation cloud devra être spécifiée ultérieurement comme donnée utilisateur SocialGlowz — jamais comme intégration avec les réseaux.

## Scope In

- Définir un contrat `ContextualTask` versionné, local et sans donnée de page tierce.
- Ajouter à ce contrat : URL assainie, hôte dérivé, réseau reconnu facultatif, profil actif facultatif, titre, note, tags, priorité, échéance, état, dates de création/mise à jour et ordre de colonne.
- Ajouter une route et une vue « Tâches » accessibles sur desktop et mobile; conserver la route Gmail actuelle et ne pas transformer silencieusement `/crm` en une autre fonction dans ce lot.
- Réutiliser les colonnes de travail existantes, avec une terminologie utilisateur claire : À faire, En attente, Terminé/Archivé.
- Créer/modifier/supprimer/déplacer/ouvrir une tâche depuis la vue principale et le résumé de sidebar.
- Ajouter un formulaire compact dans le popup extension, avec capture de l’URL de l’onglet actif uniquement après clic explicite.
- Conserver la permission extension actuelle tant que les builds Chrome et Firefox reposent sur `tabs`; ne pas ajouter `host_permissions`, `scripting`, `content_scripts`, `webRequest`, `history`, cookies ou une permission de capture d’écran.
- Ajouter la réception Android de lien partagé vers le formulaire de tâche, sans charger ni inspecter le lien.
- Inclure les tâches dans export/restore local et documenter clairement le caractère non synchronisé de V1.
- Ajouter les tests unitaires, manifestes, i18n et scénarios manuels nécessaires.

## Scope Out

- API officielle d’un réseau social, OAuth social, webhooks, inbox unifiée ou synchronisation de messagerie.
- Scraping, parsing de DOM, content script, injection de tags, lecture du titre de l’onglet, Open Graph, favicon, HTML, image, auteur, message, participant, feed ou historique.
- Auto-like, auto-follow, auto-comment, auto-DM, rappel de page, observation de navigation, tâche automatique ou inférence d’une réponse terminée.
- Enrichissement automatique de contacts, CRM relationnel, score de relation, analytics des conversations ou déduplication basée sur le contenu tiers.
- Synchronisation Convex, partage d’équipe, conflits multi-appareils ou stockage cloud des notes/URLs.
- Migration de la fonction Gmail existante ou changement de la sémantique de `/crm`.
- Support iOS, extension Safari, ou capture directe d’une URL de navigateur externe depuis Tauri desktop.

## Constraints

- Les pages tierces restent intactes : pas de script injecté, pas de modification visuelle, pas de contournement d’anti-bot, pas d’interception réseau.
- Le code de capture extension ne peut appeler que `tabs.query({ active: true, currentWindow: true })` à l’intérieur de l’action explicite de l’utilisateur; il lit uniquement `tab.url` puis écarte l’objet `Tab` complet.
- Aucun appel de capture ne peut être effectué au montage du popup, dans le background service worker, sur événement de navigation ou sur événement d’historique.
- Aucun champ de tâche ne peut être automatiquement prérempli avec `tab.title`, `favIconUrl`, le contenu de l’URL hors hôte, ou une donnée issue de la page. Le titre reste saisi par l’utilisateur.
- Les URLs persistent seulement après normalisation HTTPS, rejet des identifiants, suppression du fragment et suppression des paramètres à nom sensible. Ne jamais stocker `pendingUrl`.
- Les URLs complètes et les notes sont des données potentiellement sensibles : elles ne vont ni dans Sentry, ni dans console, ni dans les messages de toast, ni dans une télémétrie. Les diagnostics utilisent seulement un code d’erreur et, au besoin, un hôte redacted.
- La première version est locale à chaque runtime. Le mot « synchronisé » ne doit apparaître ni dans l’UI ni dans la documentation de cette fonction.
- Toute modification visuelle réutilise les tokens de `main.css`/`base.css`, PrimeVue/DaisyUI et les règles d’accessibilité du design-system authority; aucun nouveau littéral visuel ad hoc.
- Le contrat central de profils et le catalogue `src/config/socialNetworks.ts` restent les sources de vérité pour reconnaître un réseau à partir du seul hôte.

## Test Contract

- Une suite unitaire couvre la validation/assainissement d’URL : HTTPS, hostname, suppression fragment, paramètres sensibles, HTTP, schémas interdits, identifiants, URL malformée et absence d’URL.
- Une suite unitaire couvre le modèle/service de tâche : création, édition, déplacement, suppression, tri, réhydratation, rétrocompatibilité Kanban et échec de stockage.
- Une suite unitaire du popup simule `chrome.tabs.query` et vérifie qu’il n’est appelé qu’après clic, avec `{ active: true, currentWindow: true }`, et que seul `url` est passé au formulaire.
- Une suite manifeste vérifie l’absence de `host_permissions`, `content_scripts`, `scripting`, `webRequest`, `history`, cookies et capture-écran dans le manifeste de production; elle vérifie que `tabs` est justifié par le popup/la compatibilité Firefox.
- Une suite Android/deep-link vérifie qu’un partage HTTPS émet une intention de création de tâche et que les liens non HTTPS restent rejetés.
- Des tests de composant couvrent les états vide, URL refusée, tâche sauvegardée, erreurs de persistance et ouverture de lien échouée sans fuite de texte sensible.
- Les tests existants de `socialGlowzDeepLinks`, `extensionNetworkLauncher`, `manifest`, `cloudSync` et backup restent verts.

## Dependencies

- Locales : Vue 3, Pinia, vue-router, PrimeVue, vue-i18n, CRXJS/Vite, Tauri Android WebView et le stockage local existant.
- Contrats internes : `src/platform/extensionNetworkLauncher.ts`, `src/lib/socialGlowzDeepLinks.ts`, `src/config/socialNetworks.ts`, `src/ui/setup/pages/SocialGlowz/composables/useBackup.ts`.
- Documentation de conformité : `shipglows_data/technical/public-webview-platform-boundary.md` et `shipglows_data/workflow/research/social-messaging-crm-compliance.md`.
- Documentation fraîche : [Chrome activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab), [Chrome Tabs API](https://developer.chrome.com/docs/extensions/reference/api/tabs) et [MDN tabs.query](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/query), vérifiées le 2026-08-03. Chrome indique que `tabs` donne accès aux propriétés sensibles d’un onglet; l’implémentation doit limiter strictement l’usage à l’URL et au geste explicite. MDN confirme qu’en Firefox `tab.url` requiert `tabs` ou une permission d’hôte correspondante.

## Invariants

- SocialGlowz organise le travail humain; il ne prétend pas lire, classer ou répondre à une conversation sur un réseau tiers.
- Une tâche est une donnée possédée et écrite par l’utilisateur; l’URL est seulement un pointeur vers un contexte.
- Toute interaction sur le réseau lié reste un geste manuel de l’utilisateur dans l’interface officielle.
- Les plateformes WebView et le build extension conservent l’interdiction de scripts tiers, d’overlays et de surveillance.
- Les données Kanban existantes ne sont ni supprimées ni écrasées pendant une migration; toute migration est idempotente et testée sur un état ancien.
- Le stockage de tâche est local par runtime jusqu’à une spec de synchronisation dédiée.
- Le produit ne déduit jamais automatiquement qu’une tâche est terminée; seul l’utilisateur modifie son état.

## Links & Consequences

- Produit : la promesse se déplace de la « croissance » artificielle vers un suivi fiable des personnes et conversations importantes, sans fausse promesse d’inbox unifiée.
- Conformité : la valeur provient de l’organisation de données SocialGlowz, non de l’accès au contenu des plateformes. Cela réduit les risques de termes d’utilisation et de review de stores.
- Architecture : la capture d’URL doit être une petite capacité isolée de l’extension, non un mécanisme de content script. La donnée de tâche doit vivre dans un service/store dédié plutôt que dans une API sociale.
- Données : le stockage local accélère V1 mais implique des listes distinctes entre extension, desktop et Android. L’UI doit être honnête sur cette limite.
- UX : le premier moment utile est « j’ai vu un échange, j’ai créé une tâche en moins d’une minute, et je peux rouvrir exactement ce lien ».
- Sécurité : les URLs peuvent contenir des secrets. Leur traitement est couvert par validation, assainissement et redaction de diagnostics dès la première version.
- Atlas : non applicable; aucun projet-owned Atlas n’a été détecté dans ce dépôt.

## Documentation Coherence

- Mettre à jour `README.md` avec le vocabulaire « tâches contextuelles », le stockage local V1 et l’absence de scraping/API sociale.
- Mettre à jour `shipglows_data/technical/context.md` et `context-function-tree.md` avec la nouvelle route, le store de tâche, la capture popup et l’entrée Android partagée.
- Mettre à jour `shipglows_data/technical/extension-parity-map.md` si l’entrée popup ou les permissions changent.
- Mettre à jour `shipglows_data/technical/public-webview-platform-boundary.md` seulement si une intégration modifie réellement les capacités de WebView; cette spec ne l’autorise pas.
- Ajouter la note de version utilisateur à `shipglows_data/workflow/changelog.md` lorsque la fonctionnalité est livrée.
- Ne pas modifier les documents historiques dans `shipglows_data/workflow/archives/`.

## Edge Cases

- L’utilisateur ouvre le popup sur `chrome://`, `about:`, une page extension ou une URL non engagée : la capture échoue proprement et le collage manuel reste possible.
- L’onglet actif change pendant que le popup est ouvert : seule l’URL retournée au clic est utilisée; aucune écoute ultérieure n’est installée.
- L’utilisateur colle un domaine sans protocole : le formulaire peut proposer sa normalisation vers HTTPS, mais ne peut jamais accepter HTTP.
- Une URL contient un fragment utile : V1 le supprime par principe de minimisation; l’interface doit prévenir avant sauvegarde si une donnée a été retirée.
- Une URL sociale utilise des paramètres nécessaires qui ressemblent à un secret : le paramètre est retiré; l’utilisateur peut rouvrir la destination puis se reconnecter sur l’interface officielle si nécessaire.
- Un réseau inconnu ou un lien externe reste enregistrable : il est affiché avec son hôte et une icône générique, pas avec une métadonnée inventée.
- L’utilisateur crée deux tâches avec le même lien : V1 les conserve comme deux intentions distinctes; aucune déduplication de contenu ni d’URL n’est faite.
- Un backup d’une version antérieure ne possède pas de tâches contextuelles : sa restauration continue sans erreur et initialise une liste vide.
- Le profil actif change : les tâches existantes conservent le `profileId` capturé s’il existe, mais l’ouverture ne contourne jamais les règles de sessions de la plateforme.
- La popup se ferme avant l’enregistrement : aucun brouillon non sollicité et aucune URL ne sont conservés.

## Implementation Tasks

- [ ] Task 1: Écrire le contrat de tâche et l’assainisseur d’URL.
  - Files: `src/services/contextualTasksService.ts`, `src/services/contextualTasksService.test.ts`, `src/platform/extensionNetworkLauncher.ts`.
  - Action: Définir `ContextualTask`, ses limites de longueur, ses états/priorités et une fonction pure de normalisation/assainissement. Réutiliser le parseur HTTPS existant sans élargir les protocoles autorisés; supprimer fragments et paramètres à nom sensible.
  - User story link: La tâche ne conserve qu’un contexte sûr et volontaire.
  - Depends on: None.
  - Validate with: Vitest ciblé pour les URLs et le contrat de données.
  - Notes: Ne pas modifier une URL entrée par l’utilisateur sans exposer le fait que des éléments sensibles ont été retirés.

- [ ] Task 2: Ajouter un store local dédié et une migration Kanban sans perte.
  - Files: `src/stores/contextualTasks.ts`, `src/services/contextualTasksService.test.ts`, `src/ui/setup/pages/SocialGlowz/services/kanbanService.ts`, `src/stores/kanban.ts`.
  - Action: Choisir une clé locale versionnée pour les tâches contextuelles et migrer de manière idempotente les éléments Kanban de type `task` lorsque cela est possible, sans supprimer ni réécrire aveuglément `kanban-state`. Conserver les e-mails/notes Kanban existants hors de la nouvelle vue si leurs données ne satisfont pas le contrat de tâche.
  - User story link: Les tâches sont durables sans perdre l’existant.
  - Depends on: Task 1.
  - Validate with: tests de migration, rechargement, ordre et échec de `localStorage`.
  - Notes: Le store ne dépend ni de Convex ni de l’authentification.

- [ ] Task 3: Créer la vue et le formulaire partagés de tâches.
  - Files: `src/ui/setup/pages/SocialGlowz/views/TasksView.vue`, `src/ui/setup/pages/SocialGlowz/components/tasks/TaskForm.vue`, `src/ui/setup/pages/SocialGlowz/components/tasks/TaskBoard.vue`, `src/ui/setup/pages/SocialGlowz/router/index.ts`.
  - Action: Ajouter `/tasks`, un état vide utile, création, édition, déplacement, suppression et ouverture. Le formulaire demande un titre et une URL, puis propose note, tags, priorité, échéance et état. Afficher l’hôte et le réseau reconnu uniquement comme dérivés de l’URL.
  - User story link: L’utilisateur retrouve et fait progresser son travail de communauté.
  - Depends on: Tasks 1-2.
  - Validate with: test de composant/formulaire, navigation route et smoke desktop/mobile.
  - Notes: Conserver `/gmail` et son alias `/crm` dans V1; ne pas recycler la vue Gmail comme écran de tâches.

- [ ] Task 4: Intégrer les tâches à la navigation et au résumé existant.
  - Files: `src/ui/setup/pages/SocialGlowz/components/AppSidebar.vue`, `src/ui/setup/pages/SocialGlowz/components/MobileLayout.vue`, `src/locales/fr.json`, `src/locales/en.json`.
  - Action: Ajouter une entrée « Tâches » dans les navigations desktop/mobile et remplacer le résumé Kanban latéral uniquement si la migration garantit la compatibilité; sinon ajouter un résumé de tâches indépendant. Ajouter les messages de validation, de confidentialité et d’échec nécessaires en français/anglais.
  - User story link: La tâche est accessible sans détour dans les surfaces principales.
  - Depends on: Task 3.
  - Validate with: contrôle des clés i18n, navigation clavier, état vide et audit de contraste/focus.
  - Notes: Employer une copie brève : « URL capturée à votre demande », jamais « conversation importée ».

- [ ] Task 5: Ajouter le formulaire rapide du popup extension et la capture à la demande.
  - Files: `src/ui/action-popup/pages/index.vue`, `src/platform/extensionTaskCapture.ts`, `src/platform/extensionTaskCapture.test.ts`, `manifest.config.ts`, `src/platform/manifest.test.ts`.
  - Action: Ajouter au popup un formulaire compact qui utilise le même contrat de tâche. Le bouton « Utiliser l’onglet actif » appelle le wrapper de capture; celui-ci interroge uniquement l’onglet actif de la fenêtre courante après clic et transmet son URL assainie au formulaire. Revoir le manifeste pour confirmer que `tabs` reste la permission minimale compatible Chrome/Firefox pour cette V1.
  - User story link: La capture d’un lien social devient rapide sans lire la page.
  - Depends on: Tasks 1-2.
  - Validate with: Vitest mockant Chrome/Firefox, build Chrome, build Firefox et smoke manuel avec un lien HTTPS, `chrome://`/`about:`, une URL avec fragment et une URL avec token.
  - Notes: Pas de `activeTab` additionnel en V1 si `tabs` reste nécessaire à Firefox; pas de `host_permissions`, de `scripting` ou de content script.

- [ ] Task 6: Raccorder le partage Android au formulaire de tâche.
  - Files: `src/lib/socialGlowzDeepLinks.ts`, `src/lib/socialGlowzDeepLinks.test.ts`, `src/ui/setup/pages/SocialGlowz/App.vue`, `src/ui/setup/pages/SocialGlowz/views/TasksView.vue`.
  - Action: Étendre l’intention de deep-link avec `create-task` pour une URL HTTPS partagée. À la réception, afficher le formulaire de tâche prérempli au lieu d’ouvrir automatiquement un réseau. Préserver l’ouverture de réseau pour les deep links SocialGlowz explicites existants.
  - User story link: Depuis Android, partager un lien rend le même premier résultat utile qu’en extension.
  - Depends on: Tasks 1-3.
  - Validate with: tests de résolution, test d’intégration d’intention et smoke sur appareil Android pour URL reconnue/inconnue/non HTTPS.
  - Notes: L’hôte peut être reconnu, mais l’app ne doit pas charger le lien pour obtenir davantage de métadonnées.

- [ ] Task 7: Inclure les tâches dans backup/restauration et protéger les diagnostics.
  - Files: `src/ui/setup/pages/SocialGlowz/composables/useBackup.ts`, tests associés, `src/lib/buildDiagnostics.ts` si nécessaire.
  - Action: Ajouter la clé locale versionnée de tâches au backup/restore. S’assurer que les erreurs et diagnostics redigent les URLs et n’incluent jamais titre, note ou tags.
  - User story link: Le travail saisi reste récupérable sans fuite de contexte sensible.
  - Depends on: Task 2.
  - Validate with: test export/restore, test de redaction et inspection manuelle d’un échec simulé.
  - Notes: Aucun envoi Convex/Sentry n’est ajouté.

- [ ] Task 8: Vérifier les frontières et documenter la livraison.
  - Files: `README.md`, `shipglows_data/technical/context.md`, `shipglows_data/technical/context-function-tree.md`, `shipglows_data/technical/extension-parity-map.md`, `shipglows_data/workflow/changelog.md`.
  - Action: Documenter le contrat de capture URL, les données interdites, la limite de stockage local V1, les permissions extension conservées et la procédure de vérification multi-plateforme.
  - User story link: L’utilisatrice et la mainteneuse comprennent exactement ce que le produit fait et ne fait pas.
  - Depends on: Tasks 1-7.
  - Validate with: lint de métadonnées, recherche des termes obsolètes et relecture de cohérence.
  - Notes: Toute évolution vers une synchronisation cloud ou une API sociale doit passer par une nouvelle spec.

## Acceptance Criteria

- Depuis le popup Chrome et Firefox, un clic explicite permet de préremplir l’URL de l’onglet actif puis de sauvegarder une tâche sans aucun accès au contenu de la page.
- Aucune capture d’URL ne se produit automatiquement et aucune API de content script, scripting, host permission, historique, webRequest, cookies ou capture d’écran n’est ajoutée.
- Depuis desktop, une tâche peut être créée avec une URL HTTPS collée; depuis Android, un lien partagé HTTPS ouvre le formulaire de tâche plutôt qu’un réseau automatiquement.
- La vue `/tasks` permet de créer, lire, modifier, déplacer, supprimer et rouvrir les tâches locales; elle fonctionne avec une liste vide.
- Les tâches affichent les champs saisis par l’utilisateur et le seul enrichissement dérivé autorisé : hôte, réseau connu éventuel, profil choisi, dates, état et priorité.
- Les titres d’onglet, DOM, Open Graph, messages, profils, images, auteurs, participants et historique ne sont ni lus, ni affichés, ni stockés.
- Les URL dangereuses sont refusées; les fragments, identifiants et paramètres à nom sensible ne persistent pas.
- Les tâches sont présentes dans le backup/restauration local; aucune promesse de sync inter-runtime ou multi-appareil n’est faite.
- Les données Kanban existantes ne disparaissent pas à la mise à jour.
- `pnpm test:once`, `pnpm typecheck`, `pnpm build:chrome` et `pnpm build:firefox` passent, puis la vérification manuelle Chrome/Firefox/Android est consignée.

## Test Strategy

1. Tests unitaires purs : URL, secret stripping, réseau par hôte, modèle de tâche, migration et stockage.
2. Tests d’adaptateurs : Chrome callback API et Firefox Promise API, sans ouvrir réellement un onglet.
3. Tests de composants : formulaire et liste, erreurs, conservation des valeurs, aucune fuite d’URL/note dans un message.
4. Builds : typecheck, tests, manifests générés Chrome et Firefox.
5. Smoke Chrome/Firefox : créer une tâche depuis une page HTTPS; vérifier que l’onglet courant n’est interrogé qu’au clic; essayer une page interne et un lien avec paramètres sensibles; rouvrir la tâche.
6. Smoke desktop : créer, déplacer, éditer, supprimer et restaurer une tâche avec URL collée.
7. Smoke Android : partager une URL reconnue puis inconnue; confirmer l’ouverture du formulaire, l’absence de navigation automatique et la création locale.
8. Régression conformité : exécuter le scan de frontière WebView défini dans `public-webview-platform-boundary.md` et inspecter le manifeste final.

## Risks

| Risque | Niveau | Mitigation | Signal d’arrêt |
|---|---:|---|---|
| Une réutilisation du Kanban efface des éléments existants | élevé | clé de tâche versionnée, migration idempotente, fixtures d’états anciens et backup avant migration | toute perte ou réordonnancement non attendu en test |
| Une permission extension devient trop large | élevé | conserver le manifeste sans host/content/script et n’interroger qu’un onglet actif après clic | ajout de permission ou appel automatique de `tabs.query` |
| Une URL stockée contient un secret | élevé | validation centralisée, stripping, tests de redaction, aucun log de donnée utilisateur | URL complète, note ou token observé dans log/Sentry/toast |
| L’UX prétend importer une conversation | moyen | copy explicitement centrée sur l’URL et la note saisie | référence à « message importé », « CRM auto » ou « inbox » |
| Les listes divergent entre appareils | moyen | annoncer le stockage local V1; créer une spec dédiée avant Convex | une UI promet ou suggère une sync inexistante |
| Partage Android régressant les deep links réseau | moyen | type d’intention distinct, tests des deux chemins | un `socialglowz://…/open` ne rouvre plus un réseau |

## Execution Notes

- Décision avant → après : d’un CRM enrichi/scrapé ou d’intégrations sociales coûteuses vers un gestionnaire de tâches textuelles à capture d’URL explicite. Déclencheur : besoin de gérer une vraie communauté sans opérations manuelles de copie, sans fake engagement et sans risque de conditions d’utilisation. Classification : décision produit et conformité matérielle.
- Le stockage local est un compromis assumé de V1 : l’objectif est de valider la boucle utile, pas de concevoir dès maintenant une couche de sync et de conflits.
- La tâche doit rester un « système de mémoire et d’action » de l’utilisateur, pas un miroir d’une plateforme tierce.
- Les logs existants de diagnostic ont déjà une redaction d’URL; l’implémentation doit la réutiliser ou la renforcer, sans ajouter de reporting distant.

## Open Questions

None. Les décisions différées — sync cloud, collaboration, API officielle et enrichissement de données — sont explicitement hors scope et nécessitent une nouvelle spec avant tout développement.

## Skill Run History

- 2026-08-03 — `700-sg-explore` : exploration des directions produit compatibles avec les plateformes; recommandation d’un CRM textuel relié par URL.
- 2026-08-03 — `203-sg-research` : recherche de conformité sur injection, extraction de conversations, scraping et APIs sociales; frontière « URL explicite seulement » validée comme direction prudente.
- 2026-08-03 — `100-sg-spec` : première version de la spec d’implémentation, sans mise en œuvre de code.
- 2026-08-03 — `101-sg-ready` : revue de structure, cohérence produit, sécurité, fraîcheur des APIs et preuve; résultat `ready` après fermeture explicite des questions et vérification du contrat de test.
- 2026-08-03 — `102-sg-start` : implémentation du service/store local, migration Kanban non destructive, vue `/tasks`, capture popup, partage Android, backup et documentation; résultat `implemented`, avec preuve locale automatisée terminée.
- 2026-08-03 — `001-sg-build` : orchestration de l’implémentation V1; résultat `partial` pour le chantier global, avec implémentation locale complète et preuve manuelle des surfaces popup/desktop/Android encore à exécuter.

## Current Chantier Flow

```text
exploration/research (terminés)
          ↓
spec contextual-url-tasks (ready)
          ↓
implementation V1 (/102-sg-start)
          ↓
tests locaux terminés
          ↓
smoke Chrome/Firefox/Desktop/Android (/103-sg-verify)
```
