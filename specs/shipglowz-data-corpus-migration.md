---
artifact: specification
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "socialglowz"
created_at: "2026-07-25T19:47:00Z"
updated_at: "2026-07-25T19:47:00Z"
status: draft
source_skill: "100-sg-spec"
source_model: "unknown"
scope: "governance-corpus-migration"
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
linked_systems:
  - "README.md"
  - "AGENT.md"
  - "AGENTS.md"
  - "shipflow_data/"
  - "site/shipflow_data/"
  - "docs/"
  - "archive/"
  - "specs/"
  - "/home/claude/shipglowz/tools/audit_project_governance_topology.py"
  - "/home/claude/shipglowz/tools/shipglowz_metadata_lint.py"
depends_on: []
supersedes: []
evidence:
  - "Audit local 2026-07-25: governance topology reported `migration-required` and `shipglowz_data/ missing at project root`."
  - "Root docs currently point at `shipflow_data/` while the canonical-path policy expects a single `shipglowz_data/` corpus at the monorepo root."
  - "A nested `site/shipflow_data/` corpus also exists and duplicates active governance content."
next_step: "review spec with operator before implementation"
---

# Migrate the governance corpus to a single canonical `shipglowz_data/` root

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-07-25 | 100-sg-spec | unknown | created | draft | review spec with operator before implementation |

## Current Chantier Flow

- `100-sg-spec`: completed for draft creation
- `101-sg-ready`: pending
- `102-sg-start`: pending
- `103-sg-verify`: pending
- `104-sg-end`: pending
- `005-sg-ship`: pending
- Prochaine commande: review de la spec, puis readiness si le périmètre est accepté

## Title

Migrate the governance corpus to a single canonical `shipglowz_data/` root

## User Story

En tant que mainteneur du repo, je veux une seule source canonique de gouvernance et de documentation au niveau racine, afin qu'un agent frais puisse trouver sans ambiguïté les contrats techniques, éditoriaux, business et workflow sans parcourir plusieurs corpus qui divergent.

## Problem

Le repo expose encore plusieurs surfaces qui décrivent la même vérité avec des chemins différents: `shipflow_data/` à la racine, un second corpus `site/shipflow_data/`, et des trackers ou docs hérités au root (`TASKS.md`, `AUDIT_LOG.md`, `TEST_LOG.md`, `docs/`, `archive/`, `specs/`). Cette dispersion crée un risque réel de drift, de doublons et de fausse source de vérité pour les agents comme pour les mainteneurs.

## Solution Summary

Créer et utiliser un seul corpus canonique `shipglowz_data/` à la racine du repo pour les documents de gouvernance actifs, puis traiter les emplacements actuels `shipflow_data/`, `site/shipflow_data/`, `docs/`, `archive/`, `TASKS.md`, `AUDIT_LOG.md` et `TEST_LOG.md` comme surfaces de migration, de compatibilité ou d'historique, jamais comme source canonique concurrente.

## Scope In

- Créer la structure canonique `shipglowz_data/` à la racine.
- Migrer les docs actifs de `shipflow_data/` vers `shipglowz_data/` en conservant le contenu utile et les métadonnées.
- Résoudre le doublon `site/shipflow_data/` en le supprimant, en le fusionnant ou en le documentant explicitement comme exception durable si une vraie séparation de projet existe.
- Réécrire les liens racine et les contrats de repo pour pointer vers le corpus canonique.
- Déplacer ou reclasser les trackers et archives hérités vers les emplacements canoniques de workflow ou d'archives.

## Scope Out

- Aucun changement de comportement produit.
- Aucun changement de code runtime, build, auth ou sync.
- Aucun nettoyage destructif d'archives historiques sans preuve de migration ou d'exception.
- Aucune refonte du contenu marketing au-delà des liens et chemins nécessaires à la cohérence documentaire.

## Minimal Behavior Contract

Le repo doit exposer une seule vérité documentaire active sous `shipglowz_data/` à la racine, avec des références cohérentes depuis les fichiers d'entrée et les docs de haut niveau. Les surfaces héritées peuvent rester temporairement visibles comme compatibilité ou historique, mais elles ne doivent plus pouvoir diverger silencieusement ni concurrencer le corpus canonique. Si une migration échoue, le résultat acceptable est une coexistence temporaire explicite, jamais une perte de contenu ou un état où un agent ne sait plus quelle source croire.

