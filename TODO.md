https://ntfy.sh/
Oui. **On revient au lancement de CommunityGlows, Windows-first**, avec AppSumo et les groupes privés comme canaux commerciaux.

Deux chantiers sont désormais suivis dans CommandGlows :

- **Email central** : Postmark, consentements, newsletters et transactionnel.
- **Commerce global** : Stripe, AppSumo Licensing, licences et entitlements multi-apps.

Ils restent des dépendances du lancement, mais on ne doit pas refaire leur travail ici.


### Ce qu’il nous reste à faire

1. **Figer la version Windows de lancement**  
   Déterminer précisément quelles fonctions sont incluses, notamment Bento, Scènes et Tâches, puis disposer d’un installeur correspondant.

2. **Terminer les défauts locaux du parcours d’accès**  
   État de licence cohérent entre les écrans, expiration actualisée et récupération accessible depuis l’écran bloqué — en coordination avec le chantier commerce.

3. **Tester l’application distribuée**  
   Installation, première connexion, création de profil, réseaux sociaux, changement de compte, sauvegarde/restauration et mise à jour.

4. **Finaliser le vrai tutoriel illustré**  
   Captures de cette version, étapes vérifiées dans l’application, fonctionnalités couvertes et dépannage FR/EN. Le guide actuel est une base, pas encore ce livrable final.

5. **Préparer les supports de vente**  
   Démonstration, captures, présentation des bénéfices, limites explicites et FAQ LTD. Les conditions commerciales attendent le contrat définitif des offres.

6. **Faire la recette finale et publier**  
   Raccorder les systèmes centraux validés, tester un parcours acheteur complet, publier le site et revérifier les liens publics.

**La prochaine étape logique ici : établir la liste exacte des fonctionnalités de la version de lancement et la confronter à l’application réelle.** C’est ce qui permettra de terminer correctement les tests, le tutoriel et les supports commerciaux.Aucun achat CommunityGlows suivi de l’attribution d’accès n’a été prouvé.
Oui, le centre global doit être **limité au profil CommunityGlows actif**, avec les notifications récupérées de ses comptes connectés.

🧭 PLAN À VALIDER

**Objectif :** centraliser les notifications et signaler l’activité sans imposer des alertes partout.

**Périmètre et comportement :**

- Dans **Notifications**, à droite : un choix entre **Site actuel** et **Centre CommunityGlows**.
- Dans le centre : toutes les notifications récupérées du profil actif, filtrables par compte, avec ouverture du compte concerné au clic.
- Sur la cloche : une pastille pour le site courant ; un second indicateur global, visuellement distinct et configurable.
- Sur les onglets à gauche : signalement configurable — pastille, changement de couleur, oscillation/vibration visuelle et son.
- Dans les paramètres : activation générale, choix des effets et exceptions par compte. Par défaut, je propose une pastille discrète, sans mouvement ni son.

**Actions :** auditer la réception native et l’identification des comptes, prouver la récupération sur un site connecté, puis construire le stockage par profil, le centre et les indicateurs. Les capacités réellement disponibles détermineront quels sites peuvent être pris en charge.

**Preuves attendues :** réception réelle, absence de doublons, bon compte ouvert au clic, filtres fonctionnels, isolation entre profils et respect des préférences. On distinguera les **notifications non consultées dans notre centre** des **messages non lus sur le site**, dont la synchronisation reste à vérifier.

Tu valides ce périmètre et ces réglages par défaut ?

Cette validation suit la règle de ton `AGENTS.md` : cette fonctionnalité touche plusieurs parties de l’app et nécessite des choix techniques avant modification.on remplace le comportement : clic gauche pour site actuel, et clic droit pour notification du centre communityglows. Ca me parait pas mal. Sinon oui validé le plan !!
