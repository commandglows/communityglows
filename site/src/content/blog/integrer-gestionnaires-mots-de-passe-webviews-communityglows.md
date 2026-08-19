---
title: "Comment utiliser son gestionnaire de mots de passe dans CommunityGlows ?"
description: "Google Password Manager, 1Password, Bitwarden et les autres : les solutions réalistes pour se connecter à ses réseaux sans confier ses mots de passe à CommunityGlows."
date: "2026-08-19"
author: "CommunityGlows Team"
tags: ["password-managers", "webview", "android", "windows"]
---

[Read this article in English](/blog/integrating-password-managers-communityglows-webviews)

CommunityGlows gère plusieurs profils et conserve des sessions séparées sur des dizaines de réseaux. Une question arrive donc très vite : peut-on laisser chaque utilisateur employer son gestionnaire de mots de passe habituel — Google Password Manager, 1Password, Bitwarden, Dashlane, Proton Pass ou un autre — directement dans l'application ?

Les réseaux sont affichés dans des écrans web intégrés à CommunityGlows. Les développeurs appellent ces écrans des **WebViews** : ils ressemblent à des onglets de navigateur, mais ils fonctionnent à l'intérieur de l'application. Cette différence explique pourquoi un gestionnaire qui fonctionne parfaitement dans Chrome ou Edge ne fonctionne pas forcément de la même manière dans CommunityGlows.

La réponse courte est **oui sur Android, partiellement sous Windows, mais pas au moyen d'une API universelle de lecture des coffres**.

Le besoin n'est pas de créer un mot de passe CommunityGlows ni de construire un nouveau coffre local. Il est de permettre au gestionnaire que l'utilisateur possède déjà de remplir les formulaires des réseaux, tout en laissant CommunityGlows gérer les profils et les sessions.

## Pourquoi ne pas simplement appeler l'API du gestionnaire ?

Certains fournisseurs possèdent bien des API, mais elles ne répondent généralement pas à ce besoin.

Bitwarden propose une API publique pour administrer des organisations et une Vault Management API adossée à son CLI. Cette dernière permet de manipuler des éléments déchiffrés du coffre après authentification et déverrouillage. Elle est adaptée à l'automatisation volontaire, pas à un remplissage transparent dans une application grand public. [Documentation des API Bitwarden](https://bitwarden.com/help/bitwarden-apis/)

Les offres développeur de 1Password et les solutions de type Secrets Manager ciblent également les secrets d'entreprise, les déploiements et les processus automatisés. Elles ne constituent pas une API générique destinée à reproduire l'extension du navigateur dans une WebView.

Si CommunityGlows utilisait directement ces interfaces, l'application devrait recevoir des identifiants déchiffrés, gérer des jetons de coffre et assurer elle-même la correspondance entre domaines et comptes. Elle deviendrait alors un intermédiaire critique dans le trajet du mot de passe. Ce n'est ni nécessaire ni souhaitable.

Le bon modèle est différent :

```text
CommunityGlows indique la page visible
        ↓
Le gestionnaire vérifie l'origine et demande le choix de l'utilisateur
        ↓
Le gestionnaire remplit directement le formulaire
```

Le mot de passe ne doit jamais transiter par CommunityGlows.

## Android : l'interface universelle existe déjà

Android fournit un framework Autofill auquel les gestionnaires compatibles peuvent participer. La WebView expose une structure virtuelle représentant ses champs HTML et leur origine. Le fournisseur sélectionné par l'utilisateur peut alors proposer les comptes correspondants près du clavier ou dans une liste système.

CommunityGlows peut rendre ses WebViews éligibles à ce mécanisme sans savoir si le fournisseur est Google Password Manager, 1Password, Bitwarden ou un autre. Il ne lit pas le coffre, ne choisit pas le compte et ne remplit pas lui-même les champs.

Cette participation doit couvrir :

- la WebView principale de l'application ;
- les WebViews des réseaux ;
- les fenêtres enfants utilisées par certains parcours de connexion ;
- uniquement Android 8 ou une version ultérieure, où le framework Autofill est disponible.

