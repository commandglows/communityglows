---
title: "Pourquoi plusieurs réseaux ouverts consomment-ils autant de mémoire ?"
description: "WebViews, processus, pages actives et sessions chaudes : comprendre le coût d’un cockpit multi-réseaux et les compromis d’une future mise en veille."
date: "2026-09-05"
author: "CommunityGlows Team"
tags: ["performance", "memoire", "webview", "bento", "architecture"]
---

[Read this article in English](/blog/why-multiple-open-networks-use-memory)

Afficher LinkedIn, Instagram, Gmail et plusieurs autres réseaux côte à côte est pratique. Mais si vous ouvrez le gestionnaire des tâches de Windows, vous pouvez aussi voir plusieurs processus WebView2 et une consommation de mémoire plus importante que celle d’une application classique.

Ce comportement n’indique pas forcément une fuite de mémoire. Un cockpit CommunityGlows n’affiche pas de simples captures d’écran : chaque panneau contient un vrai site web, avec son interface, son JavaScript, ses images, ses caches et parfois de la vidéo ou de l’audio.

La règle générale est simple : **plus vous gardez de réseaux réellement ouverts, plus l’ordinateur doit maintenir de pages web actives.**

## Un panneau est plus proche d’un onglet que d’une image

Dans le cockpit Bento, chaque réseau visible est rendu dans une WebView. Une WebView est un moteur web intégré à l’application. Sous Windows, CommunityGlows utilise WebView2, qui repose sur le moteur de Microsoft Edge.

La page doit conserver de nombreux éléments en mémoire :

- le document et sa mise en page ;
- le code JavaScript du réseau ;
- les données temporaires de l’interface ;
- les images, polices et autres ressources décodées ;
- les connexions réseau et tâches en arrière-plan ;
- la surface graphique nécessaire à l’affichage.

Un réseau social moderne est souvent une application complète. Même lorsque vous ne touchez pas son panneau, il peut actualiser un compteur, recevoir un événement, préparer une vidéo ou exécuter un minuteur.

## Pourquoi autant de processus dans Windows ?

WebView2 reprend l’architecture multi-processus de Microsoft Edge. Le travail peut être réparti entre un processus principal, des processus de rendu et des services spécialisés pour le GPU, le réseau ou l’audio. Microsoft explique que le nombre exact dépend des fonctionnalités utilisées, des sites chargés et de leur isolation. [Voir la FAQ officielle WebView2](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/end-user-faq).

Cela explique pourquoi CommunityGlows ne correspond pas à une seule ligne dans le gestionnaire des tâches. Plusieurs processus ne signifient pas que plusieurs copies complètes de l’application ont démarré. Ils font partie du moteur web qui exécute les pages.

Cette séparation a aussi un intérêt : un problème dans le rendu d’un site est mieux contenu et les ressources d’une page peuvent être gérées plus indépendamment. Elle a toutefois un coût de démarrage et de mémoire. [Les recommandations de performance WebView2](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/performance) confirment que la consommation augmente généralement avec le nombre d’instances et la complexité de leur contenu.

## Pourquoi CommunityGlows ne réutilise-t-il pas une seule WebView ?

Une WebView unique consommerait moins de ressources dans certains scénarios. Mais changer de réseau obligerait alors à remplacer la page affichée, puis à la recharger au retour. Ce modèle convient à une navigation séquentielle ; il convient moins à un cockpit où plusieurs réseaux doivent rester visibles ensemble.

CommunityGlows associe aussi les sessions aux couples profil-réseau. Cette séparation réduit les mélanges de contexte entre un compte personnel, une marque et un client. Partager davantage de moteur ou de stockage peut économiser des ressources, mais peut aussi affaiblir cette frontière si le changement n’est pas soigneusement conçu et vérifié.

Nous ne déduisons donc pas qu’un partage plus agressif est sûr à partir d’un simple gain théorique de mémoire. La priorité reste de mesurer le comportement réel sans sacrifier la séparation attendue entre les profils.

Pour comprendre ce choix d’architecture, lisez [pourquoi CommunityGlows utilise Tauri plutôt qu’un fork de Chromium](/blog/pourquoi-communityglows-utilise-tauri-plutot-que-fork-chromium).

## Garder une page « chaude » : rapide, mais pas gratuit

Lorsqu’une page reste chaude, son moteur, son état et sa position de lecture peuvent être conservés. Revenir au réseau paraît alors presque instantané : la page n’a pas besoin de repartir de zéro.

Ce confort consomme des ressources. Même cachée, une page peut garder en mémoire son document, son tas JavaScript, ses caches et une partie de son état graphique. Certaines activités peuvent être ralenties par le moteur lorsqu’elles ne sont pas visibles, mais « caché » ne signifie pas automatiquement « arrêté ».

CommunityGlows utilise actuellement un pool borné de WebViews chaudes. Sous Windows, une WebView masquée peut être conservée pour un retour rapide, tandis que les entrées masquées les plus anciennes finissent par être fermées lorsque la limite du pool est atteinte. L’application enregistre aussi des diagnostics distinguant les WebViews visibles et masquées afin de pouvoir mesurer ce comportement.

