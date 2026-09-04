---
title: "Pourquoi CommunityGlows utilise Tauri plutôt qu’un fork de Chromium"
description: "Vue, Tauri, WebView2, Android WebView, Flutter ou Chromium : les choix techniques derrière CommunityGlows, leurs avantages et leur coût réel."
date: "2026-09-04"
author: "CommunityGlows Team"
tags: ["architecture", "tauri", "chromium", "webview", "coulisses"]
---

[Read this article in English](/blog/why-communityglows-uses-tauri-instead-of-forking-chromium)

CommunityGlows rassemble plusieurs réseaux sociaux dans un même espace de travail. Sur un grand écran, plusieurs réseaux peuvent rester ouverts côte à côte. Les profils servent à séparer les contextes personnels, professionnels ou clients. La même logique doit aussi fonctionner dans une extension de navigateur, une application Windows et une application Android.

Vu de l’extérieur, la solution paraît évidente : puisque le produit ressemble parfois à un navigateur spécialisé, pourquoi ne pas avoir simplement créé notre propre version de Chromium ?

La question est bonne. Elle révèle même la tension centrale de notre architecture : **CommunityGlows a besoin de capacités proches de celles d’un navigateur, sans avoir vocation à devenir un navigateur généraliste.**

Voici pourquoi nous avons choisi une base Vue avec Tauri et les moteurs web natifs des plateformes, ce que cette décision nous a permis d’éviter, et ce qu’elle nous oblige malgré tout à construire.

## La courte réponse

Nous voulions conserver une interface commune entre l’extension, le desktop et le mobile. L’application avait déjà une base web en Vue : la réécrire en Dart pour Flutter aurait créé une seconde interface à maintenir.

Tauri permet de conserver cette interface HTML, CSS et JavaScript, puis d’appeler du code natif lorsque la plateforme l’exige. Le projet peut ainsi utiliser Rust pour l’orchestration desktop et Kotlin pour les comportements propres à Android.

