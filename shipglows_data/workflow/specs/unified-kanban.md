# Kanban commun : tâches et suivi des relations

Date : 2026-09-07. Direction approuvée par Diane : nom Kanban partout, reprendre les capacités utiles des deux modèles, conserver le renommage des panneaux et colonnes. Livraison de cette tranche : libellés et conception. Le périmètre fonctionnel CRM reste à valider avant implémentation. Aucun changement de stockage ni migration de données exécutés dans cette tranche.

## Contrat produit

Kanban est le nom de la fonctionnalité. Tâche reste le nom d'une action à réaliser, notamment « Nouvelle tâche ». La description actuelle explique les tâches, notes, échéances, personnes associées et liens réellement disponibles. Ne pas annoncer de fiches CRM ou d'historique relationnel avant leur livraison. La catégorie CRM des réseaux externes représente des outils tiers, pas un second module CRM interne.

Le panneau droit est destiné à devenir une vue compacte du même Kanban que la page et le panneau Bento. À contexte local/compte identique, toutes les vues doivent montrer les mêmes cartes, étapes et libellés. Un nom de colonne personnalisé est une donnée utilisateur. Un nom de panneau Bento personnalisé est une préférence de présentation distincte : aucun renommage global ne doit l'écraser.

## Audit vérifié dans le code

| Source | Capacités à conserver | Limites actuelles |
| --- | --- | --- |
| `src/services/contextualTasksService.ts`, `src/stores/contextualTasks.ts` | ID, titre, note, tags, personnes, liens, URL nettoyée, réseau/profil, priorité, échéance, ordre, dates ; séparation invité/compte ; colonnes renommables | Étapes fixes todo/waiting/done ; personnes contenant seulement un nom ; libellés de colonnes stockés séparément et absents du snapshot des cartes |
| `src/services/kanbanService.ts`, `src/stores/kanban.ts` | Types task/note/email, description, date, labels, originalData, ordre ; archived/todo/waiting | Store différent de la page ; métadonnées originales non structurées ; pas de contacts réutilisables |
| `convex/schema.ts` | Snapshots contextualTasksJson et kanbanStateJson | Deux contrats de synchronisation indépendants |

La migration existante `migrateLegacyKanbanState()` ne s'exécute que si le stockage contextual existe encore vide/absent (en pratique absence de la clé). Elle sélectionne uniquement les anciennes cartes de type task avec URL exploitable, génère de nouveaux identifiants et transforme archived en done. Elle conserve le stockage original mais ne suffit pas pour une convergence exhaustive ou une migration rejouable. Notes, e-mails, cartes sans URL, dates et provenance doivent être repris explicitement.

## Modèle commun proposé

Enveloppe versionnée `KanbanState` : version du schéma, espace local ou compte, tableaux, colonnes, cartes et journal de migration. Les identifiants restent stables et distincts des noms affichés.

- Tableau : ID et nom utilisateur.
- Colonne : ID, tableau, nom utilisateur, ordre et catégorie sémantique facultative (à faire/en attente/terminé). Renommer la colonne ne modifie ni son ID ni ses cartes. Préserver les trois colonnes existantes ; création libre de colonnes à décider séparément.
- Carte : ID, tableau/colonne, type task/note/email, titre, note, tags, liens, URL/réseau/profil, priorité, échéance, dates et ordre. L'archivage est un état séparé (`archivedAt`) : archiver ne signifie pas terminer.
- Provenance : source et identifiant d'origine pour dédoublonnage, métadonnées anciennes conservées dans une sauvegarde locale versionnée. Ne jamais synchroniser automatiquement des payloads e-mail bruts, jetons ou métadonnées arbitraires ; définir une liste explicite de champs autorisés.
- Personnes : conserver les noms associés existants tels quels. Ne pas fusionner deux personnes parce qu'elles portent le même nom.
- Préférences UI : titre du panneau Bento séparé du nom du tableau et du nom des colonnes. Conserver les titres personnalisés existants.

Le store commun expose les mêmes commandes aux vues compacte, complète et Bento. Le stockage invité reste distinct, sans hydratation du compte ni écritures cloud. Le choix local mémorisé reste actif ; la copie vers un compte demeure explicite et conserve les originaux.

## Migration à implémenter après validation du contrat

