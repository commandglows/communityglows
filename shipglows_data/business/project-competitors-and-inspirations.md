---
artifact: competitive_intelligence
metadata_schema_version: "1.0"
artifact_version: "1.5.0"
project: "communityglows"
created: "2026-05-11"
updated: "2026-09-05"
status: reviewed
source_skill: 205-sg-veille
scope: "project-competitors-and-inspirations"
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
evidence:
  - "Dex official website and Chrome Web Store listing reviewed on 2026-09-05; declared capabilities, no connected test."
  - "Initial competitor and inspiration triage captured in legacy root concurrent.md."
  - "CommunityGlows product context describes a multi-platform social operations dashboard."
  - "AlternativeTo competitor pages reviewed on 2026-08-03."
  - "Official Rambox, Ferdium, Franz, Wavebox, Freeter, WebCatalog, Biscuit and Shift product sources reviewed on 2026-08-03."
  - "ClarkUp official product and offer pages, Novalya Chrome Web Store listing and official help reviewed on 2026-09-05; declared capabilities, not hands-on verification."
  - "Six Chrome Web Store listings for Breakcold (two extension IDs), lemlist, Apollo, Clay and ZELIQ plus the six vendors' official sites reviewed on 2026-09-05; ClarkUp listing remained inaccessible."
depends_on:
  - artifact: "shipglows_data/business/product.md"
    artifact_version: "1.0.1"
    required_status: reviewed
  - artifact: "shipglows_data/business/gtm.md"
    artifact_version: "1.0.1"
    required_status: reviewed
supersedes:
  - "concurrent.md"
next_review: "2026-11-03"
next_step: "/009-sg-marketing market approfondir le positionnement CommunityGlows face aux conteneurs de web apps et réseaux multi-comptes"
target_projects:
  - communityglows
reference_categories:
  - direct_competitor
  - indirect_competitor
  - product_inspiration
  - workflow_inspiration
source_policy: "Track public sources only; do not copy private positioning, paid assets, credentials, or non-public customer data."
---

# Concurrents et inspirations — CommunityGlows

## Lecture projet

CommunityGlows est un dashboard social multi-plateforme. Les liens utiles concernent multi-comptes, social content, analytics, relations et intégrations.

## Concurrents directs actifs