## Success Behavior

- Le corpus actif vit sous `shipglowz_data/` à la racine.
- Les docs d'entrée et de vue d'ensemble pointent explicitement vers ce corpus.
- Les anciens chemins sont soit supprimés, soit marqués comme legacy avec une fonction de compatibilité claire.
- Le doublon `site/shipflow_data/` ne contient plus une seconde vérité concurrente.
- Les références résiduelles à `shipflow_data/` sont limitées aux mentions legacy ou aux points de migration explicitement documentés.
- Les validations de topologie et de métadonnées passent sans ambiguïté sur le corpus canonique.

## Error Behavior

- Si une copie canonique manque, la migration ne peut pas être considérée comme terminée.
- Si un chemin legacy reste actif sans raison documentée, il est traité comme dette de migration, pas comme état stable.
- Si un fichier de référence casse un lien relatif ou devient introuvable après migration, la correction du lien a priorité sur la clôture.
- Si `site/shipflow_data/` doit rester, le repo doit contenir une exception durable explicite qui explique pourquoi il existe encore et quelle vérité il représente.
- Aucune suppression ne doit faire perdre une preuve historique utile sans l’avoir d’abord reclassée sous une zone d’archives canonique.

## Critères d'acceptation

- [ ] CA 1 : Given le repo courant, when on inspecte les surfaces de gouvernance, then `shipglowz_data/` existe à la racine et porte les docs actifs attendus.
- [ ] CA 2 : Given les docs d'entrée du repo, when on les lit, then ils renvoient au corpus canonique sans ambiguïté de source de vérité.
- [ ] CA 3 : Given le corpus `site/shipflow_data/`, when on évalue sa nécessité, then il est supprimé, fusionné ou documenté comme exception durable avec une justification explicite.
- [ ] CA 4 : Given les anciens trackers et docs hérités, when on les relie au corpus canonique, then ils ne concurrencent plus `shipglowz_data/` comme source de vérité.
- [ ] CA 5 : Given une recherche des références de corpus, when on scanne le repo, then les références actives pointent vers `shipglowz_data/` et les mentions `shipflow_data/` restantes sont uniquement legacy ou de migration.
- [ ] CA 6 : Given la topologie de gouvernance, when on lance l'audit ShipGlowz, then le résultat n'indique plus de migration required pour l'absence du corpus canonique.

## Tasks

- [ ] Tâche 1 : Créer le corpus canonique racine
  - Fichier : `shipglowz_data/technical/`, `shipglowz_data/business/`, `shipglowz_data/editorial/`, `shipglowz_data/workflow/`
  - Action : créer la structure canonique et y déplacer les docs actifs depuis `shipflow_data/` en conservant les frontmatter, les liens et le contenu utile
  - User story link : fournir une source de vérité unique
  - Depends on : aucun
  - Validate with : audit de topologie + lint de métadonnées
  - Notes : conserver les historiques utiles, mais séparer clairement les docs actifs des sources legacy

- [ ] Tâche 2 : Réécrire les points d'entrée du repo
  - Fichier : `README.md`, `AGENT.md`, `AGENTS.md`, `docs/repo-architecture-audit.md`
  - Action : remplacer les références implicites ou explicites au corpus legacy par le corpus canonique et préciser le statut legacy si nécessaire
  - User story link : éviter que les premiers fichiers lus fassent croire à une autre source de vérité
  - Depends on : tâche 1
  - Validate with : lecture ciblée + recherche de chemins
  - Notes : garder la compatibilité visuelle et éviter les promesses contradictoires

- [ ] Tâche 3 : Traiter le doublon `site/shipflow_data/`
  - Fichier : `site/shipflow_data/**`
  - Action : supprimer ou fusionner le corpus dupliqué, ou écrire une exception durable si le dossier représente un projet réellement autonome
  - User story link : empêcher le drift entre deux corpus qui racontent la même chose
  - Depends on : tâche 1
  - Validate with : recherche de références et vérification de l'exception écrite, si elle existe
  - Notes : aucune vérité documentaire active ne doit rester en double

