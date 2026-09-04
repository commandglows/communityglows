---
title: "CommunityGlows : ce qui reste sur votre appareil et ce qui est synchronisé"
description: "Sessions, profils, préférences, Scènes et sauvegardes : comprendre simplement quelles données CommunityGlows garde localement et lesquelles peuvent suivre votre compte."
date: "2026-09-05"
author: "CommunityGlows Team"
tags: ["confidentialite", "synchronisation", "sessions", "profils", "scenes"]
---

[Read this article in English](/blog/what-stays-local-and-what-syncs-in-communityglows)

Quand une application fonctionne sur plusieurs appareils, le mot « synchronisation » peut laisser croire que tout est envoyé dans le cloud. Dans CommunityGlows, ce n’est pas le cas.

Nous séparons deux besoins qui se ressemblent, mais qui n’ont pas les mêmes conséquences : retrouver son **organisation** et transférer une **connexion active à un réseau social**. CommunityGlows synchronise certaines données utiles à l’organisation du travail. Les sessions de connexion aux réseaux, elles, restent attachées à l’appareil qui les a créées.

Cette frontière est volontaire. Elle permet de retrouver ses profils et ses espaces de travail sans prétendre qu’une connexion Instagram, LinkedIn ou Gmail peut être déplacée silencieusement d’un ordinateur à un téléphone.

## La réponse courte

Lorsque vous êtes connecté à CommunityGlows, la synchronisation peut concerner :

- vos profils CommunityGlows ;
- une sélection de préférences de l’application ;
- vos liens personnalisés et les réseaux associés aux profils ;
- les Scènes enregistrées du cockpit Bento ;
- certaines données d’organisation liées aux comptes et filtres sociaux.

Restent locaux à chaque appareil :

- les sessions ouvertes dans les réseaux sociaux ;
- les cookies et autres données web qui maintiennent ces connexions ;
- le brouillon actuel du cockpit pour chaque profil ;
- les tâches contextuelles dans leur version actuelle ;
- les données propres au moteur web ou au système qui ne font pas partie du contrat de synchronisation.

En pratique, vous pouvez retrouver la structure de votre espace sur un autre appareil, tout en devant vous reconnecter aux réseaux sur cet appareil.

## Un profil CommunityGlows n’est pas un compte de réseau social

Un profil CommunityGlows sert à organiser un contexte : par exemple « Personnel », « Studio » ou le nom d’un client. Il peut contenir un nom, une apparence, une sélection de réseaux et des liens personnalisés.

Ce profil peut être synchronisé. Mais il ne contient pas pour autant votre mot de passe LinkedIn ni une copie universelle de votre connexion Instagram.

La distinction est importante :

```text
Profil CommunityGlows synchronisé
        ≠
Session de connexion au réseau transférée
```

Quand vous ouvrez le même profil sur un nouvel appareil, CommunityGlows peut reconstruire son organisation. Le moteur web local doit encore établir ses propres sessions auprès de chaque plateforme.

## Pourquoi les sessions restent-elles locales ?

Une connexion web moderne ne se résume pas à un identifiant et un mot de passe. Elle peut dépendre de cookies, de `localStorage`, d’IndexedDB, de caches, de service workers, du moteur web utilisé et de protections décidées par la plateforme elle-même.

Ces mécanismes varient aussi entre WebView2 sous Windows, Android System WebView et un navigateur classique. Copier une partie de cet état ne garantit donc ni une restauration complète ni l’acceptation de la session par le service concerné.

CommunityGlows conserve les sessions dans les espaces locaux prévus pour ses profils et ses réseaux. Sur les plateformes où l’isolation native est disponible, l’application sépare ces espaces par couple profil-réseau. Les modes de repli ont toutefois des limites documentées : tous les types de stockage web ne peuvent pas être reproduits ou isolés de la même façon.

Pour comprendre cette frontière sur Android, consultez [comment CommunityGlows sépare les sessions WebView](/blog/android-webview-session-isolation). Pour les mots de passe, notre principe est tout aussi simple : [le gestionnaire choisi par l’utilisateur garde le coffre](/blog/integrer-gestionnaires-mots-de-passe-webviews-communityglows).

## Ce que la synchronisation aide réellement à retrouver

La synchronisation est conçue pour réduire le travail de reconstruction, pas pour cloner un appareil.

### Les profils

Vos profils donnent une structure commune à CommunityGlows. Les retrouver évite de recréer manuellement chaque contexte et sa sélection de réseaux.

### Les préférences prises en charge

