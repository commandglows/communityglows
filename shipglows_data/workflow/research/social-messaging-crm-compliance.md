---
artifact: research
metadata_schema_version: "1.0"
artifact_version: "1.4.0"
project: "socialglowz"
created: "2026-08-03"
updated: "2026-08-03"
status: reviewed
source_skill: 203-sg-research
scope: "injection de tags et extraction de conversations sociales vers un CRM"
owner: "Diane"
confidence: medium
risk_level: critical
security_impact: yes
docs_impact: yes
source_count: 13
depends_on: []
supersedes: []
evidence:
  - "shipglows_data/technical/public-webview-platform-boundary.md"
  - "https://www.facebook.com/terms"
  - "https://www.facebook.com/legal/automated_data_collection_terms"
  - "https://docs.x.com/developer-terms/policy"
  - "https://docs.x.com/developer-guidelines"
  - "https://learn.microsoft.com/en-us/linkedin/marketing/restricted-use-cases"
  - "https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access"
  - "https://www.linkedin.com/legal/user-agreement"
  - "https://www.linkedin.com/help/linkedin/answer/a1341387/prohibited-software-and-extensions"
  - "https://support.discord.com/hc/en-us/articles/115002192352-Automated-User-Accounts-Self-Bots"
  - "https://docs.discord.com/developers/platform/bots"
  - "https://developers.tiktok.com/doc/data-portability-api-get-started"
  - "https://redditinc.com/policies/developer-terms"
next_step: "formaliser une politique de capacités, données et rétention avant tout connecteur de messagerie"
---

# Research: tags et CRM à partir des messageries sociales

> Généré le 2026-08-03 — Sources officielles : 9 plus une frontière technique projet.

## Executive Summary

SocialGlowz ne doit pas injecter de tags dans le DOM d'une messagerie tierce, ni extraire les conversations visibles dans une WebView pour les copier dans un CRM. Le contrat public du projet l'interdit déjà, et les conditions de Meta interdisent notamment la collecte automatisée sans permission.

Un CRM de conversations sans double saisie reste conditionné aux APIs officielles. En revanche, le produit retenu ne cherche plus à devenir un CRM de conversations : c'est un gestionnaire de tâches textuel qui peut mémoriser une URL explicitement capturée par l'utilisateur, sans lire ni importer les données de la page liée.

## Decision Matrix

| Proposition | Verdict | Règle produit |
|---|---|---|
| Tag ajouté dans la page Instagram, LinkedIn, X ou autre via script/extension/WebView | non | ne pas modifier le DOM ni injecter une surcouche liée aux conversations tierces |
| Lecture du DOM d'une messagerie pour importer des messages en CRM | non | pas de scraping, même si l'utilisateur est connecté |
| Tâche, note, tag et rappel créés dans SocialGlowz par l'opérateur | oui | ce sont des données propriétaires ; la tâche ne prétend pas représenter ni copier la conversation |
| URL de l'onglet actif capturée après clic explicite | oui, avec garde-fous | lire uniquement la chaîne URL ; ni DOM, ni titre, ni message, ni historique ; ne pas la qualifier de scraping |
| Lien « ouvrir la tâche » depuis SocialGlowz | oui | ouvrir l'URL validée dans le navigateur/WebView, sans mesurer ce qui se passe ensuite |
| Import de messages par API officielle et OAuth | conditionnel | uniquement par connecteur approuvé, capacité déclarée, consentement et politique de données vérifiée |
| Synchronisation continue des messages vers CRM | exceptionnel | seulement si l'API, les scopes, la revue, le consentement et la rétention l'autorisent explicitement |

## Metadata Boundary For Contextual Tasks

| Métadonnée | Verdict | Source |
|---|---|---|
| réseau/hôte, URL normalisée, date de création, profil SocialGlowz choisi, état et priorité | oui | URL capturée et données SocialGlowz |
| icône de réseau issue du catalogue intégré à SocialGlowz | oui | ressource détenue par SocialGlowz, sans requête vers la page |
| type de lien générique dérivé de l'hôte (`post`, `profil`, `discussion`) | oui, si non conservateur | structure d'URL uniquement ; aucun nom, contenu ou identifiant de personne n'est extrait |
| titre d'onglet | non par défaut | peut contenir nom, message ou contenu de la page tierce |
| titre HTML, description, Open Graph, auteur, image, aperçu de conversation | non | nécessite lecture DOM, content script ou requête de récupération de page : c'est de la collecte de contenu tiers |
| titre de tâche | oui | écrit par l'utilisateur dans SocialGlowz |

Ne pas faire de requête serveur pour « seulement récupérer l'Open Graph » : cela collecte quand même la page, contourne potentiellement une session/connexion et ferait revenir le produit dans la zone scraping. Pour les liens sociaux, la tâche doit donc commencer avec l'URL et un titre vide ou générique (`Tâche Instagram`, `Tâche LinkedIn`) que l'utilisateur formule lui-même.

