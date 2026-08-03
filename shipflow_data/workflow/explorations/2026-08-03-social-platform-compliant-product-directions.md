---
artifact: exploration_report
metadata_schema_version: "1.0"
artifact_version: "1.3.0"
project: "socialglowz"
created: "2026-08-03"
updated: "2026-08-03"
status: reviewed
source_skill: 700-sg-explore
scope: "cartographie d'un produit de gestion de communauté compatible avec les règles des réseaux sociaux"
owner: "Diane"
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "shipflow_data/business/project-competitors-and-inspirations.md"
  - "shipflow_data/business/product.md"
  - "shipflow_data/business/gtm.md"
  - "shipflow_data/technical/public-webview-platform-boundary.md"
  - "src/config/socialNetworks.ts"
evidence:
  - "https://www.facebook.com/terms"
  - "https://developers.tiktok.com/doc/content-sharing-guidelines"
  - "https://docs.x.com/developer-terms/policy"
  - "https://help.x.com/en/rules-and-policies/x-automation"
  - "https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-api-migration-guide"
  - "https://docs.discord.com/developers/platform/bots"
  - "https://support.discord.com/hc/en-us/articles/115002192352-Automated-User-Accounts-Self-Bots"
  - "https://docs.bsky.app/docs/support/developer-guidelines"
  - "https://docs.bsky.app/docs/advanced-guides/rate-limits"
  - "https://docs.joinmastodon.org/methods/statuses/"
  - "https://redditinc.com/policies/developer-terms"
  - "https://developers.google.com/youtube/terms/developer-policies-guide"
depends_on:
  - artifact: "shipflow_data/business/project-competitors-and-inspirations.md"
    artifact_version: "1.2.1"
    required_status: reviewed
supersedes: []
next_step: "/100-sg-spec cockpit social conforme phase 1"
---

# Exploration Report: directions produit conformes aux plateformes sociales

## Starting Question

Quelles grosses fonctionnalités permettent à SocialGlowz d'aider ses utilisateurs à gérer une vraie communauté, tout en réduisant le risque de violation des conditions des réseaux sociaux ?

Décisions opérateur du 2026-08-03 : le produit doit privilégier les relations authentiques, exclure les faux likes et l'engagement artificiel, et éviter toute intégration API lourde. Le CRM retenu est manuel et textuel ; il ne conserve d'un réseau tiers qu'une URL de tâche explicitement capturée par l'utilisateur.

## Context Read

- `README.md` — architecture multi-surface et promesse actuelle.
- `shipflow_data/technical/context.md` — flux WebView, isolation de session, sync et frontières publiques.
- `shipflow_data/technical/context-function-tree.md` — points d'intégration existants.
- `shipflow_data/business/project-competitors-and-inspirations.md` — benchmark des workspaces multi-apps et pistes social/CRM/analytics.
- `shipflow_data/business/product.md` et `gtm.md` — cible, non-objectifs et positionnement.
- `src/config/socialNetworks.ts` — catalogue réel des réseaux intégrés.

## Internet Research

Sources officielles consultées le 2026-08-03 :