Surtout, Tauri n’intègre pas son propre moteur de navigateur. Il s’appuie sur celui du système : WebView2 sous Windows, Android System WebView sur Android et WebKit sur les plateformes Apple. [La documentation officielle de Tauri décrit cette répartition des moteurs](https://tauri.app/reference/webview-versions/).

Un fork de Chromium aurait donné davantage de contrôle sur le desktop, mais il aurait aussi fait de la maintenance d’un navigateur une activité centrale de CommunityGlows. Ce n’est pas le produit que nous voulons construire.

## Une interface web ne signifie pas « un site emballé dans une application »

La partie visible de CommunityGlows est écrite avec Vue. Elle porte la navigation, les profils, les paramètres, le gestionnaire de tâches et le cockpit Bento dans lequel plusieurs réseaux peuvent être organisés.

Cette base commune produit plusieurs surfaces :

- l’extension Chrome et Firefox ;
- l’application desktop ;
- l’application Android ;
- les futurs supports compatibles avec cette architecture.

Le code partagé s’arrête toutefois là où les plateformes ne se comportent plus de la même manière. Ouvrir un onglet dans une extension n’est pas équivalent à créer plusieurs vues web persistantes dans une application Windows. Android possède encore d’autres règles pour les profils, les cookies, le cycle de vie et les interactions système.

Tauri sert de pont à cette frontière. Son processus principal orchestre les fenêtres et les fonctions natives, tandis que les WebViews rendent l’interface. [Son modèle de processus est proche de celui des navigateurs modernes](https://tauri.app/concept/process-model/), sans distribuer un navigateur complet avec chaque application.

## Une WebView, ce n’est pas tout à fait un navigateur

Une WebView affiche du contenu web à l’intérieur d’une application. Elle fournit le moteur de rendu, JavaScript, le stockage web et les fonctions de navigation fondamentales. En revanche, elle n’apporte pas automatiquement tout ce qui entoure un navigateur : barre d’adresse, catalogue d’extensions, gestion complète des téléchargements, profils utilisateur ou politique de mise à jour de l’application.

Sous Windows, CommunityGlows utilise WebView2. Microsoft indique que son mode Evergreen suit globalement le rythme de mise à jour du canal stable d’Edge. L’application bénéficie ainsi d’un moteur web maintenu sans devoir intégrer une copie fixe de Chromium dans chaque installateur. [Microsoft détaille les modèles de distribution de WebView2](https://learn.microsoft.com/microsoft-edge/webview2/concepts/distribution).

Sous Android, Tauri utilise Android System WebView, lui-même basé sur Chromium. La version exacte dépend donc du fournisseur WebView présent sur l’appareil. Ce choix réduit le poids distribué, mais il impose de tester les variations entre versions et appareils.

Cette différence est essentielle : **Tauri évite de maintenir le moteur, pas les comportements du produit autour du moteur.**

## Ce que nous avons quand même dû construire

Le mot « WebView » peut donner l’impression que tout devient automatique. Ce n’est pas le cas lorsque plusieurs comptes doivent cohabiter proprement.

CommunityGlows doit notamment gérer :

- l’association entre un profil et un réseau ;
- la persistance locale des sessions ;
- l’ouverture, le masquage et la reprise des panneaux ;
- les limites propres aux cookies, à `localStorage` et aux autres stockages web ;
- les liens profonds et le partage Android ;
- les dimensions et la superposition de plusieurs panneaux dans le Bento ;
- les fonctions natives qui n’existent pas dans l’interface Vue.

Ce travail explique pourquoi notre couche native a grandi. Tauri nous a évité de créer un moteur de navigateur, mais il ne pouvait pas inventer notre modèle de profils ni notre cockpit multi-réseaux.

Pour comprendre précisément la séparation des sessions Android, consultez [notre article consacré aux profils WebView](/blog/android-webview-session-isolation). Pour les limites des gestionnaires de mots de passe dans des écrans web intégrés, lisez [notre analyse dédiée](/blog/integrer-gestionnaires-mots-de-passe-webviews-communityglows).

## Pourquoi pas Flutter ?

Flutter est un excellent choix lorsqu’une équipe veut construire une interface multiplateforme autour de son propre système de rendu. Sa documentation le présente comme un toolkit d’interface utilisant Dart, avec des intégrations natives par plugins et platform views. [L’architecture officielle de Flutter l’explique en détail](https://docs.flutter.dev/resources/architectural-overview).

Pour CommunityGlows, le problème était différent. Nous possédions déjà une interface Vue et une extension de navigateur en JavaScript. Passer à Flutter aurait signifié :

- réécrire l’interface principale en Dart ;
- maintenir séparément les surfaces de l’extension ;
- faire malgré tout appel aux WebViews natives pour afficher les réseaux ;
- reconstruire les ponts nécessaires aux comportements spécifiques de chaque plateforme.

Flutter aurait unifié une nouvelle interface, mais pas éliminé la difficulté principale : orchestrer plusieurs sites tiers et leurs sessions dans des moteurs web propres aux plateformes.

## Pourquoi pas Electron ?

Electron fournit Chromium et Node.js avec l’application. Cette approche offre un environnement desktop plus homogène : le moteur est connu et maîtrisé par la version distribuée.

Cela aurait été séduisant pour le Bento desktop. Mais CommunityGlows vise également Android et, plus tard, les plateformes Apple. Electron n’est pas une réponse mobile commune. Il aurait donc fallu conserver une autre architecture pour le téléphone.

Electron ne rend pas non plus l’intégration de contenus externes sans difficulté. Sa propre documentation recommande aujourd’hui d’envisager `WebContentsView` ou d’autres architectures plutôt que l’ancien élément `<webview>`, dont la stabilité est affectée par des changements internes de Chromium. [Voir la recommandation officielle d’Electron](https://www.electronjs.org/docs/latest/api/webview-tag).

Le choix aurait donc échangé la variabilité des moteurs système contre le poids d’un runtime Chromium embarqué et une seconde stratégie mobile.

## Et pourquoi ne pas forker Chromium ?

Un fork Chromium nous donnerait le contrôle le plus profond sur les profils, les extensions, les onglets, le cycle de vie des processus et les fonctions traditionnellement fournies par un navigateur.

Mais « forker Chromium » ne consiste pas simplement à changer un logo et ajouter une barre latérale. Chromium est le projet open source d’un navigateur complet, avec son moteur de rendu Blink, son moteur JavaScript V8, sa sandbox, ses processus, ses tests et ses mises à jour de sécurité.

Ses instructions officielles nécessitent une chaîne de compilation spécialisée, un checkout du code source, la génération des builds avec GN et leur compilation avec Ninja. [La documentation Chromium permet de mesurer cette surface de maintenance](https://www.chromium.org/developers/how-tos/get-the-code/).

À partir du moment où nous distribuons notre propre Chromium, nous devenons responsables de suivre l’amont, intégrer rapidement les correctifs, tester chaque version et distribuer les mises à jour. Les principes de Chromium placent d’ailleurs explicitement les mises à jour automatiques, la défense en profondeur et les tests au centre de la sécurité du navigateur. [Ce sont des responsabilités continues, pas une étape initiale](https://www.chromium.org/developers/core-principles/).

Pour une entreprise dont le produit serait « un nouveau navigateur », cette charge pourrait être justifiée. Pour CommunityGlows, elle détournerait une grande partie de l’effort de notre vraie valeur : organiser le travail social, réduire les changements de contexte et conserver des profils compréhensibles.

## Le compromis réel de notre architecture

Nous ne prétendons pas que Tauri gagne sur tous les critères.

| Besoin | Vue + Tauri + WebViews système | Chromium embarqué ou forké |
| --- | --- | --- |
| Réutiliser l’interface de l’extension | Naturel | Possible |
| Partager l’approche desktop/mobile | Oui, avec adaptations natives | Non, pas directement |
| Contrôler exactement le moteur desktop | Limité par la plateforme | Fort |
| Uniformiser le rendu entre systèmes | Plus difficile | Plus prévisible sur desktop |
| Maintenir le moteur et ses correctifs | Délégué aux fournisseurs système | Responsabilité de l’éditeur |
| Construire les profils et le cockpit | Travail CommunityGlows | Travail CommunityGlows également |

Le dernier point est le plus important. Un moteur de navigateur fournit des primitives puissantes, mais il ne conçoit ni le produit ni ses règles de confiance. Même avec Chromium, nous aurions dû définir ce qu’est un profil CommunityGlows, comment une Scène Bento est restaurée et quelles données restent strictement locales.

## Est-ce que nous referions le même choix aujourd’hui ?

Pour un produit uniquement desktop et entièrement centré sur la navigation, nous étudierions probablement plus sérieusement une distribution Chromium ou un shell qui embarque Chromium. L’accès aux extensions et l’uniformité du moteur pourraient alors justifier le coût.

Pour CommunityGlows tel qu’il existe — extension, Windows, Android et une interface Vue commune — nous conserverions l’orientation actuelle. Repartir sur un fork Chromium déplacerait l’énergie vers la maintenance d’un navigateur sans résoudre notre besoin mobile.

Cela ne signifie pas que l’architecture est figée. Nous continuerons à mesurer la consommation mémoire, la stabilité des sessions, la compatibilité des réseaux et le coût de la couche native. Une décision technique reste valable tant qu’elle sert le produit et ses utilisateurs, pas parce qu’elle a été écrite un jour dans un document.

## Ce que ce choix change pour les utilisateurs

L’utilisateur n’a pas à connaître Rust, Kotlin ou WebView2 pour utiliser CommunityGlows. Mais cette architecture explique plusieurs réalités visibles :

- une connexion à un réseau reste locale à l’appareil ;
- certains comportements diffèrent légèrement entre Windows et Android ;
- le produit peut partager son interface sans prétendre que toutes les plateformes sont identiques ;
- les mises à jour des moteurs web peuvent améliorer ou modifier la compatibilité indépendamment d’une mise à jour CommunityGlows.

Notre objectif n’est pas de cacher ces limites derrière le mot « multiplateforme ». Il est de construire un espace de travail cohérent tout en disant clairement où s’arrêtent nos garanties.

Découvrez maintenant [comment le Bento transforme un grand écran en cockpit multi-réseaux](/blog/transformer-grand-ecran-cockpit-multi-reseaux-bento), ou consultez les autres articles techniques du blog pour approfondir les sessions et les WebViews.
