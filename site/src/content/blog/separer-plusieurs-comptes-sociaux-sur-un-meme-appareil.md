---
title: "Peut-on vraiment séparer plusieurs comptes sociaux sur le même appareil ?"
description: "Profils, sessions locales, desktop, Android et extension : ce que CommunityGlows sépare réellement, et les limites à connaître avant de changer de compte."
date: "2026-09-05"
author: "CommunityGlows Team"
tags: ["profils", "sessions", "webview", "confidentialité", "multi-comptes"]
---

[Read this article in English](/blog/separate-multiple-social-accounts-on-one-device)

Gérer un compte personnel, une marque et plusieurs clients sur le même ordinateur est pratique. C’est aussi le meilleur moyen de publier au mauvais endroit si le contexte affiché n’est pas clair.

Créer plusieurs profils dans une application semble résoudre le problème. Mais une question plus importante se cache derrière l’interface : **est-ce que les connexions sont réellement séparées, ou est-ce que les profils ne font que ranger les mêmes onglets ?**

Dans CommunityGlows, un profil représente un contexte de travail. Sur les applications desktop et Android, il sert aussi à associer chaque réseau à un espace de session distinct. Dans l’extension, la frontière est différente : les sites s’ouvrent dans le navigateur et utilisent ses cookies et son stockage.

Cette nuance compte. Un profil aide à réduire les erreurs de contexte, mais ce n’est ni un coffre-fort, ni un nouvel utilisateur du système d’exploitation, ni une promesse d’isolation absolue contre tous les mécanismes de stockage web.

## La réponse courte

Oui, plusieurs comptes d’un même réseau peuvent être séparés sur un même appareil **dans les applications CommunityGlows qui utilisent des WebViews natives**, avec une frontière par profil et par réseau.

Concrètement :

- sur desktop, chaque couple profil/réseau reçoit son propre répertoire de données WebView ;
- sur Android, CommunityGlows utilise un profil WebKit distinct quand l’appareil prend en charge cette fonction ;
- sur les appareils Android qui ne la prennent pas en charge, un mode de repli restaure séparément les cookies et certains éléments de `localStorage`, mais sa couverture est plus limitée ;
- dans l’extension Chrome ou Firefox, les réseaux s’ouvrent dans des onglets ordinaires et restent soumis au profil du navigateur. L’extension ne promet donc pas une isolation native des sessions CommunityGlows.

La bonne question n’est pas seulement « ai-je créé deux profils ? », mais aussi « depuis quelle surface est-ce que j’ouvre le réseau ? ».

## Un profil CommunityGlows est un contexte de travail

Imaginez deux profils : « Personnel » et « Client A ». Ils peuvent contenir le même réseau social, mais ne désignent pas le même contexte.

Le profil permet de regrouper les réseaux et les liens utiles, de conserver un brouillon de workspace propre au profil et d’organiser des Scènes Bento. Sur desktop, une Scène peut mémoriser la disposition de plusieurs panneaux. Les Scènes nommées peuvent être synchronisées, tandis que les brouillons et les sessions de connexion restent locaux à l’appareil.

Cette distinction évite un malentendu fréquent : synchroniser la structure de son espace de travail ne signifie pas transférer ses connexions sociales vers un autre téléphone ou ordinateur. Retrouver une Scène ailleurs peut rouvrir les bons réseaux, mais il faudra s’y connecter sur cet appareil si aucune session locale n’y existe.

Les profils améliorent aussi la lisibilité : un nom, une sélection de réseaux et une disposition différente rendent le contexte visible avant d’agir. Ils ne peuvent toutefois pas vérifier à votre place le nom du compte affiché par le réseau. Avant une publication sensible, le dernier contrôle reste humain.

## Sur desktop : un espace de données par profil et par réseau

Dans l’application desktop, CommunityGlows crée les WebViews à partir d’une identité composée du profil et du réseau. Chaque couple utilise un répertoire de données distinct dans les données locales de l’application.

Cela signifie que « Personnel + réseau X » et « Client A + réseau X » ne pointent pas volontairement vers le même stockage WebView. Cookies, `localStorage` et `IndexedDB` sont alors gérés dans les espaces de données correspondants du moteur web desktop.