1. Lire les deux sources et les libellés de colonnes dans leur espace autorisé. Produire un aperçu des quantités, collisions, éléments invalides et champs non transférables.
2. Sauvegarder les sources avec une version, sans suppression. Importer dans un nouvel espace temporaire ; conserver les IDs ou utiliser un ID déterministe fondé sur source + ID en cas de collision. Ne pas fusionner par titre.
3. Reprendre les cartes de tous types, y compris sans URL. Conserver séparément archivage et état terminé ; préserver les dates et l'ordre. Importer les libellés utilisateur, jamais les remplacer par les valeurs par défaut.
4. Valider les comptes et relations source/destination, puis publier le nouvel état atomiquement. En cas d'échec ou de quota dépassé, garder la source opérationnelle.
5. Rendre la migration idempotente et reprenable. Réconcilier aussi les cartes déjà importées par l'ancien migrateur : faute de provenance certaine, signaler un doublon potentiel plutôt que supprimer ou fusionner automatiquement.
6. Basculer les vues ensemble et supprimer les doubles écritures seulement après preuve. Le protocole cloud doit gérer versions, conflits et suppressions, et prévenir la réintroduction des anciennes données par un autre appareil. Prévoir retour arrière et compatibilité avant toute bascule hébergée.

## CRM : proposition à valider

Mise à jour 2026-09-07 : première tranche approuvée explicitement (« parfait validé ») : contacts réutilisables, cartes associées, notes de suivi et prochaine relance. Pas d'organisations, d'opportunités commerciales, d'envoi automatique ni d'historique automatique dans cette tranche.

Première tranche proposée : contacts réutilisables avec liens vers leurs profils, cartes liées à ces contacts, notes de suivi et prochaine relance. Cela demande des IDs de contacts stables et une relation plusieurs-à-plusieurs entre cartes et contacts. Ne pas transformer automatiquement chaque nom historique en contact global.

À décider avant implémentation : contacts seulement ou organisations aussi ; historique manuel ou automatique des interactions ; simple suivi relationnel ou opportunités commerciales avec montants et étapes. Aucun scraping, lecture automatique des réseaux, envoi de message ou relance automatique n'est inclus.

## Preuves requises

- Rendu FR/EN : même nom Kanban pour navigation, page, nouveaux onglets et raccourci ; tâche reste un contenu.
- Renommer les colonnes, recharger et retrouver leurs noms ; conserver les titres personnalisés des panneaux.
- Fixtures de migration couvrant les deux sources simultanées, tous les types, absence d'URL, IDs en collision, payload invalide, ordre, archivage, noms personnalisés et rejouabilité ; interruption/échec sans perte.
- Parité des vues et isolation invité/compte, changement de compte, copie explicite et conservation des originaux.
- Navigation clavier et repli ; preuve cloud authentifiée multiappareil séparée des tests locaux.

## État de la tranche

Libellés harmonisés en FR/EN et nouveaux panneaux nommés Kanban. Identifiants internes, routes, stockage et noms utilisateur conservés. Les deux stores restent distincts jusqu'à l'implémentation de la convergence. Le modèle décrit ci-dessus est une conception, pas une fonctionnalité livrée.

Vérification locale : navigation et titre Kanban rendus dans le navigateur ; colonne renommée « À relancer », nom retrouvé après rechargement, puis nom initial restauré. Tests : 10 passent, 1 test Bento hors renommage échoue parce qu'il attend encore « Scènes enregistrées » alors que le composant affiche déjà « Bentos enregistrés ». Aucun test de migration du nouveau modèle ni preuve CRM/cloud revendiqués.

## Livraison CRM — 2026-09-07

Contacts disponibles dans le volet Contacts de la page Kanban : création/modification, recherche, lien HTTPS de profil, note de suivi et prochaine date de relance. Les cartes existantes peuvent être modifiées et associées à plusieurs contacts ; un filtre retrouve les cartes d'un contact. Le changement de nom du contact est reflété sur les cartes. Les anciennes personnes en texte libre sont préservées, sans fusion automatique.

Exécution séparée : agent données pour services/stores, snapshot cloud, Convex et tests ; intégrateur pour Vue, traductions, sauvegardes et rendu. Les contrats sont additifs : contactIds optionnel sur les cartes, stockage contacts invité distinct du compte, mutation authentifiée dédiée. Copie locale vers compte par ID sans suppression des originaux ni écrasement des contacts du compte. Sauvegarde portable complétée pour contacts, cartes invité, libellés de colonnes et choix local.

Preuves : création, association, rechargement, modification de contact, recherche sans résultat, filtre des cartes, lien non HTTPS rejeté avec saisie conservée ; clavier (entrée dans formulaire et retour après annulation). Rendu desktop 1440×1000 et mobile 420×850 sans débordement horizontal. 28 tests de données exécutés par l'agent ; dernier lot de 17 tests (contacts, cartes locales, sauvegarde et mutations Convex) passe. ESLint des quatre composants Vue modifiés passe. Typecheck global garde des diagnostics préexistants, sans diagnostic trouvé dans les composants CRM ni leur couche de données.

Limites : aucun déploiement Convex ni preuve de synchronisation authentifiée multiappareil. Les nouvelles mutations doivent être déployées avant de revendiquer la synchronisation hébergée des contacts. Le widget historique du panneau droit conserve encore son ancien store ; convergence et migration exhaustive des deux Kanban restent une tranche distincte à réaliser. Aucun commit ni push dans ce lot de travail déjà largement modifié.