Ce mécanisme limite l’accumulation des pages cachées. Il ne supprime pas le coût des panneaux encore visibles, ni celui des quelques pages chaudes conservées temporairement.

## Masquer n’est pas fermer, fermer n’est pas oublier la session

Ces trois actions sont différentes :

- **Masquer** retire la page de l’écran, mais peut conserver sa WebView en mémoire.
- **Fermer la WebView** libère son instance active ; la prochaine ouverture peut demander un nouveau chargement.
- **Effacer une session** supprime les données de connexion locales associées et peut imposer une nouvelle authentification.

CommunityGlows peut donc fermer une ancienne WebView du pool sans supprimer le profil ni effacer automatiquement la session stockée sur le disque. À l’inverse, cacher un panneau pour afficher un dialogue ou déplacer une carte ne doit pas être présenté comme une optimisation complète de la mémoire.

Cette nuance est centrale : préserver la session et préserver toute la page vivante ne sont pas la même chose.

## La mémoire et le processeur ne racontent pas la même histoire

La mémoire conserve l’état nécessaire aux pages et au moteur. Le processeur travaille lorsqu’une page exécute du JavaScript, recalcule son affichage, décode un média ou traite des événements.

Une page peut donc occuper beaucoup de mémoire tout en utilisant peu de processeur. À l’inverse, un seul réseau avec une vidéo, une animation ou un flux très actif peut provoquer un pic de CPU sans être le plus gros consommateur de mémoire.

Le coût dépend notamment :

- du nombre de panneaux visibles ;
- des sites ouverts et de leur complexité ;
- de l’activité vidéo, audio et temps réel ;
- de la quantité de mémoire disponible sur l’ordinateur ;
- de la version du moteur WebView et des comportements propres aux sites.

Il serait donc trompeur d’annoncer un chiffre de mémoire fixe « par réseau ».

## Que peut faire l’utilisateur aujourd’hui ?

Pour un poste disposant de peu de mémoire, le levier le plus direct est de garder visibles seulement les réseaux nécessaires au travail du moment. Une Scène ciblée — par exemple « Publication » ou « Réponses » — peut être plus légère qu’un cockpit réunissant tous les réseaux en permanence.

Fermer les panneaux inutiles réduit le nombre de pages visibles. Une WebView peut néanmoins rester chaude dans le pool jusqu’à son éviction : fermer une carte ne garantit donc pas une baisse immédiate dans le gestionnaire des tâches. Fermer puis relancer CommunityGlows met fin à toutes les WebViews actives lorsque l’on souhaite repartir d’un état entièrement neuf.

Sur les pages concernées, arrêter une vidéo ou un flux audio peut réduire l’activité processeur. Les résultats varient toutefois selon le réseau : CommunityGlows ne contrôle pas le code exécuté par les sites tiers.

Pour organiser des cockpits plus ciblés, consultez [notre guide des Scènes Bento](/blog/transformer-grand-ecran-cockpit-multi-reseaux-bento).

## La mise en veille des pages inactives : une piste, pas une fonction livrée

La prochaine étape logique consiste à aller plus loin qu’un simple masquage. Une page inactive pourrait recevoir une priorité mémoire réduite, être suspendue, déchargée ou remplacée par un état minimal, puis être rechargée lorsque l’utilisateur y revient.

Mais chaque stratégie produit un compromis :

- réduire la priorité conserve davantage d’état, mais libère moins de mémoire ;
- suspendre les tâches peut perturber les notifications ou connexions temps réel ;
- décharger la page récupère plus de ressources, mais impose un rechargement ;
- restaurer une page doit préserver la bonne session sans réintroduire un autre profil.

**La mise en veille des pages inactives est actuellement en développement dans CommunityGlows. Elle ne fait pas partie des fonctions livrées et aucune date de disponibilité n’est annoncée.**

Le travail ne consiste pas seulement à ajouter un minuteur. Il faut définir ce qui compte comme inactif, protéger les médias en cours, gérer la mémoire faible, vérifier chaque plateforme et mesurer le temps de reprise. Une économie de RAM n’est utile que si elle ne rend pas le cockpit imprévisible.

## Le compromis du cockpit

Le Bento échange volontairement une partie des ressources de la machine contre moins de changements de contexte : plusieurs réseaux restent visibles, les pages conservent leur état et le retour entre les espaces est plus rapide.

CommunityGlows limite déjà les WebViews masquées conservées à chaud, mais un vrai cockpit multi-réseaux restera naturellement plus gourmand qu’une application affichant une seule page à la fois.

L’objectif n’est pas de prétendre que ce coût disparaît. Il est de le rendre mesurable, borné et ajustable — puis d’introduire la mise en veille seulement lorsqu’elle pourra réduire la consommation sans compromettre les sessions et la compréhension de l’utilisateur.