Le Bento peut masquer puis réafficher une WebView sans la recréer. Cette mise en attente conserve la session attachée au même couple profil/réseau ; déplacer un panneau ou changer de disposition n’est donc pas censé déplacer sa connexion vers un autre profil.

Cette séparation a néanmoins un périmètre précis : elle vit à l’intérieur de CommunityGlows sur cet appareil. Elle ne crée pas un compte Windows distinct, ne chiffre pas à elle seule toutes les données locales et ne contrôle pas ce que le réseau social conserve sur ses propres serveurs. Un utilisateur ayant accès au compte du système d’exploitation ou aux fichiers de l’application relève d’une autre frontière de sécurité.

## Sur Android : le meilleur mode dépend du WebView disponible

Android fournit son propre moteur WebView. Lorsque la fonction `MULTI_PROFILE` d’AndroidX WebKit est disponible, CommunityGlows attribue un profil WebKit natif différent à chaque couple profil/réseau avant de naviguer vers le site. Les données gérées par ce profil WebKit, notamment les cookies et le stockage web exposé par le moteur, restent attachées à cette session.

Ce mode permet aussi de garder un nombre limité de WebViews prêtes à revenir à l’écran, sans les faire partager intentionnellement un gestionnaire global de cookies.

Tous les appareils et moteurs WebView ne proposent cependant pas les mêmes fonctions. Sans `MULTI_PROFILE`, CommunityGlows désactive ce fonctionnement multi-WebView et utilise un mode de repli avec une seule WebView : les cookies sont persistés par session et des instantanés de `localStorage` sont enregistrés par session et par origine web exacte.

Ce repli réduit les mélanges pour les mécanismes couverts, mais il n’équivaut pas à un profil WebKit natif. Il ne couvre pas notamment :

- `IndexedDB` ;
- `CacheStorage` ;
- les service workers ;
- le cache HTTP global du WebView ;
- le coffre d’identifiants du système.

Si le moteur ne permet pas de restaurer `localStorage` avant le JavaScript de la page ou d’en capturer durablement les changements, CommunityGlows considère également le fonctionnement comme dégradé. Il serait trompeur de présenter ce cas comme une isolation complète.

Pour le détail technique des origines et des stockages couverts, consultez [notre article sur l’isolation des sessions WebView Android](/blog/android-webview-session-isolation).

## Dans l’extension : c’est le profil du navigateur qui fait foi

L’extension CommunityGlows n’embarque pas les réseaux dans des WebViews natives. Elle les ouvre dans des onglets Chrome ou Firefox.

Ces onglets utilisent les cookies, le stockage et les règles du profil de navigateur courant. Deux profils CommunityGlows ouverts dans la même extension ne créent donc pas deux magasins de cookies indépendants pour un même domaine.

Pour obtenir une séparation forte côté navigateur, il faut utiliser les fonctions du navigateur ou du système prévues pour cela : profils de navigateur distincts, conteneurs lorsqu’ils sont disponibles, ou comptes utilisateur séparés. CommunityGlows ne doit pas laisser croire que son sélecteur de profil remplace ces frontières.

L’extension reste utile pour retrouver ses réseaux et son organisation, mais son modèle de session n’est pas celui des applications desktop et Android. Cette différence vient de l’architecture de la surface, pas d’un simple réglage manquant.

## Ce qui reste local et ce qui peut être synchronisé

Une connexion sociale comprend généralement des cookies et d’autres données produites par le site. Dans CommunityGlows, ces sessions de réseaux restent locales à l’appareil. Elles ne sont pas synchronisées par Convex entre vos installations.

D’autres éléments du produit peuvent, eux, être synchronisés : profils, paramètres et Scènes enregistrées selon les fonctions concernées. Les tâches contextuelles et les brouillons de workspace ont aussi leurs propres règles de persistance locale.

Cette séparation entre organisation synchronisée et connexion locale sert deux objectifs : ne pas transformer la synchronisation CommunityGlows en transport de sessions tierces, et rendre explicite qu’un nouvel appareil constitue une nouvelle frontière de connexion.