- [Meta Terms of Service](https://www.facebook.com/terms) — interdit l'accès ou la collecte automatisés sans autorisation et le contournement des mesures techniques.
- [TikTok Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines) — Direct Post impose consentement/UX, audit, plafonds et visibilité privée pour les clients non audités.
- [X Developer Policy](https://docs.x.com/developer-terms/policy) et [Automation Rules](https://help.x.com/en/rules-and-policies/x-automation) — API officielle, restrictions anti-spam, anti-duplication et sur les interactions automatisées.
- [LinkedIn Community Management API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-api-migration-guide) — publication, engagement et analytics possibles après OAuth et examen d'accès, avec limites en tier Development.
- [Discord Bots & Companion Apps](https://docs.discord.com/developers/platform/bots) et [Self-Bots](https://support.discord.com/hc/en-us/articles/115002192352-Automated-User-Accounts-Self-Bots) — bots/webhooks officiels permis ; automatiser un compte utilisateur normal est interdit.
- [Bluesky Developer Guidelines](https://docs.bsky.app/docs/support/developer-guidelines) et [Rate Limits](https://docs.bsky.app/docs/advanced-guides/rate-limits) — API ouverte, mais interactions en masse/spam interdites et obligations de modération pour les apps sociales.
- [Mastodon statuses API](https://docs.joinmastodon.org/methods/statuses/) — publication officielle via OAuth `write:statuses`, avec variations possibles selon l'instance.
- [Reddit Developer Terms](https://redditinc.com/policies/developer-terms) — usage commercial normalement soumis à accord séparé, restrictions fortes sur données, rétention, contournement et entraînement IA.
- [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies-guide) — uploads et données via API officielle, consentement et exigences UX ; audit possible et uploads privés par défaut pour certains projets non vérifiés.

## Problem Framing

SocialGlowz doit distinguer trois couches :

1. **Le cockpit propriétaire** : données et UX créées par SocialGlowz, indépendantes des contenus des réseaux.
2. **Le shell WebView** : l'utilisateur manipule lui-même l'interface officielle ; SocialGlowz organise les sessions sans automatiser ni extraire.
3. **Les connecteurs API** : actions et données autorisées explicitement par OAuth, scopes, revues et quotas propres à chaque réseau.

La frontière essentielle est simple : assister l'utilisateur pour mieux connaître et servir sa communauté est généralisable ; simuler une relation ou agir silencieusement à sa place dans les pages web ne l'est pas.

## Refined Product Thesis: Community Relationship OS

SocialGlowz ne devrait pas devenir un « outil de croissance sociale » générique. Sa direction différenciante peut être un **Community Relationship OS** : un espace où un créateur ou une petite équipe sait qui compose sa communauté, quelles conversations méritent une réponse, quelles personnes reviennent, quels besoins émergent et quelle relation entretenir ensuite.

La promesse n'est pas « obtenir plus d'engagement ». Elle devient :

> Ne laisse plus les personnes importantes de ta communauté se perdre entre tes réseaux.

Le produit organise le travail humain sans fabriquer la relation ni collecter les données d'autrui : l'utilisateur rédige la tâche et son contexte dans SocialGlowz, puis rattache volontairement une URL à l'action à effectuer. SocialGlowz ne lit ni le contenu, ni le DOM, ni les messages de la page liée.

### Community Value Loop

`repérer une conversation -> capturer son lien -> consigner l'action -> répondre dans le réseau -> clôturer ou relancer`

- **Repérer** : l'utilisateur identifie lui-même une conversation ou un post qui mérite une action.
- **Capturer** : un bouton explicite enregistre uniquement l'URL HTTPS de l'onglet actif, ou le lien partagé/collé ; aucune lecture de la page.
- **Comprendre** : l'utilisateur rédige un titre, des notes et des tags dans SocialGlowz ; ce sont ses propres données textuelles.
- **Répondre** : le bouton de tâche rouvre l'URL dans le profil/réseau concerné ; l'utilisateur agit directement sur l'interface officielle.
- **Suivre** : SocialGlowz gère état, rappel, priorité et notes de suivi ; aucun statut de message tiers n'est inféré.
- **Apprendre** : les synthèses portent sur les tâches créées par l'utilisateur, jamais sur des conversations extraites.

### Capture Boundary

La fonctionnalité n'est pas un scraper. C'est une **capture de lien explicite** :

| Autorisé | Interdit |
|---|---|
| lire l'URL de l'onglet actif après clic utilisateur ; recevoir une URL par partage système ; coller une URL ; stocker une tâche textuelle SocialGlowz ; rouvrir le lien | injecter un script ; lire le DOM ; extraire un message, un profil ou une liste ; capturer l'historique ; surveiller la navigation ; modifier la page tierce |

L'URL est un pointeur vers le travail, pas une donnée sociale aspirée. La tâche reste textuelle et entièrement contrôlée par son créateur.

## Compliance Zones

| Zone | Exemples | Position produit |
|---|---|---|
| Verte | workspaces, profils isolés, favoris, focus, hibernation, notes, tâches, calendrier éditorial local, bibliothèque de contenus possédés par l'utilisateur, rappels | cœur commun à construire |
| Verte conditionnelle | publication, analytics, commentaires, webhooks via API officielle et OAuth | connecteurs progressifs, feature flags et preuve d'autorisation |
| Orange | inbox unifiée, veille, CRM enrichi, réplication multi-réseaux | seulement si chaque donnée/action possède une API et une base contractuelle claires |
| Rouge | scraping DOM, injection qui modifie les réseaux, auto-like/follow/comment/DM, imitation de comportement humain, CAPTCHA bypass, collecte de profils, partage de cookies ou mots de passe | hors produit |

## Platform Families

| Famille | Réseaux SocialGlowz concernés | Opportunité réaliste |
|---|---|---|
| Toutes les URLs HTTPS prises en charge | réseaux du catalogue et liens externes | l'utilisateur peut créer une tâche textuelle et pointer vers l'endroit précis où agir, sans intégrer ni lire le réseau |
| Capture extension explicite | navigateur Chrome/Firefox | lire uniquement l'URL de l'onglet actif à la demande ; pas de content script |
| Capture mobile explicite | Android/Tauri | recevoir une URL via la feuille de partage, puis créer la tâche |
| Capture desktop | Tauri | coller l'URL ou l'ouvrir depuis une tâche ; aucune interception de contenu WebView |

Cette classification est une décision produit prudente, pas un avis juridique. Chaque connecteur doit être revalidé au moment de sa spécification car les politiques changent.

## Option Space

### Option A: super-workspace social

- Résumé : approfondir Rambox/Station/Freeter pour les réseaux sociaux.
- Fonctions : workspaces client/marque, profils isolés, groupes, changement rapide, hibernation, notifications par réseau, focus, recherche dans les objets SocialGlowz.
- Avantages : forte compatibilité multi-réseaux, différenciation déjà crédible, faible dépendance aux APIs.
- Limites : la valeur reste organisationnelle si aucun workflow propriétaire n'est ajouté.

### Option B: cockpit éditorial assisté

- Résumé : préparer le travail avant l'ouverture du réseau et guider la publication manuelle ou API.
- Fonctions : calendrier, drafts multi-variantes, bibliothèque média, checklists par réseau, validation humaine, liens d'ouverture vers le bon profil/réseau, journal de publication déclaré par l'utilisateur.
- Avantages : valeur transverse, données possédées par l'utilisateur, terrain naturel pour IA de rédaction et adaptation.
- Limites : la publication automatique universelle est impossible ; l'état publié doit venir de l'API ou d'une confirmation utilisateur, jamais du scraping.

### Option C: couche d'exécution API

- Résumé : publier, répondre et mesurer via connecteurs officiels.
- Fonctions : connecteurs Bluesky/Mastodon d'abord, puis LinkedIn/Meta/TikTok/X selon approbations.
- Avantages : workflows puissants et mesurables.
- Limites : coûts, quotas, audits, scopes, maintenance permanente et disparités fonctionnelles.

### Option D: CRM relationnel textuel relié par URL

- Résumé : une tâche est une fiche textuelle SocialGlowz reliée à une URL précise où le travail doit être fait.
- Fonctions : titre, notes, tags, état, échéance, priorité, profil/réseau deviné depuis l'URL, et bouton « ouvrir la tâche ».
- Avantages : universel, sans API, sans scraping, sans extension intrusive, faisable pour un solo dev et utile dès le premier lien.
- Limites : SocialGlowz ne sait pas automatiquement si l'action est terminée ni ce que contient la conversation ; l'utilisateur le décide.

### Option E: analytics d'opérations

- Résumé : mesurer le workflow SocialGlowz avant de prétendre remplacer les analytics des réseaux.
- Fonctions : temps de préparation, cadence, contenus planifiés/publiés, couverture réseau, délais de réponse déclarés ou fournis par API, progression des tâches.
- Avantages : contrôlable et utile immédiatement ; évite les vanity metrics.
- Limites : les impressions/engagements natifs restent dépendants de chaque API.

## Emerging Recommendation

Construire un **Social Operating System à validation humaine**, en trois horizons :

1. **CRM textuel universel** : tâche, note, état, priorité, rappel et URL, sans aucune donnée de page tierce.
2. **Capture de lien à friction minimale** : bouton extension « créer une tâche depuis cet onglet », partage Android et collage desktop ; l'utilisateur ne rédige que l'intention, pas une copie du réseau.
3. **Ouverture sûre** : l'URL stockée est validée HTTPS, sans identifiants ; un clic rouvre le bon réseau/profil.

Le modèle de capacité doit empêcher l'UX de promettre une parité fictive : pour chaque réseau, déclarer `manual_open`, `api_publish`, `api_read`, `api_analytics`, `api_inbox`, `webhook`, `approval_status`, quotas et date de dernière vérification.

## Product Shape

```text
                  SOCIALGLOWZ
                      |
        +-------------+-------------+
        |             |             |
   Page tierce        Capture URL       CRM SocialGlowz
   (intacte)          (à la demande)    (textuel)
        |             |             |
   interface native  URL uniquement    note/tags/rappels
   aucun script      profil deviné      état/priorité
   aucun scraping    validation HTTPS  ouvre le lien
```

## Prioritized Feature Map

| Priorité | Grande fonctionnalité | Risque plateforme | Impact attendu |
|---:|---|---:|---:|
| P0 | registre de capacités et règles par réseau | faible | très élevé |
| P0 | workspaces client/marque + profils isolés + changement rapide | faible à moyen | très élevé |
| P0 | tâche CRM textuelle : titre, note, tags, priorité, état, rappel et URL | faible | très élevé |
| P0 | capture d'URL à la demande dans extension, Android et desktop | faible | très élevé |
| P1 | ouverture de tâche dans le bon réseau/profil avec validation HTTPS | faible | élevé |
| P1 | vues de travail : à répondre, relance, attente, terminé | faible | élevé |
| P1 | focus, hibernation et centre de notifications contrôlé par l'app | faible à moyen | élevé |
| P1 | cockpit éditorial local alimenté par les vraies questions de la communauté | faible | élevé |
| P1 | rituels communautaires : accueil, suivi, questions hebdomadaires, remerciements à valider | faible | élevé |
| P2 | publication Bluesky/Mastodon + Discord webhook/bot | moyen | élevé |
| P2 | analytics de santé relationnelle SocialGlowz | faible | moyen à élevé |
| P3 | LinkedIn Community Management | élevé, review | élevé pour B2B |
| P3 | Meta/TikTok/X/YouTube selon demandes utilisateurs | élevé, review/coût | variable |
| Hors scope | automation DOM, engagement de masse, scraping, credential sharing | critique | négatif |

## Value Loop And Metrics

Boucle de valeur proposée :

`voir une conversation -> créer une tâche depuis son URL -> formuler l'intention -> rouvrir le lien -> répondre -> clôturer ou relancer`

Activation utile : première tâche créée depuis un lien et réouverte avec succès. Rétention : un rappel repris puis une tâche clôturée ou relancée. Ces signaux valent davantage que le nombre d'ouvertures de WebViews, de posts ou de likes.

### Metrics That Match The Promise

- délai médian avant première réponse utile ;
- proportion de questions qui reçoivent un suivi ;
- conversations résolues plutôt que volume brut de messages ;
- membres revenant dans une conversation ou un rituel ;
- promesses et actions de suivi tenues ;
- thèmes communautaires transformés en amélioration, ressource ou contenu ;
- charge de la communauté répartie sans conversations oubliées.

Ne pas créer de « community score » individuel fondé sur la valeur commerciale supposée d'une personne. Préférer des états explicites, contrôlables et expliqués par l'opérateur.

## Non-Decisions

- Ordre exact après Bluesky/Mastodon.
- Modèle tarifaire des connecteurs coûteux.
- Inbox unifiée, tant que les accès message/commentaire ne sont pas validés réseau par réseau.
- Usage de données sociales par une IA : exclu par défaut en l'absence de consentement, droits et conditions explicites.

## Rejected Paths

- Automatisation générique dans les WebViews — fragile, difficilement auditable et fréquemment contraire aux règles d'accès automatisé.
- « Publier partout » comme promesse uniforme — masque les reviews, formats, quotas et permissions spécifiques.
- Social listening par scraping — risque contractuel et vie privée trop élevés.
- Partage d'une session sociale entre membres d'équipe — risque sécurité/identité ; chaque personne doit utiliser son autorisation propre.
- Scores de vanité, auto-like, auto-follow, pods d'engagement et réponses IA envoyées sans validation — incompatibles avec la promesse de communauté authentique.
- Classement caché des membres selon leur influence ou leur rentabilité — risque de déshumaniser le produit et d'introduire des décisions opaques.

## Risks And Unknowns

- Un WebView tiers peut être techniquement ou contractuellement refusé par un service ; conserver un fallback vers le navigateur externe.
- Les politiques, tarifs et produits API peuvent changer rapidement ; revue datée obligatoire avant chaque connecteur.
- Le stockage de tokens OAuth transforme SocialGlowz en dépositaire de données sensibles : chiffrement, révocation, suppression et scopes minimaux seront nécessaires.
- Les APIs n'offrent pas toutes les mêmes objets ; éviter une abstraction qui perd les contraintes propres à chaque réseau.
- La conformité finale dépend aussi du RGPD, du consentement, de la politique de confidentialité et des contrats commerciaux, pas seulement des API docs.

## Redaction Review

- Reviewed: yes
- Sensitive inputs seen: none
- Redactions applied: none
- Notes: aucune donnée client, clé, session ou journal sensible n'a été persisté.

## Decision Inputs For Spec

- User story seed: en tant que responsable de communauté, je crée en un geste une tâche textuelle reliée à la conversation précise où je dois agir, puis je peux la rouvrir et la suivre sans donner accès à mes messages.
- Scope in seed: tâche textuelle, URL validée, capture explicite d'onglet/lien partagé/collé, détection réseau/profil, états, rappels et ouverture sûre.
- Scope out seed: scraping, content script, lecture DOM, extraction de messages, API, synchronisation de conversation, historique de navigation, partage de credentials.
- Invariants/constraints seed: API officielle uniquement pour les actions automatiques ; consentement explicite ; fallback manuel ; capacité datée par réseau.
- Validation seed: aucun chemin automatisé sans capacité déclarée ; révocation OAuth ; preuve que le mode manuel fonctionne sans extraction de données tierces.

## Handoff

- Recommended next command: `/100-sg-spec cockpit social conforme phase 1`
- Why this next step: le cap est assez clair pour spécifier un premier chantier indépendant des approbations externes.

## Exploration Run History

| Date UTC | Prompt/Focus | Action | Result | Next step |
|----------|--------------|--------|--------|-----------|
| 2026-08-03 00:00:00 UTC | fonctionnalités compatibles avec les règles des réseaux | lecture projet, benchmark et politiques officielles | cap cockpit humain + connecteurs API progressifs | choisir le périmètre phase 1 |
| 2026-08-03 08:25:00 UTC | recentrage sur la gestion d'une vraie communauté | reformulation de la thèse, boucle de valeur, fonctionnalités et métriques | cap Community Relationship OS | spécifier la file de suivi et la mémoire relationnelle |
| 2026-08-03 09:10:00 UTC | refus du travail administratif manuel | recentrage API-first et automatisation du triage/CRM | cap Community Engine automatisé sur sources autorisées | choisir le premier réseau à connecter |
| 2026-08-03 09:35:00 UTC | refus des intégrations API lourdes | pivot vers CRM manuel textuel avec capture d'URL explicite, sans scraping | cap task CRM universel et minimal | formaliser puis implémenter la capture URL |