Android recommande par ailleurs Credential Manager pour les identifiants appartenant à l'application elle-même. Demander des credentials au nom de sites tiers est une capacité privilégiée destinée notamment aux navigateurs. Les fournisseurs doivent autoriser l'application appelante et Google Password Manager impose une procédure d'approbation. [Appels Credential Manager privilégiés](https://developer.android.com/identity/sign-in/privileged-apps)

Pour CommunityGlows, Autofill reste donc la solution officielle et indépendante du fournisseur. La compatibilité exacte doit toutefois être validée sur des appareils réels : un gestionnaire ou un réseau peut refuser un formulaire embarqué, utiliser une iframe particulière ou nécessiter un réglage supplémentaire.

## Windows : l'écran intégré n'est pas Microsoft Edge

Sous Windows, les écrans web intégrés de CommunityGlows utilisent une technologie Microsoft appelée WebView2. Le moteur d'affichage provient de Microsoft Edge, mais l'application ne réutilise pas automatiquement le profil Edge de l'utilisateur.

WebView2 stocke ses cookies, paramètres, données de formulaire et éventuels mots de passe dans un User Data Folder propre à l'application. Il possède une option officielle `IsPasswordAutosaveEnabled`, désactivée par défaut, mais l'activer créerait essentiellement un coffre WebView2 séparé. Cela ne donnerait pas accès aux identifiants déjà synchronisés dans Google Password Manager, 1Password ou Bitwarden. [Données de profil WebView2](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/user-data-folder)

Windows ne fournit pas non plus aux applications desktop un équivalent universel d'Android Autofill pour les mots de passe web. Il reste alors les mécanismes proposés par chaque fournisseur :

- 1Password Auto-Type peut saisir des identifiants dans la fenêtre active ;
- Bitwarden permet notamment le glisser-déposer depuis son application desktop ;
- d'autres fournisseurs proposent leurs propres raccourcis ou intégrations.

Ces solutions fonctionnent mieux lorsque seule la WebView visible conserve le focus. Une WebView préchargée ou cachée ne doit jamais recevoir des saisies destinées au réseau affiché.

## Notre extension peut-elle parler à l'extension du gestionnaire ?

Chrome et les navigateurs Chromium autorisent la communication entre extensions avec `runtime.sendMessage()` et `runtime.connect()`. Mais l'extension destinataire doit écouter les messages externes et exposer volontairement une API. Elle peut également limiter les appelants autorisés avec `externally_connectable`. [Communication entre extensions](https://developer.chrome.com/docs/extensions/develop/concepts/messaging#cross-extension-messaging)

Une extension de gestionnaire sérieuse n'expose normalement pas une commande telle que :

```text
getCredentials("instagram.com")
```

Ce serait une porte d'exfiltration du coffre.

Une éventuelle intégration fournisseur devrait plutôt prendre cette forme :

```text
fillCurrentPage({ tabId, origin })
```

Le gestionnaire vérifierait l'origine, afficherait son interface, laisserait l'utilisateur choisir un compte et remplirait la page directement. CommunityGlows ne recevrait jamais le mot de passe. Cette approche nécessite néanmoins une API officielle ou un partenariat avec chaque fournisseur.

Native Messaging permet à notre extension de communiquer avec l'application CommunityGlows. Le host natif déclare explicitement quels identifiants d'extension sont autorisés. Notre extension ne peut donc pas se connecter arbitrairement au host natif privé de 1Password ou d'un autre gestionnaire. [Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)

Techniquement, un content script CommunityGlows pourrait lire la valeur d'un champ après son remplissage. Ce serait pourtant la mauvaise architecture : l'extension deviendrait un collecteur de mots de passe. Les règles du Chrome Web Store classent explicitement les mots de passe, cookies d'authentification et données de formulaires parmi les données utilisateur sensibles. [Politique relative aux données utilisateur](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)

## Peut-on charger les extensions dans l'écran intégré ?