Elle a une conséquence pratique : sauvegarder ou retrouver un profil ne garantit pas que tous ses réseaux seront déjà connectés ailleurs. « Mon profil existe » et « ma session sociale est active » sont deux états différents.

## Les gestionnaires de mots de passe sont une autre frontière

Un gestionnaire de mots de passe peut proposer des identifiants dans une WebView visible. Sur Android, cela passe par le service Autofill choisi par l’utilisateur. Sur desktop, la compatibilité dépend du moteur et du gestionnaire.

Le coffre du gestionnaire n’appartient pas au profil CommunityGlows. L’application n’énumère pas son contenu, ne choisit pas un compte à la place de l’utilisateur et ne synchronise pas les mots de passe. Si plusieurs profils CommunityGlows affichent le même domaine, le gestionnaire peut donc proposer plusieurs comptes compatibles ; c’est à l’utilisateur de choisir le bon.

Notre article [sur les gestionnaires de mots de passe dans les WebViews CommunityGlows](/blog/integrer-gestionnaires-mots-de-passe-webviews-communityglows) explique cette limite plus en détail.

## Un test simple : A, B, puis A

Pour vérifier le comportement d’un réseau dans l’application desktop ou Android :

1. ouvrez le réseau dans le profil A et connectez-vous au compte A ;
2. ouvrez le même réseau dans le profil B ;
3. vérifiez que le compte A n’y apparaît pas ;
4. connectez le compte B ;
5. revenez au profil A et vérifiez que le compte A réapparaît, sans données visibles du compte B.

Ce scénario ne prouve pas toutes les propriétés de sécurité possibles. Il teste en revanche le résultat qui compte au quotidien : le changement de profil ne doit pas faire réapparaître la mauvaise session pour ce réseau et ce parcours précis.

Il faut le refaire après une évolution importante du réseau, car un site peut déplacer son authentification vers une autre origine ou un mécanisme de stockage non couvert. Une compatibilité observée aujourd’hui n’est pas une garantie immuable sur un service tiers.

## Les habitudes qui réduisent encore les erreurs

La technologie de séparation ne remplace pas une bonne discipline opérationnelle :

- donnez aux profils des noms immédiatement reconnaissables ;
- différenciez clairement les contextes client, équipe et personnel ;
- vérifiez l’avatar ou le nom du compte sur le site avant de publier ;
- n’utilisez pas l’extension comme si elle fournissait l’isolation native de l’application ;
- verrouillez la session de votre ordinateur ou téléphone quand vous vous absentez ;
- déconnectez ou supprimez une session locale lorsque l’appareil change de propriétaire.

CommunityGlows cherche à rendre le contexte plus clair et à maintenir les sessions dans leur frontière profil/réseau lorsqu’elle est disponible. Il ne peut pas supprimer le risque humain ni remplacer les protections du système d’exploitation.

## Alors, peut-on vraiment séparer plusieurs comptes ?

Oui, mais la réponse dépend de la plateforme.

Sur desktop, les espaces de données WebView sont distincts par profil et réseau. Sur Android, le mode natif multi-profile offre la frontière la plus complète disponible dans le moteur ; le mode de repli ne couvre qu’une partie des stockages. Dans l’extension, les sessions restent celles du profil Chrome ou Firefox.

La promesse honnête n’est donc pas « tous vos comptes sont hermétiquement isolés partout ». Elle est plus utile : **CommunityGlows attache chaque session native au bon contexte quand la plateforme le permet, signale les limites Android et ne présente pas l’organisation de l’extension comme une isolation qu’elle ne fournit pas.**

Pour comprendre pourquoi ces différences existent, lisez [pourquoi CommunityGlows utilise Tauri plutôt qu’un fork de Chromium](/blog/pourquoi-communityglows-utilise-tauri-plutot-que-fork-chromium). Vous pouvez aussi découvrir [comment le Bento transforme un grand écran en cockpit multi-réseaux](/blog/transformer-grand-ecran-cockpit-multi-reseaux-bento).