Des réglages tels que la langue, le thème, certaines options d’affichage, les raccourcis ou le profil actif font partie des préférences que l’application sait transmettre. La liste exacte peut évoluer avec le produit : « paramètres synchronisés » ne signifie pas que chaque donnée interne ou chaque réglage du système quitte l’appareil.

### Les liens et l’organisation sociale

Les liens personnalisés associés aux profils, ainsi que certaines informations servant à organiser les comptes et filtres, font partie du modèle synchronisé. Cela permet de retrouver un espace cohérent sans synchroniser le contenu privé des pages ouvertes.

### Les Scènes du cockpit Bento

Une Scène enregistre une disposition nommée : quels panneaux composent le cockpit et comment ils sont organisés. Les Scènes sont enregistrées localement puis placées dans la file de synchronisation du workspace. Elles peuvent ainsi suivre leur profil sur les appareils connectés compatibles.

Une Scène restaure une **organisation**, pas son état de connexion. Si elle contient trois réseaux côte à côte, le nouvel appareil peut reconstruire ces trois emplacements, mais chacun peut demander une connexion locale.

Le brouillon courant est différent. Il représente l’état de travail non enregistré du profil sur cet appareil et reste local. Pour découvrir le fonctionnement complet du cockpit, lisez [comment transformer un grand écran en cockpit multi-réseaux](/blog/transformer-grand-ecran-cockpit-multi-reseaux-bento).

## Et les tâches ?

Le gestionnaire de tâches contextuelles permet d’associer une intention, une note, des personnes, des liens, des tags, une priorité ou une échéance. Dans sa version actuelle, ce tableau utilise un stockage local versionné et n’est pas synchronisé par le cloud CommunityGlows.

Une tâche créée sur un ordinateur ne doit donc pas être supposée présente sur un autre appareil. Cette limite est préférable à une promesse floue : tant qu’une donnée ne fait pas explicitement partie du contrat cloud, elle doit être considérée comme locale.

## La synchronisation continue de fonctionner avec une connexion hésitante

CommunityGlows enregistre d’abord les changements utiles localement et utilise une file pour les opérations cloud. Cette approche permet à l’interface de rester utilisable lorsqu’une connexion est temporairement indisponible.

Elle ne transforme toutefois pas le mode hors ligne en garantie de réplication immédiate. Tant qu’une opération n’a pas atteint le service de synchronisation, un second appareil ne peut pas la recevoir. Des limites de taille et des validations protègent aussi les données du workspace contre des états excessifs ou corrompus.

## Une sauvegarde n’est pas la synchronisation

CommunityGlows propose également une sauvegarde chiffrée, créée volontairement par l’utilisateur. Elle peut contenir les données de l’application et, selon la plateforme, des instantanés de sessions locales compatibles.

Cette sauvegarde répond à un autre besoin : déplacer ou restaurer explicitement un état. Elle n’est pas une réplication cloud en continu. Même après restauration, une reconnexion peut être nécessaire, car certains stockages ou contrôles de sécurité appartiennent au moteur web, au système ou au réseau social.

Le chiffrement d’un export protège son contenu selon le mécanisme de sauvegarde de l’application ; il ne transforme pas toutes les sessions tierces en données portables et ne remplace pas les protections du compte social.

## Ce que « dans le cloud » ne veut pas dire

Le cloud CommunityGlows n’est pas une copie de tout ce qui apparaît dans les WebViews. La synchronisation ne signifie pas que l’application lit les messages, publications, formulaires ou mots de passe affichés par les réseaux.

Les sites restent des services tiers avec leurs propres règles, stockages et cycles de connexion. CommunityGlows organise leur accès dans un workspace ; il ne remplace pas leurs serveurs et ne contourne pas leurs contrôles.

Cette séparation implique aussi quelques attentes simples :

- supprimer une Scène ne ferme pas un compte social ;
- synchroniser un profil ne connecte pas automatiquement le nouvel appareil ;
- se déconnecter de CommunityGlows et se déconnecter d’un réseau sont deux actions différentes ;
- restaurer une sauvegarde peut nécessiter de valider à nouveau certaines connexions.

## Une règle facile à retenir

**L’organisation peut vous suivre ; les connexions restent là où elles ont été créées.**

Cette règle n’efface pas toutes les différences entre Windows, Android et les extensions de navigateur. Elle donne cependant une attente honnête : CommunityGlows synchronise ce qui aide à retrouver votre espace de travail, tandis que les sessions sensibles et les états propres aux moteurs web restent locaux, sauf transfert explicite par une sauvegarde compatible.

Cette architecture demande plus de nuance qu’un simple bouton « tout synchroniser ». Elle évite surtout de confondre confort d’organisation et portabilité des connexions — deux promesses très différentes.