- [ ] Tâche 4 : Reclasser les trackers et archives hérités
  - Fichier : `TASKS.md`, `AUDIT_LOG.md`, `TEST_LOG.md`, `docs/**`, `archive/**`, `specs/**`
  - Action : déplacer, regrouper ou marquer ces surfaces comme migration/historique selon la politique canonique, sans perdre les preuves utiles
  - User story link : rendre le chemin de la documentation et du suivi prévisible pour un agent frais
  - Depends on : tâches 1 et 2
  - Validate with : audit de topologie + inspection des liens restants
  - Notes : préserver l'historique utile sous une structure d'archives canonique plutôt que dans des racines ambiguës

- [ ] Tâche 5 : Vérifier la conformité du corpus
  - Fichier : aucun nouveau fichier, validation repo-wide
  - Action : lancer les audits et corriger les liens ou métadonnées qui restent incohérents
  - User story link : prouver qu'il n'existe plus de drift caché
  - Depends on : tâches 1 à 4
  - Validate with : audit de topologie, lint de métadonnées, recherche des anciens chemins
  - Notes : la validation doit distinguer les mentions legacy acceptées des références actives interdites

## Dépendances

- Outils internes ShipGlowz d'audit de topologie
- Linter de métadonnées ShipGlowz
- Existence des docs et trackers à migrer

## Links & Consequences

Systèmes et surfaces touchés:

- `README.md`
- `AGENT.md`
- `AGENTS.md`
- `shipflow_data/technical/*`
- `shipflow_data/business/*`
- `shipflow_data/editorial/*`
- `shipflow_data/workflow/*`
- `site/shipflow_data/*`
- `docs/*`
- `archive/*`
- `specs/*`

Conséquences attendues:

- une seule source de vérité documentaire active
- moins de confusion pour les agents qui localisent les contrats du repo
- moins de risques de drift entre docs racine et docs de site
- meilleure lisibilité des audits et des migrations futures

## Risques

- casse de liens relatifs pendant la migration
- divergence temporaire entre ancien et nouveau corpus si la migration est incomplète
- perte accidentelle d'un historique utile s'il n'est pas reclassé avant suppression
- fausse impression de conformité si le dossier canonique est créé mais pas réellement relié aux points d'entrée du repo

## Documentation Coherence

- `README.md` doit refléter le corpus canonique.
- `AGENT.md` et `AGENTS.md` doivent pointer vers les chemins canoniques.
- `docs/repo-architecture-audit.md` doit être réconcilié avec l'état final de migration.
- Les docs du corpus migré doivent conserver leurs liens internes et leurs références de validation.
- `None` n'est pas acceptable ici, because the change is itself a documentation-governance migration.

## Execution Notes

Fichiers à lire d'abord:

1. `README.md`
2. `AGENT.md`
3. `shipflow_data/technical/context.md`
4. `shipflow_data/technical/context-function-tree.md`
5. `docs/repo-architecture-audit.md`

Approche:

1. créer le corpus canonique et figer sa forme cible avant de déplacer les contenus
2. migrer les docs actifs, pas les archives historiques brutes
3. réécrire les points d'entrée et les références de haut niveau
4. résoudre le doublon `site/shipflow_data/`
5. exécuter les validations et corriger les derniers chemins restants

Contraintes:

- ne pas toucher au code runtime
- ne pas détruire d'archives utiles sans reclassification
- ne pas laisser deux corpus actifs raconter la même vérité
- ne pas clôturer tant que les références actives ne pointent pas toutes vers le corpus canonique

Commandes de validation:

```bash
python3 /home/claude/shipglowz/tools/audit_project_governance_topology.py .
python3 /home/claude/shipglowz/tools/shipglowz_metadata_lint.py specs/shipglowz-data-corpus-migration.md
rg -n "shipflow_data/|site/shipflow_data/" README.md AGENT.md AGENTS.md docs shipglowz_data site/shipflow_data specs
```

Stop conditions:

- le corpus canonique ne peut pas être créé sans casser des liens non réécrits
- `site/shipflow_data/` doit rester, mais aucune exception durable n'a été documentée
- une surface legacy contient encore une vérité active concurrente après la migration

## Fresh External Docs

fresh-docs not needed