| Produit | Type | Score | Pourquoi il compte | Angle à benchmarker |
|---|---:|:---:|---|---|
| [Rambox](https://rambox.app/) ([AlternativeTo](https://alternativeto.net/software/rambox/about/)) | Concurrent direct | 9/10 | Workspace desktop qui regroupe apps et comptes, avec workspaces, multi-login, hibernation et offre équipes. | Organisation par client/projet, instances multiples, focus, monétisation freemium/Pro. |
| [Ferdium](https://ferdium.app/) ([AlternativeTo](https://alternativeto.net/software/ferdium/about/)) | Concurrent direct open source | 9/10 | Agrège plus de 100 services, accepte plusieurs comptes et services personnalisés, avec données locales et sync optionnelle. | Catalogue extensible, usage sans compte, confidentialité, hibernation et workspaces. |
| [Franz](https://meetfranz.com/) ([AlternativeTo](https://alternativeto.net/software/franz/about/)) | Concurrent direct | 9/10 | Référence historique des apps de messagerie unifiées, toujours active avec Franz 6 sur Windows, macOS et Linux. | Onboarding des services, workspaces, notifications, offre gratuite versus abonnement, fonctions IA locales. |
| [Wavebox](https://wavebox.io/) ([WMail sur AlternativeTo](https://alternativeto.net/software/wmail/about/)) | Concurrent adjacent direct | 8/10 | Navigateur de productivité issu de WMail, centré sur multi-login, isolation de sessions, groupes et web apps. | Isolation de comptes, navigation verticale, tab sleeping, sécurité et passage email vers workspace complet. |
| [WebCatalog](https://webcatalog.io/en/desktop) | Concurrent direct | 9/10 | Transforme les sites en apps de bureau, propose un catalogue très large, des workspaces et plusieurs comptes isolés pour une même app. | Catalogue, création d'app personnalisée, profils, sandbox par app, extension navigateur et déploiement d'équipe. |
| [Biscuit](https://eatbiscuit.com/) | Concurrent direct | 8/10 | Navigateur dédié aux web apps persistantes, organisé en groupes avec sessions isolables par app ou workspace et plusieurs comptes simultanés. | Simplicité du shell, groupes, absence de compte obligatoire, notifications et séparation des sessions. |
| [Shift](https://shift.com/) ([workspaces](https://supportv9.shift.com/hc/en-us/articles/25227748984852-All-about-Workspaces)) | Concurrent adjacent direct | 8/10 | Regroupe apps, comptes, favoris et onglets dans des workspaces et accepte plusieurs instances d'une même app. | Organisation centrée comptes/clients, recherche transversale, extensions et modèle d'abonnement. |
| [Freeter](https://freeter.io/) ([sessions des widgets web](https://freeter.io/v1/user-guide/widgets/webpage/)) | Concurrent direct de niche open source | 8/10 | Embarque les web apps complètes dans des widgets et sépare les sessions par projet, onglet ou widget, notamment pour plusieurs comptes sociaux. | Dashboards composables, vues côte à côte, séparation fine des sessions et workflows par projet. |

## Concurrents et inspirations secondaires

| Produit | Statut | Score | Usage concret |
|---|---:|:---:|---|
| [ElectronIM](https://github.com/manusa/electronim) ([AlternativeTo](https://alternativeto.net/software/electronim/about/)) | Concurrent de niche open source | 6/10 | Client multi-IM à onglets avec contextes isolés ou partagés, notifications par app et mode ne pas déranger. |
| [Dex](https://getdex.com/) ([extension Chrome](https://chromewebstore.google.com/detail/dex-personal-crm-contacts/amlpnkfionniifnajgcalfndolieichk)) | Concurrent indirect ; inspiration relationnelle prioritaire | 9/10 | CRM personnel : notes, rappels et contexte des relations ; benchmark du parcours personne → contexte → suivi. |
| [ClarkUp](https://clarkup.com/) ([extension Chrome](https://chromewebstore.google.com/detail/clarkup-prospection-comme/iaanipppfmeelmdgnkimfddhklbffaab)) | Concurrent indirect ; inspiration produit et workflow | 8/10 | Prospection multi-réseaux, pipeline de leads et vidéos personnalisées ; benchmark du passage d'un contact à une prochaine action. |
| [Novalya](https://novalya.com/) ([extension Chrome](https://chromewebstore.google.com/detail/novalya/iemhbpcnoehagepnbflncegkcgpphmpc)) | Concurrent indirect ; inspiration relationnelle et workflow | 7/10 | Assistant de prospection Facebook/Instagram avec CRM, relances et anniversaires ; benchmark de simplicité et de suivi relationnel. |
| [Breakcold](https://www.breakcold.com/) ([CRM Chrome](https://chromewebstore.google.com/detail/breakcold-crm-ai-native-c/hldpihkgmkgkbihckgbbmddgddfjpopp), [Legacy Chrome](https://chromewebstore.google.com/detail/breakcold-legacy/aleoomdhnjddjlmfocibikjdpkdpadko?hl=en)) | Concurrent indirect ; inspiration relationnelle et CRM | 8/10 | Social selling et suivi de prospects dans un CRM ; deux extensions du même produit, sans double comptage concurrentiel. |
| [lemlist](https://www.lemlist.com/) ([extension Chrome](https://chromewebstore.google.com/detail/lemlist/khnbclggeggefodgimdekejhipkeobnc?hl=en)) | Concurrent indirect ; inspiration workflow | 7/10 | Prospection multicanale ; actions sur les leads depuis Gmail et le CRM, sans changement d'outil. |
| [Apollo.io](https://www.apollo.io/) ([extension Chrome](https://chromewebstore.google.com/detail/apolloio-free-b2b-phone-n/alhgpfoeiimagjlnfekdhkjlkiomcapa)) | Concurrent indirect B2B ; inspiration contextuelle | 6/10 | Données de contacts, séquences et tâches dans les outils de travail ; benchmark du contexte commercial au point d'action. |
| [Clay](https://www.clay.com/) ([Clay for Chrome](https://chromewebstore.google.com/detail/clay-for-chrome/acmfklpkefjlldbkdgmjoiknfgidadoh)) | Inspiration collecte et workflow ; concurrence indirecte faible | 5/10 | Extraction de données web vers des tables ; référence pour la sélection explicite et la structuration du contexte. |
| [ZELIQ](https://www.zeliq.com/) ([extension Chrome](https://chromewebstore.google.com/detail/zeliq-find-anyones-email/mekpojdmdfchpokdinnplhlbbdbebiph)) | Concurrent indirect B2B ; inspiration workflow | 6/10 | Statut CRM dans un panneau latéral, enrichissement et passage à une séquence de prospection. |

## Analyse ciblée — Dex Personal CRM (2026-09-05)

**Classement.** Concurrent indirect sur le suivi des personnes ; inspiration produit et relationnelle prioritaire, **9/10** de pertinence interne pour cette dimension. Cette appréciation ne mesure ni qualité ni performance et ne classe pas Dex comme substitut au workspace multi-comptes.

**Proposition déclarée.** Dex centralise les relations personnelles et professionnelles : rappels de prise de nouvelles, notes, tags, vues et recherche. L'extension s'insère notamment dans Facebook, Messenger, X et Gmail. La fiche affiche 10 000 utilisateurs, 4,8/5 pour 82 évaluations, version 3.0.4 mise à jour le 26 août 2026. Relevé le 5 septembre 2026 ; ces compteurs ne prouvent ni satisfaction générale ni rétention. [Source : extension Chrome fournie](https://chromewebstore.google.com/detail/dex-personal-crm-contacts/amlpnkfionniifnajgcalfndolieichk).

**Offre de plateforme.** Le site présente la synchronisation LinkedIn, les changements de poste, les détails personnels et dates importantes, une application mobile et une connexion MCP pour les assistants IA. Il annonce un financement par abonnement ainsi que l'export et la suppression des données. Les fonctions de plateforme ne sont pas toutes attribuables à l'extension. Le prix et les limites d'accès gratuit ne sont pas confirmés : le démarrage gratuit annoncé ne prouve pas un forfait gratuit durable. [Source : site officiel Dex](https://getdex.com/).

**Lecture marketing — inférence.** Dex vend la continuité et l'attention portée aux personnes : se rappeler le contexte et reprendre contact au bon moment. Cette promesse peut parler à des créateurs, indépendants et professionnels qui entretiennent un réseau sans chercher à convertir chaque relation en vente. Comparé à ClarkUp et Novalya, c'est une inspiration plus proche d'un suivi humain généraliste. La valeur devient compréhensible avant même d'expliquer les intégrations.

| Pattern à étudier | Intérêt pour CommunityGlows | Limite actuelle |
|---|---|---|
| Personne → contexte → prochaine prise de nouvelles | Donner une continuité aux échanges entre réseaux. | Les tâches documentées associent personnes, notes, liens et échéances ; une fiche relation transversale reste à évaluer. |
| Cadence de suivi choisie | Aider à entretenir une relation dans la durée. | Les rappels récurrents par personne ne sont pas établis par cette revue. |
| Notes faciles à retrouver au point d'action | Reprendre un échange sans reconstruire son contexte. | Préserver la capture volontaire et la séparation des profils ; aucune lecture automatique des conversations n'est décidée. |
| Export et suppression accessibles | Donner à l'utilisateur la maîtrise de son carnet relationnel. | Promesse de Dex à tester ; ne pas déduire la portabilité complète de CommunityGlows de sa synchronisation. |

**Point d'attention.** La déclaration de confidentialité de la fiche Chrome ne constitue pas un audit du service complet. La connexion MCP annoncée est une piste distincte, avec accès aux données relationnelles à qualifier ; elle n'est ni testée ici ni déclarée callable dans cet agent.

**Recommandation et suite.** Retenir Dex comme benchmark prioritaire du parcours personne → contexte → suivi, en complément du benchmark commercial ClarkUp. Diane reste responsable des choix produit. Avant une décision d'implémentation, tester ce parcours et vérifier les modalités d'export, les rappels et l'offre réelle. Analyse de sources publiques uniquement, sans installation ni essai connecté ; aucune roadmap ou promesse publique modifiée.

## Analyse ciblée — ClarkUp et Novalya (2026-09-05)

**Périmètre et méthode.** Sources publiques d'éditeurs et fiche marketplace, analysées pour CommunityGlows à la demande de Diane. Les fonctionnalités ci-dessous sont annoncées, sans installation ni test connecté. Les scores expriment une pertinence interne pour le benchmark, pas une mesure de qualité ou de performance. Les autres références gardent leur date de revue antérieure.

### ClarkUp : transformer une audience en pipeline commercial

**Proposition déclarée.** Acquisition de prospects depuis LinkedIn, Facebook, Instagram, X, Google Maps, sites web, Slack, Discord et TikTok ; organisation des leads, vidéos personnalisées, enrichissement de fiches et rédaction assistée par IA. Le site associe ces moyens à davantage de réponses et de rendez-vous. Ces résultats restent des promesses commerciales, non mesurées ici. [Source : site officiel](https://clarkup.com/).

**Offre et adoption.** La page d'offre ajoute des formations, modèles de messages et exemples de pipelines. Elle décrit un abonnement résiliable et des utilisateurs supplémentaires selon le forfait. Le montant actuel n'est pas établi par le contenu consulté ; aucune ancienne promotion à vie n'est retenue comme tarif courant. [Source : offre officielle](https://www.clarkup.com/clarkup-tarifs-ne/).

**Lecture marketing — inférence.** La cible paraît être l'indépendant ou la petite équipe qui cherche des clients à partir de son activité sociale. La force du discours est une chaîne compréhensible : trouver une personne, engager une conversation personnalisée, suivre l'opportunité. La vidéo fournit une différenciation concrète et les formations réduisent la difficulté de démarrage. La largeur de la couverture peut aussi rendre le premier choix d'usage moins évident ; ce point reste à tester.

**Proximité CommunityGlows.** Concurrence sur le temps et le budget consacrés aux relations commerciales, mais pas preuve d'un remplacement du workspace Bento et des sessions isolées. L'inspiration prioritaire est le pipeline lisible et contextualisé. L'extraction de contacts, l'enrichissement et l'envoi automatisé constituent un autre périmètre produit.

### Novalya : rendre la prospection sociale répétable

**Proposition déclarée.** La fiche Chrome décrit un assistant Facebook/Instagram : ciblage de groupes, demandes de connexion et messages de suivi personnalisés, CRM intégré et souhaits d'anniversaire automatiques. Un compte Novalya actif est requis. Elle affiche 1 000 utilisateurs, 4,6/5 pour 78 évaluations et une mise à jour du 2 septembre 2026, au relevé du 5 septembre. Ces signaux marketplace ne prouvent ni rétention ni efficacité commerciale. [Source : Chrome Web Store](https://chromewebstore.google.com/detail/novalya/iemhbpcnoehagepnbflncegkcgpphmpc).

**Lecture marketing — inférence.** La promesse est plus resserrée que ClarkUp : diminuer les gestes répétitifs pour consacrer du temps aux conversations. L'association CRM et anniversaires ajoute une dimension d'entretien des relations à la seule acquisition. L'absence de compétences techniques revendiquée facilite la projection d'un utilisateur peu outillé.

**Limites documentées.** Le support traite les campagnes interrompues, sessions expirées, contacts non ajoutés au CRM et restrictions Meta. Il s'agit de scénarios de dépannage, sans fréquence de panne connue. Chrome doit rester ouvert selon l'aide officielle : l'automatisation ne doit donc pas être comprise comme une exécution cloud indépendante du poste. Prix actuel non confirmé. [Dépannage officiel](https://help.novalya.com/en/article/novalya-troubleshooting-solve-most-common-problems-quick-guide-ixxhwu/) ; [dépendance à Chrome](https://help.novalya.com/fr/article/pourquoi-google-chrome-doit-il-rester-ouvert-pendant-lutilisation-de-novalya-pat4y8/).

### Enseignements pour CommunityGlows

| Inspiration | Application envisageable | Statut / frontière |
|---|---|---|
| Pipeline ClarkUp | Montrer un exemple de suivi avec les étapes renommables des tâches : à contacter, échange en cours, suivi. | Le README documente déjà les étapes renommables ; scénario à évaluer, sans revendiquer un CRM de prospection complet. |
| Suivi relationnel Novalya | Associer une personne, une note, une échéance et le lien de contexte pour retrouver la prochaine action. | Ces primitives sont documentées ; les anniversaires automatiques ne sont pas une capacité démontrée de CommunityGlows. |
| Démarrage guidé ClarkUp | Un exemple de workflow concret pour un indépendant, plutôt qu'un inventaire de réseaux et de fonctions. | Inspiration d'onboarding, aucune modification produit ou éditoriale décidée. |
| Simplicité Novalya | Évaluer la compréhension du premier suivi : qui, pourquoi, quand, depuis quel compte. | Hypothèse UX ; mesurer la réussite de la tâche avant de promettre un gain de temps. |

**Conclusion stratégique — recommandation à évaluer.** Pour CommunityGlows, la meilleure piste est la continuité entre réseau ouvert, contexte de la relation et action humaine à effectuer. ClarkUp inspire davantage la structure commerciale ; Novalya, la régularité relationnelle. Leur ajout n'autorise pas à transformer CommunityGlows en outil d'extraction ou d'envoi en masse. Le [README](../../README.md) documente la capture volontaire d'URL et les tâches ; la [frontière des WebViews publiques](../technical/public-webview-platform-boundary.md) reste applicable.

**Preuves restantes.** La fiche ClarkUp fournie n'a pas été lisible pendant cette revue (échec de récupération puis écran de consentement) : lien conservé, sans inventer note, version ni disponibilité d'installation. Aucun essai connecté des deux produits ; tarifs et performances restent à vérifier avant une comparaison publique. Les déclarations de conformité ou de sécurité des éditeurs ne sont pas validées par cette analyse.

**Responsable et suite.** Diane ; références enregistrées pour la veille CommunityGlows. À la prochaine revue, vérifier les offres et tester un parcours contact → suivi si une comparaison publique ou une décision produit le nécessite. Aucune nouvelle fonction ni priorité de roadmap n'est engagée.

## Analyse ciblée — sept extensions de prospection et CRM (2026-09-05)

**Objet et classement.** Les sept liens fournis représentent six produits : Breakcold possède deux identifiants d'extension, tandis que ClarkUp était déjà enregistré. Cette revue ajoute cinq produits et complète ClarkUp. Le classement et les scores sont une appréciation interne de pertinence pour CommunityGlows : 8/10 pour le suivi relationnel proche des tâches, 7/10 pour les workflows multicanaux, 6/10 pour les outils commerciaux B2B adjacents, 5/10 pour la collecte de données plus éloignée. Ce ne sont ni des notes de qualité ni une priorité de roadmap.

**Méthode et confiance.** Fiches Chrome Web Store et sites officiels consultés le 5 septembre 2026. Les capacités sont des déclarations d'éditeurs, sans installation ni essai connecté. Confiance moyenne sur la comparaison fonctionnelle ; résultats commerciaux, fiabilité, coûts réels et rétention non établis. La fiche d'une extension ne décrit pas nécessairement toute la plateforme SaaS. Les six fiches lisibles fournissent des notes agrégées ; les avis individuels n'ont pas été analysés et aucune satisfaction générale n'en est déduite.

### Relevé des sept liens

Les chiffres sont ceux affichés lors de la consultation, parfois issus d'une page indexée quelques jours auparavant. Les utilisateurs d'une extension ne mesurent pas la clientèle totale de son éditeur ; les compteurs des deux Breakcold ne doivent pas être additionnés en utilisateurs uniques.

| Extension / source | Identifiant Chrome | Utilisateurs affichés | Note / évaluations | Version / mise à jour affichée |
|---|---|---:|---|---|
| [Breakcold Legacy](https://chromewebstore.google.com/detail/breakcold-legacy/aleoomdhnjddjlmfocibikjdpkdpadko?hl=en) | `aleoomdhnjddjlmfocibikjdpkdpadko` | 2 000 | 4,3/5 · 20 | 3.2.2 · 2026-08-05 |
| [lemlist](https://chromewebstore.google.com/detail/lemlist/khnbclggeggefodgimdekejhipkeobnc?hl=en) | `khnbclggeggefodgimdekejhipkeobnc` | 100 000 | 4,6/5 · 75 | 5.0.12 · 2026-08-05 |
| [Apollo.io](https://chromewebstore.google.com/detail/apolloio-free-b2b-phone-n/alhgpfoeiimagjlnfekdhkjlkiomcapa) | `alhgpfoeiimagjlnfekdhkjlkiomcapa` | 1 000 000 | 4,7/5 · 2,2 k | 16.5.0 · 2026-08-28 |
| [Clay for Chrome](https://chromewebstore.google.com/detail/clay-for-chrome/acmfklpkefjlldbkdgmjoiknfgidadoh) | `acmfklpkefjlldbkdgmjoiknfgidadoh` | 10 000 | 4,4/5 · 9 | 1.0.0 · 2025-04-10 |
| [ZELIQ](https://chromewebstore.google.com/detail/zeliq-find-anyones-email/mekpojdmdfchpokdinnplhlbbdbebiph) | `mekpojdmdfchpokdinnplhlbbdbebiph` | 5 000 | 5/5 · 10 | 3.0.55 · 2026-09-03 |
| [Breakcold CRM — AI-Native CRM](https://chromewebstore.google.com/detail/breakcold-crm-ai-native-c/hldpihkgmkgkbihckgbbmddgddfjpopp) | `hldpihkgmkgkbihckgbbmddgddfjpopp` | 373 | 4/5 · 4 | 0.9.13 · 2026-09-04 |
| [ClarkUp](https://chromewebstore.google.com/detail/clarkup-prospection-comme/iaanipppfmeelmdgnkimfddhklbffaab?hl=en-US) | `iaanipppfmeelmdgnkimfddhklbffaab` | Non vérifié | Non vérifiée | Non vérifiée — fiche inaccessible |

### Breakcold : la référence la plus proche pour relier réseaux et CRM

**Déclaré.** Les deux fiches, publiées par Logike, décrivent l'ajout de prospects depuis LinkedIn et plusieurs autres plateformes, ainsi que les interactions sociales depuis le CRM. Le [site officiel](https://www.breakcold.com/) met désormais en avant la réduction de l'administration commerciale par un CRM destiné aux commerciaux et aux agents IA. Les fiches conservent une description de social selling plus ancienne.

**Lecture CommunityGlows — inférence.** Forte proximité avec le besoin de retrouver une personne, son contexte et la prochaine action. Benchmark utile : parcours réseau → fiche relation → suivi. La proposition reste orientée vente ; les sources ne prouvent pas une équivalence avec les profils isolés et le Bento.

**Distinction indispensable.** « Legacy » est bien le titre de la fiche `aleoom…`, toujours mise à jour en août 2026. La fiche `hldp…` a une version et un compteur distincts. Aucune migration obligatoire, date d'abandon ou parité entre les deux n'est établie : conserver les deux références sous un seul concurrent.

### lemlist : agir depuis l'outil déjà ouvert

**Déclaré.** La [fiche Chrome](https://chromewebstore.google.com/detail/lemlist/khnbclggeggefodgimdekejhipkeobnc?hl=en) décrit une interface dans Gmail, HubSpot et Salesforce : enrichissement email/téléphone, ajout aux campagnes, rédaction assistée, appels et suivi du statut des leads. Le [site officiel](https://www.lemlist.com/) étend la proposition à des séquences email, LinkedIn, appels, WhatsApp et SMS, avec un volet délivrabilité. Ces capacités de plateforme ne sont pas toutes attribuées à l'extension.

**Lecture CommunityGlows — inférence.** Le pattern utile est l'action contextuelle sans détour : voir la personne et agir au même endroit. Le séquençage automatique et la délivrabilité répondent à une autre promesse que l'organisation de comptes sociaux. Benchmark de workflow, sans présenter CommunityGlows comme un substitut à l'outbound.

### Apollo.io : une couche commerciale sur plusieurs outils

**Déclaré.** La [fiche Chrome](https://chromewebstore.google.com/detail/apolloio-free-b2b-phone-n/alhgpfoeiimagjlnfekdhkjlkiomcapa) associe coordonnées B2B, listes de leads, emails, séquences, appels et tâches à Gmail, Google Calendar, LinkedIn, HubSpot, Salesforce et aux sites d'entreprises. Le [site officiel](https://www.apollo.io/) présente une plateforme de vente couvrant outbound, inbound et automatisation.

**Lecture CommunityGlows — inférence.** Référence pour rendre un contexte commercial consultable là où l'utilisateur travaille, avec une prochaine action visible. La base de données et l'enrichissement constituent une différence de périmètre majeure. Le compteur Chrome signale une diffusion de l'extension, sans prouver sa précision ni l'adoption de toute la plateforme. Les quotas gratuits de la fiche ne sont pas retenus comme conditions tarifaires contractuelles actuelles.

### Clay for Chrome : structurer une collecte explicite

**Déclaré.** La [fiche Chrome](https://chromewebstore.google.com/detail/clay-for-chrome/acmfklpkefjlldbkdgmjoiknfgidadoh) décrit la détection de listes, la sélection manuelle de champs et des recettes pour extraire des données de pages vers Clay. Le [site officiel](https://www.clay.com/) positionne la plateforme autour des opérations commerciales, de l'enrichissement CRM et de la priorisation des leads.

**Lecture CommunityGlows — inférence.** Inspiration pour rendre explicites la sélection et la destination d'une information ; faible concurrence avec un workspace de réseaux. La capture d'URL documentée dans CommunityGlows ne lit pas le DOM : elle ne constitue pas un équivalent du scraping Clay. La date de mise à jour ancienne de l'extension ne suffit pas à conclure à l'abandon du produit.

### ZELIQ : rendre le statut et le suivi accessibles dans un panneau

**Déclaré.** La [fiche Chrome](https://chromewebstore.google.com/detail/zeliq-find-anyones-email/mekpojdmdfchpokdinnplhlbbdbebiph) présente le statut CRM en panneau latéral, l'ajout de prospects, leur enrichissement et l'envoi vers des séquences. Le [site officiel](https://www.zeliq.com/) vise les équipes commerciales et réunit recherche de contacts, enrichissement et prospection multicanale.

**Lecture CommunityGlows — inférence.** Benchmark intéressant du statut lisible et de la continuité contact → suivi. Les gains chiffrés et taux de réussite annoncés par l'éditeur ne sont pas validés ici. Les dix évaluations Chrome ne suffisent pas à classer le produit devant les autres. L'enrichissement automatique et les séquences dépassent les tâches humaines actuellement documentées dans CommunityGlows.

### ClarkUp : compléter l'entrée existante

La fiche fournie reste inaccessible après plusieurs variantes d'URL ; la tentative navigateur n'a pas abouti, son profil étant déjà utilisé. Aucun compteur ni statut d'installation n'est inventé. Le [site officiel](https://clarkup.com/) confirme le rôle de l'extension dans l'import de prospects sociaux et depuis Google Maps. L'analyse ClarkUp/Novalya ci-dessus reste pertinente : benchmark du pipeline et de la personnalisation, concurrence indirecte. L'URL est conservée sans paramètre `authuser`, qui n'identifie pas le produit.

### Synthèse exploitable pour CommunityGlows

| Priorité de benchmark, sans engagement produit | Références | Question à évaluer | Frontière actuelle |
|---|---|---|---|
| 1 — Continuité relationnelle | Breakcold, ClarkUp | Retrouve-t-on immédiatement qui suivre, pourquoi et à quelle échéance ? | S'appuyer sur personnes, notes, étapes renommables et échéances déjà documentées. |
| 2 — Action dans le contexte | lemlist, ZELIQ, Apollo | Peut-on créer puis retrouver un suivi en gardant le réseau et le compte de départ compréhensibles ? | Capture volontaire du lien et action humaine ; aucune synchronisation CRM tierce démontrée. |
| 3 — Collecte structurée | Clay | Une sélection explicite améliore-t-elle réellement la prise de notes ? | La lecture de page et l'extraction nécessiteraient une décision produit distincte. |

**Conclusion — inférence.** Ces produits concurrencent surtout le budget et le temps consacrés aux relations commerciales. Breakcold et ClarkUp sont les plus proches sur le suivi ; lemlist, Apollo et ZELIQ sur l'exécution commerciale ; Clay sur la collecte. Aucun des sept liens n'établit un remplacement du workspace multi-réseaux et multi-profils. Le [README](../../README.md) et la [frontière des WebViews publiques](../technical/public-webview-platform-boundary.md) bornent les comparaisons possibles.

**Responsable et suite.** Diane. Registre enrichi pour la veille, sans modification de positionnement public ni de roadmap. Avant une comparaison publique, vérifier les tarifs, les conditions des offres, la fiche ClarkUp et un parcours connecté contact → suivi. Les déclarations marketplace sur les données ne constituent pas un audit de confidentialité ou des permissions réelles.

## Inspiration produit prioritaire

| Produit | Statut | Score | Pourquoi elle est proche | Patterns à reprendre |
|---|---:|:---:|---|---|
| [Station](https://alternativeto.net/software/station/about/) | Inspiration majeure — produit abandonné | 9/10 | Son smart browser réunissait les web apps complètes dans un dock, avec multi-compte, navigation par application et réduction du changement de contexte : une logique très proche de CommunityGlows. | Dock persistant, regroupement automatique des pages par réseau, recherche et changement rapide, notifications réglables par app, mode focus et mise en veille des services inactifs. |

## Suggestions étudiées mais hors concurrence directe

| Produit | Classement retenu | Pourquoi il est écarté |
|---|---|---|
| [Beeper](https://www.beeper.com/) | Substitut de messagerie unifiée | Beeper rassemble les conversations dans une inbox et ne donne pas accès aux interfaces complètes des réseaux sociaux. Il concurrence une éventuelle fonction de messagerie de CommunityGlows, pas le produit actuel dans son ensemble. |
| [IM+](https://plus.im/) ([AlternativeTo](https://alternativeto.net/software/im/about/)) | Agrégateur de messages historique | Même limite que Beeper : couverture de protocoles et conversations, sans shell général pour utiliser les réseaux eux-mêmes. |

## Lecture stratégique 2026

- Le noyau concurrentiel n'est pas seulement le social media management classique : CommunityGlows affronte surtout les workspaces qui exécutent les interfaces web complètes avec plusieurs sessions ou comptes.
- La différenciation à défendre est la combinaison `réseaux sociaux + profils isolés + extension navigateur + desktop + mobile`, plutôt qu'un simple regroupement de messageries desktop.
- Rambox, Ferdium, WebCatalog et Franz sont les benchmarks prioritaires du shell multi-services. Wavebox, Biscuit, Shift et Freeter sont particulièrement utiles pour l'isolation, les workspaces et le multi-compte.
- Station est une inspiration produit prioritaire malgré son abandon : sa proximité fonctionnelle en fait une bonne source de patterns UX, sans la compter parmi les concurrents actifs.
- Beeper et IM+ ne doivent entrer dans une comparaison produit que si CommunityGlows développe une inbox de messages unifiée.
- Station doit rester clairement marqué comme abandonné. WMail doit être référencé sous son nom actuel Wavebox pour éviter une fausse entrée concurrente distincte.
- Les avis communautaires et fiches AlternativeTo sont des signaux de positionnement et d'objections, pas des preuves de performance, de sécurité ou de satisfaction globale.

## Liens prioritaires

| Lien | Type | Score | Usage concret |
|---|---:|:---:|---|
| [BundleUp](https://betalist.com/startups/bundleup) | Inspiration architecture | 8/10 | API unifiée multi-intégrations: proche du besoin CommunityGlows pour réseaux, Gmail, storage, analytics. |
| [TonimusAI](https://betalist.com/startups/tonimusai) | Concurrent indirect | 7/10 | Creator analytics/revenue: benchmark pour vues performance et priorisation des contenus. |
| [Igloo](https://betalist.com/startups/igloo-2) | Inspiration contenu social | 7/10 | Génération de reels: utile pour workflow de publication/social content. |
| [Photo Poodle](https://betalist.com/startups/photo-poodle) | Inspiration UGC | 6/10 | Capture photo événementielle par QR: pattern intéressant pour campagnes sociales. |
| [rembr](https://betalist.com/startups/rembr) | Inspiration relationnelle | 6/10 | Rappels relationnels: pourrait enrichir CRM léger / friends filter / follow-up. |
| [Web-Analytics.ai](https://web-analytics.ai/) | Inspiration reporting | 6/10 | Résumés simples de performance sans dashboard trop lourd. |

## À faible priorité

| Lien | Type | Score | Pourquoi |
|---|---:|:---:|---|
| [The Monthly Soup](https://betalist.com/startups/the-monthly-soup) | Inspiration communauté | 4/10 | Bon pattern de prompts récurrents pour groupes privés, mais pas coeur produit. |