## Why DOM Injection And Scraping Are Out

La frontière publique de SocialGlowz interdit déjà l'injection de scripts arbitraires et toute modification du contenu tiers dans une WebView. Ce choix doit s'étendre aux tags et à l'extraction de conversations : une feature qui lit ou annote visuellement des messages tiers redonne une surface d'automatisation et de collecte non autorisée.

Meta interdit l'accès ou la collecte automatisés sur ses produits sans permission préalable. Les données accessibles à un utilisateur dans une messagerie ne deviennent pas automatiquement réutilisables dans un CRM tiers.

### User-Initiated Scraping Is Not An Exception

Le fait que l'utilisateur clique sur « importer cette conversation » ne change pas la nature de l'action : le logiciel lit et copie automatiquement une page tierce. Meta précise expressément que son interdiction s'applique même si la collecte est effectuée pendant que la personne est connectée à son compte ; ses Automated Data Collection Terms exigent une permission écrite expresse pour toute collecte automatisée.

LinkedIn est encore plus explicite : son accord utilisateur vise les scripts, plugins et extensions qui scrappent ou copient les Services, et interdit aussi les surcouches qui modifient leur apparence. Sa page d'aide confirme que les extensions qui scrappent, modifient l'apparence ou automatisent l'activité sont interdites. Reddit interdit également la collecte automatisée ou non hors conditions/accord séparé.

Le périmètre réduit (« seulement cette conversation ») réduit peut-être le volume et le risque de vie privée, mais ne rend pas le mécanisme autorisé. Il ne faut donc pas faire reposer le produit commercial sur une exception que les plateformes ne publient pas.

## Platform Notes

### X

Les DMs peuvent être gérés par API pour un compte authentifié et une application développeur approuvée. Mais X exige un consentement exprès et informé avant de stocker du contenu non public, demande la protection des DMs, interdit de les servir à des personnes non autorisées et impose de synchroniser les suppressions/modifications ; ses règles développeur mentionnent une suppression sous 24 heures dans plusieurs cas. Les rapprochements avec des identifiants hors X exigent aussi un opt-in exprès.

Conclusion : possible pour une fonctionnalité DM précisément approuvée, avec coffre de données, consentement et effacement ; pas comme aspiration générique de messagerie vers un CRM partagé.

### LinkedIn

L'accès API dépend d'OAuth et, pour beaucoup de programmes, d'une approbation LinkedIn. Les Community Management APIs couvrent surtout le contenu et les interactions d'organisations, avec des restrictions d'usage et de stockage. Les APIs publiques ne fournissent pas un connecteur général d'inbox de page à synchroniser dans un CRM.

Conclusion : permettre des notes et suivis SocialGlowz associés à un lien LinkedIn ; ne pas promettre l'import ou le tagging de DMs LinkedIn.

### Meta: Facebook, Instagram et Threads

Les conditions Meta interdisent l'accès/collecte automatisés sans permission et le contournement de protections techniques. Une éventuelle intégration de messagerie doit être conçue uniquement à partir du produit API Meta, des permissions et des politiques exactes applicables au type de compte et au cas d'usage.

Conclusion : pas d'injection ou scraping WebView. Toute vue de conversations ou synchronisation CRM est reportée à une spécification Meta dédiée, basée sur la documentation API actuelle et la revue d'app.

### Discord

Discord autorise les bots et webhooks officiels dans les serveurs où ils disposent des permissions nécessaires. Automatiser un compte utilisateur normal (« self-bot ») est interdit et peut entraîner sa fermeture.

Conclusion : un espace communautaire Discord peut être relié à un bot explicitement installé, avec permissions minimales ; jamais à la session Web Discord de l'utilisateur.

### TikTok

L'API de portabilité donne, après validation, la possibilité de demander des exports de données comprenant les messages directs pour des utilisateurs EEE/Royaume-Uni qui l'autorisent. Le produit est soumis à revue sécurité/vie privée, avec scopes précis et accord ponctuel ou continu.

Conclusion : ce mécanisme concerne l'export autorisé des données du titulaire ; il ne justifie pas une inbox universelle ni l'aspiration de conversations de membres vers un CRM.

### Reddit

L'utilisation commerciale des données peut nécessiter un accord séparé. Les conditions imposent une politique de confidentialité, des protections, des suppressions et interdisent le spam, le contournement et l'usage hors cas approuvé.

Conclusion : conserver les notes locales et les liens ; n'importer des données API que dans un cas contractuellement validé.

## Safe Textual Task Manager Design

Le modèle retenu est une tâche textuelle, pas une fiche relationnelle issue d'une messagerie :