WebView2 propose désormais `AddBrowserExtensionAsync`, qui installe une extension Chromium décompressée depuis un dossier local. [API d'extensions WebView2](https://learn.microsoft.com/en-us/dotnet/api/microsoft.web.webview2.core.corewebview2profile.addbrowserextensionasync)

C'est une piste de prototype intéressante, mais pas encore une solution universelle prête à distribuer :

- l'extension doit être disponible sous forme décompressée ;
- elle doit être installée et conservée dans les profils WebView2 concernés ;
- elle peut dépendre d'API Chromium non disponibles dans WebView2 ;
- son popup ou sa barre d'outils ne s'intègre pas automatiquement à l'interface CommunityGlows ;
- son canal natif peut refuser une application hôte non reconnue ;
- la redistribution et les mises à jour nécessitent l'accord et les règles du fournisseur.

1Password permet d'ajouter certains navigateurs Windows supplémentaires lorsqu'ils sont signés ou installés dans `Program Files`. Cette ouverture rend un test possible, mais 1Password précise aussi qu'un navigateur ainsi autorisé reçoit un accès très sensible lorsque le coffre est déverrouillé. [Navigateurs supplémentaires 1Password](https://support.1password.com/additional-browsers/)

Un prototype WebView2 doit donc tester le mécanisme générique avec plusieurs extensions représentatives, sans concevoir l'architecture autour d'un seul fournisseur.

## Peut-on intégrer un Store et proposer toutes les extensions ?

Il faut d'abord distinguer deux magasins souvent confondus :

- le **Google Play Store** distribue des applications Android, notamment les applications 1Password, Bitwarden ou Proton Pass ;
- le **Chrome Web Store** et le catalogue **Edge Add-ons** distribuent des extensions de navigateur sur ordinateur.

Sur Android, CommunityGlows ne peut pas embarquer le Play Store ni charger des extensions Chrome dans une WebView. L'utilisateur installe son gestionnaire depuis le Play Store, puis Android Autofill sert d'interface entre ce gestionnaire et les formulaires affichés dans CommunityGlows.

Sous Windows, WebView2 ne fournit pas un Chrome Web Store intégré. Il permet à l'application hôte de charger une extension Chromium déjà décompressée depuis un dossier local, mais il ne fournit pas automatiquement le catalogue, le bouton d'installation, les mises à jour ou la compatibilité complète d'un vrai navigateur.

CommunityGlows pourrait construire son propre écran « Extensions compatibles » : télécharger ou sélectionner un package, vérifier son identité et sa version, l'installer dans le bon profil puis gérer ses mises à jour. Ce serait toutefois notre propre catalogue contrôlé, pas une intégration officielle du Chrome Web Store.

Autoriser toutes les extensions sans contrôle serait dangereux. Une extension disposant de permissions étendues pourrait observer les pages, formulaires et sessions de plusieurs comptes sociaux. CommunityGlows devrait alors assumer la vérification des packages, les mises à jour de sécurité, les licences, les permissions et les incidents liés à une extension compromise.

Le compromis raisonnable serait donc un **CommunityGlows Extension Hub** limité aux gestionnaires de mots de passe explicitement testés :

- installation volontaire et consentement clair ;
- package officiel ou sélectionné localement par l'utilisateur ;
- identité, version, empreinte et permissions vérifiées ;
- statut `compatible`, `expérimental` ou `non testé` ;
- désactivation et suppression immédiates ;
- aucun accès de CommunityGlows aux identifiants remplis.

Le premier prototype Windows utilise Bitwarden comme candidat technique. Dans les Paramètres, un parcours guidé ouvre la page officielle des versions Bitwarden puis permet de sélectionner l'archive Chromium `dist-chrome-*.zip`. CommunityGlows la valide, l'extrait uniquement dans ses données locales et demande un redémarrage ; rien n'est téléversé et l'application ne lit ni le coffre ni les champs remplis. Ce test doit encore prouver que la connexion au coffre, le menu près des champs, les formulaires en plusieurs étapes et la persistance fonctionnent réellement dans la version packagée. Il ne constitue donc pas encore une promesse de compatibilité publique.

Pour proposer réellement tous les Stores, toutes les extensions et Google Password Manager sous Windows, il faudrait utiliser un véritable navigateur Chrome ou Edge plutôt que WebView2.

## L'option la plus universelle sous Windows : un vrai navigateur

La seule manière d'obtenir immédiatement l'écosystème complet des gestionnaires existants est d'utiliser un véritable navigateur avec de vrais profils.

CommunityGlows pourrait rester le tableau de bord et l'orchestrateur :

- un profil Chrome ou Edge distinct par contexte CommunityGlows ;
- les réseaux ouverts dans le profil correspondant ;
- les extensions choisies par l'utilisateur disponibles normalement ;
- Google Password Manager disponible dans Chrome ;
- les cookies et autres données de session conservés par le navigateur ;
- notre extension chargée uniquement de relier les commandes, fenêtres et profils à CommunityGlows.

Le compromis est important : les réseaux seraient affichés dans des fenêtres navigateur plutôt que dans les WebViews intégrées actuelles. Copier ensuite la session vers WebView2 serait fragile et risqué. Une connexion moderne peut dépendre de cookies `HttpOnly`, de `localStorage`, d'IndexedDB, de service workers et de protections liées au périphérique. Il est plus sûr de conserver la session dans le moteur qui l'a créée.

## Pourquoi CommunityGlows ne construit pas un nouveau coffre de mots de passe

Une autre voie est techniquement possible : CommunityGlows pourrait conserver les identifiants et mots de passe dans un coffre chiffré de bout en bout. Sur un nouvel ordinateur, l'utilisateur saisirait une clé de récupération, déverrouillerait le coffre, choisirait un compte dans un popup CommunityGlows, puis remplirait le formulaire de connexion visible.

Cette solution répondrait à une partie du problème de portabilité sous Windows, mais elle transformerait aussi CommunityGlows en gestionnaire de mots de passe. Il ne s'agirait pas simplement de chiffrer quelques mots de passe. La réaliser sérieusement imposerait de gérer :

- le chiffrement de bout en bout et les clés de récupération ;
- le verrouillage automatique, la biométrie et le stockage sécurisé des clés sous Windows ;
- l'ajout et la révocation des appareils ;
- la synchronisation et les conflits ;
- la correspondance stricte des domaines et la protection contre le phishing ;
- le remplissage sécurisé dans les WebViews ;
- les passkeys, le double facteur, les CAPTCHA et les changements de mots de passe ;
- des audits de sécurité indépendants réguliers ;
- une procédure d'intervention en cas de vulnérabilité ou de perte de clé.

Ce chantier demanderait probablement plusieurs mois de développement, puis une responsabilité de sécurité permanente. CommunityGlows finirait par reconstruire un gestionnaire de mots de passe moins mature au lieu d'améliorer son cœur de métier, l'espace de travail social, tandis que les parcours propres à chaque fournisseur empêcheraient malgré tout une connexion universelle en un clic.

Le bénéfice ne justifie pas de recréer un gestionnaire mature à l'intérieur d'un espace de travail social. CommunityGlows retient donc un modèle plus limité :

- les mots de passe restent chez le gestionnaire choisi par l'utilisateur ;
- les sessions actives des réseaux restent locales à l'appareil ;
- les profils et préférences peuvent être synchronisés séparément ;
- un export de sauvegarde chiffré permet de déplacer explicitement les sessions locales compatibles ;
- une reconnexion peut rester nécessaire sur un nouvel appareil.

L'activation du gestionnaire de mots de passe propre à WebView2 peut être évaluée comme commodité locale sous Windows, mais elle créerait un stockage spécifique à CommunityGlows sur cet ordinateur. Elle ne fournirait pas le coffre multi-appareils que l'utilisateur possède déjà dans son gestionnaire habituel.

## Les options réalistes

À ce stade, la stratégie se résume ainsi :

| Plateforme | Solution immédiate | Piste avancée |
| --- | --- | --- |
| Android | Autofill système, indépendant du fournisseur | Demande de statut privilégié auprès des fournisseurs |
| Windows dans CommunityGlows | Auto-Type, glisser-déposer et focus strict | Hébergement expérimental d'extensions Chromium |
| Windows navigateur | Gestionnaire et extensions habituels | Profils navigateur orchestrés par CommunityGlows |

Il n'existe pas d'API magique capable de lire tous les coffres, et ce serait une mauvaise idée d'en souhaiter une. La bonne intégration laisse le gestionnaire remplir directement la page.

Pour Android, cette abstraction existe déjà avec Autofill. Pour Windows, CommunityGlows doit choisir entre préserver l'expérience intégrée avec une compatibilité partielle, expérimenter l'hébergement d'extensions, ou utiliser de vrais profils navigateur pour obtenir la compatibilité la plus large.

La direction la plus saine reste constante : **CommunityGlows gère les profils et les sessions ; le gestionnaire choisi par l'utilisateur garde les mots de passe.**