- identifiant interne SocialGlowz ;
- titre, note et tags rédigés par l'utilisateur ;
- état, priorité, échéance et rappel SocialGlowz ;
- URL HTTPS de l'action à faire, collée, partagée par le système ou lue dans l'onglet actif après clic explicite ;
- réseau/profil déduit seulement de l'hôte de l'URL, si utile pour l'ouverture ;
- libellé générique et icône du réseau depuis le catalogue SocialGlowz, jamais depuis la page liée.

Ne pas lire le titre, le texte, les messages, les participants, les identifiants de profil ou l'historique de la page. Ne pas injecter de script, ne pas observer la navigation en continu, ne pas modifier la page. Retirer les fragments et paramètres manifestement secrets avant persistance ; refuser les URLs non HTTPS ou contenant des identifiants.

## Required Guardrails Before A Messaging Connector

1. Capture déclenchée par un bouton explicite ; aucune capture automatique ou en arrière-plan.
2. URL uniquement : aucun content script, aucun accès DOM, aucune capture de titre, texte ou message.
3. Validation HTTPS sans identifiants ; filtrage des paramètres secrets et des protocoles dangereux.
4. Notice de confidentialité qui décrit la conservation d'URLs et de notes utilisateur ; aucun token, cookie ou session WebView réutilisé.
5. Ouverture du lien à la demande ; aucun suivi ou inférence de l'action réalisée sur la page tierce.

## Recommendation

Construire un popup « Créer une tâche depuis cet onglet » : il préremplit uniquement l'URL courante, puis l'utilisateur écrit son intention et enregistre. C'est un gestionnaire de tâches contextuel, pas un scraper, une inbox ou un CRM de conversations. Les sources consultées ne donnent pas une permission générale pour toutes les extensions, mais cette conception évite les comportements explicitement interdits (scraping, copie de contenu, surcouche et automatisation) et représente un risque nettement plus faible qu'un extracteur de conversations.

## Freshness Verdict

fresh-docs checked — sources officielles consultées le 2026-08-03 ; une nouvelle vérification est obligatoire à chaque spécification de connecteur, les permissions et politiques pouvant évoluer.

## Chantier potentiel

Chantier potentiel: oui
Titre proposé: tâches textuelles contextuelles avec capture d'URL explicite
Raison: décision de produit, extension, desktop/mobile, validation URL et règles de confidentialité sont concernés.
Sévérité: P1
Scope: interface SocialGlowz, extension, Android partage, validation URL, stockage des tâches et documentation privacy.
Evidence:
- `shipglows_data/technical/public-webview-platform-boundary.md`
- politiques développeurs et conditions officielles listées dans ce rapport
Formalisation recommandée: oui - le périmètre doit être verrouillé avant toute implémentation.
Choix proposés: construire le gestionnaire de tâches contextuel sans intégration API, ou garder le produit au seul rôle de launcher réseau.

## Sources

- [SocialGlowz Public WebView Platform Boundary](../../technical/public-webview-platform-boundary.md) — interdit l'injection arbitraire et la mutation de contenu tiers dans la build publique.
- [Meta Terms of Service](https://www.facebook.com/terms) — accès/collecte automatisés sans permission interdits.
- [Meta Automated Data Collection Terms](https://www.facebook.com/legal/automated_data_collection_terms) — permission écrite expresse exigée pour toute collecte automatisée.
- [X Developer Policy](https://docs.x.com/developer-terms/policy) — consentement pour stockage de DMs, confidentialité, suppression et opt-in pour le rapprochement hors X.
- [X Developer Guidelines](https://docs.x.com/developer-guidelines) — obligations pratiques de suppression et règles de données.
- [LinkedIn Restricted Uses](https://learn.microsoft.com/en-us/linkedin/marketing/restricted-use-cases) — restrictions d'usage et de stockage des données Community Management.
- [LinkedIn API Access](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access) — OAuth et approbation nécessaires selon les programmes.
- [LinkedIn User Agreement](https://www.linkedin.com/legal/user-agreement) — interdit scripts/extensions qui scrappent, ainsi que les surcouches qui modifient l'apparence du service.
- [LinkedIn Prohibited Software and Extensions](https://www.linkedin.com/help/linkedin/answer/a1341387/prohibited-software-and-extensions) — confirmation pratique de cette interdiction.
- [Discord Self-Bots](https://support.discord.com/hc/en-us/articles/115002192352-Automated-User-Accounts-Self-Bots) — automatisation des comptes utilisateurs interdite.
- [Discord Bots](https://docs.discord.com/developers/platform/bots) — modèle autorisé pour l'automatisation et les permissions.
- [TikTok Data Portability API](https://developers.tiktok.com/doc/data-portability-api-get-started) — export de DMs sous scopes, revue et autorisation utilisateur.
- [Reddit Developer Terms](https://redditinc.com/policies/developer-terms) — restrictions commerciales, data handling et suppression.
