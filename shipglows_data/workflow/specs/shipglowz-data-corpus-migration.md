---
artifact: specification
metadata_schema_version: "1.0"
artifact_version: "1.1.1"
project: "socialglowz"
created: "2026-07-25"
updated: "2026-08-03"
created_at: "2026-07-25T19:47:00Z"
updated_at: "2026-08-03T21:07:25Z"
status: reviewed
source_skill: "104-sg-end"
source_model: "GPT-5"
scope: "governance-corpus-migration"
owner: "Diane"
confidence: high
risk_level: medium
security_impact: none
docs_impact: yes
linked_systems:
  - "README.md"
  - "AGENT.md"
  - "AGENTS.md"
  - "shipglows_data/"
  - "shipglows_data/workflow/archives/pre-canonical-migration/PRESERVATION_LEDGER.md"
  - "/home/claude/shipglows/tools/audit_project_governance_topology.py"
  - "/home/claude/shipglows/tools/shipglows_metadata_lint.py"
depends_on:
  - artifact: "/home/claude/shipglows/skills/references/canonical-paths.md"
    artifact_version: "1.8.0"
    required_status: active
  - artifact: "shipglows_data/technical/guidelines.md"
    artifact_version: "1.1.0"
    required_status: reviewed
supersedes: []
evidence:
  - "Governance topology audit on 2026-08-03 reports migration-required because shipglows_data/ is missing and identifies root trackers, docs, archive, and specs as migration sources."
  - "The active root shipflow_data/ corpus contains 70 governed files across business, editorial, technical, and workflow families."
  - "site/shipflow_data/ contains nine files; all nine differ from their root shipflow_data/ counterparts and require preservation before consolidation."
  - "AGENTS.md is a compatibility symlink to AGENT.md, as required by canonical-path policy."
  - "103-sg-verify excellence passed: compliant topology, 75/75 metadata files valid, nine archived site files SHA-256 identical to HEAD, no runtime changes, and clean diff checks."
next_step: "/005-sg-ship Migrate the governance corpus to a single canonical shipglows_data root"
---

# Migrate the governance corpus to a single canonical `shipglows_data/` root

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-07-25 | 100-sg-spec | unknown | created | draft | review spec with operator before implementation |
| 2026-08-03 | 101-sg-ready | GPT-5 | reviewed against current repository topology and completed execution contracts | ready | execute with 102-sg-start |
| 2026-08-03 | 102-sg-start | GPT-5 | migrated the corpus, trackers, nested site variants, root docs and archives | implemented | verify with 103-sg-verify |
| 2026-08-03 | 103-sg-verify | GPT-5 | mode=excellence; independently verified every acceptance criterion and repaired two bounded stale legacy references | excellent | close with 104-sg-end |
| 2026-08-03 | 104-sg-end | GPT-5 | closed the documentation migration and recorded the release note | completed | ship when the operator wants the local changes committed |

## Current Chantier Flow

- `100-sg-spec`: completed
- `101-sg-ready`: ready
- `102-sg-start`: completed
- `103-sg-verify`: excellent
- `104-sg-end`: completed
- `005-sg-ship`: pending
- Prochaine commande: `/005-sg-ship Migrate the governance corpus to a single canonical shipglows_data root`

## Title

Migrate the governance corpus to a single canonical `shipglows_data/` root

## Status

Completed and independently verified at excellence level. The active corpus lives under `shipglows_data/`; legacy sources are preserved or merged according to the ledger.

## User Story

En tant que mainteneur du repo, je veux une seule source canonique de gouvernance et de documentation au niveau racine, afin qu'un agent frais puisse trouver sans ambiguite les contrats techniques, editoriaux, business et workflow sans parcourir plusieurs corpus divergents.

## Problem

Le repo expose plusieurs surfaces documentaires concurrentes: `shipflow_data/` a la racine, un corpus divergent de neuf fichiers sous `site/shipflow_data/`, et des trackers ou docs herites au root (`TASKS.md`, `AUDIT_LOG.md`, `TEST_LOG.md`, `docs/`, `archive/`, `specs/`). L'audit de topologie du 2026-08-03 confirme que `shipglows_data/` manque et classe ces surfaces root comme sources de migration. Cette dispersion cree un risque de drift, de doublons et de fausse source de verite.

## Solution

Promouvoir le corpus actif racine `shipflow_data/` vers `shipglows_data/`, sauvegarder le corpus divergent `site/shipflow_data/` sous les archives canoniques avant toute consolidation, reclasser chaque surface documentaire root dans sa famille canonique, fusionner les trackers sans perte, puis reecrire les references actives et prouver la conformite avec les outils ShipGlows.

## Scope In

- Creer les familles canoniques `shipglows_data/business/`, `editorial/`, `technical/` et `workflow/` a la racine.
- Deplacer le corpus actif de `shipflow_data/` vers la structure canonique en conservant son historique Git, son contenu et ses metadonnees.
- Preserver les neuf fichiers divergents de `site/shipflow_data/` sous `shipglows_data/workflow/archives/pre-canonical-migration/site-shipflow_data/`, puis integrer uniquement les informations encore utiles qui ne contredisent pas les sources actives.
- Fusionner les lignes uniques de `TASKS.md`, `AUDIT_LOG.md` et `TEST_LOG.md` dans leurs trackers canoniques, sans doublon ni perte de date, identifiant ou preuve.
- Reclasser `docs/`, `archive/` et `specs/` selon la table de destination des Execution Notes.
- Reecrire toutes les references actives vers `shipglows_data/` et conserver `AGENTS.md` comme symlink vers `AGENT.md`.
- Verifier la topologie, les metadonnees, les liens, le statut Git et l'absence de references legacy actives.

## Scope Out

- Aucun changement de comportement produit, de code runtime, de build, d'authentification ou de synchronisation.
- Aucune reecriture editoriale, marketing ou architecturale autre que la reconciliation strictement necessaire pour eviter une perte lors de la fusion.
- Aucune suppression d'historique: tout contenu divergent ou inactif est preserve sous une archive canonique avant retrait de son ancien emplacement.
- Aucun nettoyage des sorties generees telles que `node_modules/`.
- Aucun commit ni revert des changements applicatifs deja presents dans le worktree.

## Constraints

- Preserver tous les changements non commites preexistants; ne jamais restaurer ni ecraser un fichier modifie par un autre chantier.
- Utiliser des deplacements suivis par Git quand le fichier source est tracke.
- Traiter le corpus racine `shipflow_data/` comme base active, conformement aux points d'entree actuels du repo; le corpus `site/shipflow_data/` est une source divergente a archiver et comparer, pas une base a substituer aveuglement.
- Ne supprimer un ancien emplacement qu'apres verification de sa copie ou de sa fusion canonique.
- Ne pas modifier le code runtime ni les configurations de build, sauf une reference documentaire pure si un fichier de configuration en contient une.
- Conserver les noms de marque historiques dans les snapshots archives.
- Maintenir `AGENTS.md -> AGENT.md`.

## Dependencies

- Politique canonique ShipGlows `canonical-paths.md` version `1.8.0`.
- Corpus et trackers presents dans le worktree au moment de l'execution.
- Outils locaux `audit_project_governance_topology.py` et `shipglows_metadata_lint.py`.
- Git pour distinguer deplacements, modifications preexistantes et contenu non tracke.

## Invariants

- Une seule source documentaire active existe apres migration: le `shipglows_data/` racine.
- Aucun fichier ni enregistrement unique n'est perdu lors de la fusion.
- Les archives restent historiques et ne deviennent pas des sources actives.
- Les points d'entree du repo et les dependances metadata resolvent vers des chemins existants.
- Les changements applicatifs Windows, Android, extension ou backend deja presents restent byte-for-byte hors de ce chantier.
- Le symlink `AGENTS.md` continue de cibler `AGENT.md`.

## Minimal Behavior Contract

Quand le mainteneur lance la migration sur le repo actuel, chaque document actif, tracker et preuve historique est soit deplace vers une destination canonique explicite, soit preserve dans une archive canonique avant retrait de son ancien chemin. Le resultat expose `shipglows_data/` comme unique source active et les points d'entree la referencent. En cas de conflit, de fichier modifie concurremment ou de destination ambigue, l'execution s'arrete sans supprimer la source et rapporte le fichier concerne.

## Success Behavior

- `shipglows_data/` contient les familles actives attendues et tous les documents actifs auparavant sous `shipflow_data/`.
- Les neuf fichiers divergents de `site/shipflow_data/` ont une copie d'archive canonique verifiable avant le retrait de l'ancien corpus.
- Les trackers canoniques contiennent chaque entree unique des trackers root et de l'ancien corpus.
- Les points d'entree et metadonnees actives ne referencent plus les anciens chemins.
- L'audit de topologie ne retourne plus `migration-required`.
- Le lint metadata passe sur les documents actifs deplaces ou modifies.

## Error Behavior

- Une collision non equivalente conserve les deux versions sous des chemins bornes et bloque la suppression de la source tant que la reconciliation n'est pas prouvee.
- Un lien casse, une dependance metadata introuvable ou une reference legacy active bloque la cloture.
- Un changement concurrent dans un fichier cible arrete le traitement de ce fichier sans revert.
- Un echec d'audit ou de lint laisse le chantier ouvert avec la commande et les chemins fautifs rapportes.
- Une archive ne peut etre retiree de son emplacement legacy que lorsque son inventaire et sa destination canonique correspondent.

## Edge Cases

- `site/shipflow_data/` contient des versions plus anciennes, plus recentes ou simplement differentes: archiver les neuf fichiers tels quels, comparer ensuite, et ne fusionner que les informations encore valides.
- Un tracker root contient une entree deja presente sous une formulation differente: dedupliquer par identifiant lorsqu'il existe, sinon par date, sujet et preuve; conserver les deux si l'equivalence n'est pas certaine.
- La spec courante se deplace pendant son propre chantier: la deplacer vers `shipglows_data/workflow/specs/shipglowz-data-corpus-migration.md` apres creation de la famille workflow, puis poursuivre la trace a ce chemin.
- Une mention de `shipflow_data/` est historique: elle peut rester uniquement dans une archive ou une preuve explicitement qualifiee de legacy, jamais dans une instruction active ou un lien attendu resolvable.
- Un lien relatif change de profondeur apres deplacement: le recalculer et verifier sa cible, sans conversion automatique aveugle.
- Le worktree contient des changements non lies: limiter le diff aux documents gouvernes et ne pas les inclure dans une eventuelle livraison.

## Implementation Tasks

- [x] Tache 1 - Inventorier et figer la preservation
  - Fichiers: `shipflow_data/**`, `site/shipflow_data/**`, `TASKS.md`, `AUDIT_LOG.md`, `TEST_LOG.md`, `docs/**`, `archive/**`, `specs/**`
  - Action: enregistrer les listes, statuts Git et sommes de controle utiles; identifier les modifications preexistantes avant tout deplacement
  - Depends on: aucune
  - Validate with: inventaires source/destination comparables et `git status --short`

- [x] Tache 2 - Promouvoir le corpus actif
  - Fichiers: `shipflow_data/**` vers `shipglows_data/**`
  - Action: deplacer les quatre familles actives avec historique Git, puis corriger leurs liens internes et dependances metadata
  - Depends on: tache 1
  - Validate with: comparaison du nombre de fichiers, verification des chemins metadata et lint cible

- [x] Tache 3 - Preserver et resoudre le corpus `site`
  - Fichiers: `site/shipflow_data/**`
  - Action: copier les neuf versions divergentes vers `shipglows_data/workflow/archives/pre-canonical-migration/site-shipflow_data/`, comparer leur contenu au corpus actif, reporter les informations valides absentes, puis retirer l'ancien corpus `site` uniquement apres preuve de preservation
  - Depends on: taches 1 et 2
  - Validate with: inventaire et sommes de controle des neuf sources archivees, puis absence de corpus actif imbrique

- [x] Tache 4 - Reclasser les surfaces root
  - Fichiers: `TASKS.md`, `AUDIT_LOG.md`, `TEST_LOG.md`, `docs/**`, `archive/**`, `specs/**`
  - Action: appliquer la table de destination, fusionner les trackers et deplacer cette spec vers le corpus canonique
  - Depends on: taches 1 et 2
  - Validate with: contenu unique preserve, anciens emplacements absents et destinations presentes

- [x] Tache 5 - Reecrire les consommateurs
  - Fichiers: `README.md`, `AGENT.md`, `AGENTS.md` via sa cible, documents et metadonnees repo-wide contenant des chemins legacy
  - Action: remplacer les references actives, ajuster les liens relatifs et conserver uniquement les mentions historiques explicitement qualifiees
  - Depends on: taches 2 a 4
  - Validate with: recherche repo-wide des anciens chemins et verification des cibles

- [x] Tache 6 - Prouver la conformite
  - Fichiers: repo documentaire complet
  - Action: executer l'audit de topologie, le lint metadata, les controles de liens et le diff final limite au chantier
  - Depends on: taches 1 a 5
  - Validate with: toutes les commandes du Test Strategy passent

## Acceptance Criteria

- [x] AC 1: `shipglows_data/` existe a la racine et contient les familles business, editorial, technical et workflow actives.
- [x] AC 2: chaque fichier actif initialement sous `shipflow_data/` existe sous sa destination canonique et l'ancien corpus actif n'existe plus.
- [x] AC 3: les neuf fichiers divergents de `site/shipflow_data/` sont preserves byte-for-byte dans l'archive canonique avant retrait de l'ancien dossier.
- [x] AC 4: les entrees uniques de `TASKS.md`, `AUDIT_LOG.md` et `TEST_LOG.md` sont presentes dans les trackers canoniques sans perte de preuve.
- [x] AC 5: les surfaces `docs/`, `archive/` et `specs/` sont reclassees selon la table de destination et ne restent pas des racines gouvernantes concurrentes.
- [x] AC 6: `README.md`, `AGENT.md` et les documents actifs pointent vers des chemins canoniques existants; `AGENTS.md` reste un symlink vers `AGENT.md`.
- [x] AC 7: toute mention legacy restante se trouve dans une archive ou une preuve explicitement historique, pas dans une instruction active.
- [x] AC 8: l'audit de topologie ne rapporte plus `migration-required` et le lint metadata ne rapporte aucune erreur sur le corpus actif touche.
- [x] AC 9: le diff final ne contient aucun changement runtime et preserve les modifications non liees deja presentes.
- [x] AC 10: une collision, une perte potentielle ou un changement concurrent produit un arret explicite sans suppression de la source.

## Test Contract

- `surface`: corpus documentaire et gouvernance locale du repo
- `proof_profile`: static-governance-migration
- `proof_order`: inventaire avant migration, preservation, liens, metadata, topologie, diff final
- `checklist_path`: not applicable; les controles executables sont portes par cette spec
- `required_scenario_ids`: GOV-MIG-01, GOV-MIG-02, GOV-MIG-03, GOV-MIG-04, GOV-MIG-05
- `required_results`: toutes les validations automatiques passent et les inventaires prouvent la non-perte
- `exception_with_proof`: les mentions legacy sont permises dans les archives avec leur contexte historique et une recherche ciblee qui les distingue des references actives
- `exception_without_proof`: aucune

Scenarios requis:

- `GOV-MIG-01`: promotion complete du corpus racine et resolution de tous ses liens actifs.
- `GOV-MIG-02`: preservation byte-for-byte des neuf fichiers divergents du corpus `site`.
- `GOV-MIG-03`: fusion sans perte des trois trackers root.
- `GOV-MIG-04`: reclassement de chaque fichier sous `docs/`, `archive/` et `specs/` vers la destination declaree.
- `GOV-MIG-05`: echec sur collision simule par inspection du diff ou changement concurrent, avec source conservee et aucune modification runtime.

## Test Strategy

1. Avant les mouvements, capturer `git status --short`, les inventaires de fichiers et les sommes de controle de `site/shipflow_data/` et `archive/`.
2. Apres les mouvements, comparer les inventaires et sommes de controle aux destinations canoniques.
3. Verifier les liens et references actives avec `rg`, en excluant uniquement les archives canoniques explicitement historiques.
4. Lancer le lint metadata sur les Markdown actifs crees, deplaces ou modifies.
5. Lancer l'audit de topologie jusqu'a un resultat conforme.
6. Verifier le symlink `AGENTS.md`, les destinations de trackers et le diff final; aucun test runtime n'est requis car le scope interdit tout changement runtime.

Commandes minimales:

```bash
python3 /home/claude/shipglows/tools/audit_project_governance_topology.py .
python3 /home/claude/shipglows/tools/shipglows_metadata_lint.py shipglows_data
rg -n "shipflow_data/|site/shipflow_data/" README.md AGENT.md shipglows_data --glob '!shipglows_data/workflow/archives/**'
test -L AGENTS.md && test "$(readlink AGENTS.md)" = "AGENT.md"
git status --short
git diff --check
```

## Verification Evidence

Passage independant `103-sg-verify`, `mode=excellence`, execute le 2026-08-03:

- Topologie: `audit_project_governance_topology.py .` retourne `Governance topology: compliant`.
- Metadonnees: `shipglows_metadata_lint.py shipglows_data` valide 75 fichiers sans erreur.
- Anciennes racines: `shipflow_data`, `site/shipflow_data`, `docs`, `specs`, `archive`, `TASKS.md`, `AUDIT_LOG.md` et `TEST_LOG.md` sont absents.
- References actives: aucune reference `shipflow_data/` ne subsiste hors archives et contexte historique explicite de cette spec; les pointeurs legacy bornes trouves dans le contrat agent, le changelog et deux specs actives ont ete corriges.
- Symlink: `AGENTS.md` est un lien symbolique vers `AGENT.md`.
- Preservation: les SHA-256 des neuf fichiers archives sous `pre-canonical-migration/site-shipflow_data/` correspondent byte-for-byte aux neuf chemins `site/shipflow_data/` de `HEAD`.
- Trackers: les deux identifiants uniques du `TASKS.md` root, l'audit `dependency hygiene` et le test `CinderReels Android Session Isolation` sont presents dans les trackers canoniques.
- Runtime: le diff ne contient aucun chemin hors surfaces documentaires et de gouvernance autorisees par cette migration.
- Integrite Git: `git diff --check` passe.
- Fresh docs: not needed; la verification depend uniquement des contrats locaux et des outils ShipGlows installes.

Verdict: `excellent`. Les dix acceptance criteria sont prouves et aucun ecart d'excellence materiel ne reste dans le perimetre de migration.

## Links & Consequences

Surfaces amont:

- politique canonique ShipGlows et outils de validation locaux
- corpus actif `shipflow_data/**`
- corpus divergent `site/shipflow_data/**`
- trackers et racines documentaires legacy

Consommateurs aval:

- agents lisant `README.md`, `AGENT.md` et `AGENTS.md`
- skills resolvant les specs, audits, preuves et contrats techniques
- mainteneurs consultant les trackers et archives

Cross-validations:

- les chemins declares dans le frontmatter doivent exister apres migration
- les docs techniques et le function tree doivent rester coherents avec `README.md`
- les trackers fusionnes doivent conserver leurs identifiants, dates et pointeurs de preuve
- le diff documentaire ne doit pas modifier les surfaces applicatives

## Documentation Coherence

- `README.md`, `AGENT.md` et tous les frontmatter actifs doivent pointer vers `shipglows_data/`.
- Les docs du corpus migre conservent leurs liens internes apres recalcul de chemin.
- `docs/repo-architecture-audit.md` devient un document technique canonique, pas une racine concurrente.
- Cette spec poursuit son historique sous `shipglows_data/workflow/specs/shipglowz-data-corpus-migration.md` une fois deplacee.
- Les snapshots historiques conservent leurs noms et contenus legacy sous `shipglows_data/workflow/archives/`.

## Risks

- Risque eleve de perte silencieuse si les neuf fichiers divergents du corpus `site` sont traites comme des doublons exacts; mitigation: archive byte-for-byte et sommes de controle avant retrait.
- Risque de liens relatifs casses pendant les deplacements; mitigation: recherche des chemins, verification des cibles et lint metadata avant cloture.
- Risque de doublons ou d'ecrasement dans les trackers; mitigation: fusion par identifiant ou tuple date/sujet/preuve et conservation en cas de doute.
- Risque de conflit avec le worktree applicatif deja modifie; mitigation: inventaire Git initial, scope documentaire strict et arret sur changement concurrent.
- Risque que les mentions historiques fassent echouer un controle trop large; mitigation: exclusion bornee aux archives canoniques, jamais aux docs actives.

## Security Review

Security impact: none, because this chantier deplace uniquement des documents locaux et ne change ni runtime, ni permissions, ni secrets, ni flux de donnees. Les commandes de validation ne doivent toutefois pas copier de variables d'environnement, credentials ou journaux runtime dans le corpus; si un document source en contient, l'execution s'arrete pour revue au lieu de le dupliquer.

## Execution Notes

Ordre de lecture:

1. `README.md` et `AGENT.md`
2. `shipflow_data/technical/context.md` et `context-function-tree.md`
3. `shipflow_data/technical/guidelines.md`
4. trackers root et `shipflow_data/workflow/`
5. chaque paire divergente entre `shipflow_data/` et `site/shipflow_data/`
6. `docs/`, `archive/` et `specs/`

Table de destination:

| Source | Destination canonique |
|--------|------------------------|
| `shipflow_data/{business,editorial,technical,workflow}/**` | `shipglows_data/{business,editorial,technical,workflow}/**` |
| `site/shipflow_data/**` | snapshot sous `shipglows_data/workflow/archives/pre-canonical-migration/site-shipflow_data/**`, puis fusion selective dans le corpus actif |
| `TASKS.md` | fusion dans `shipglows_data/workflow/TASKS.md` |
| `AUDIT_LOG.md` | fusion dans `shipglows_data/workflow/AUDIT_LOG.md` |
| `TEST_LOG.md` | fusion dans `shipglows_data/workflow/TEST_LOG.md` |
| `docs/PITCH.md` | `shipglows_data/business/PITCH.md` |
| `docs/dependency-risk-register.md` | `shipglows_data/technical/dependency-risk-register.md` |
| `docs/repo-architecture-audit.md` | `shipglows_data/technical/repo-architecture-audit.md` |
| `docs/whatsapp-web-integration.md` | `shipglows_data/technical/whatsapp-web-integration.md` |
| `docs/explorations/**` | `shipglows_data/workflow/explorations/**` |
| `archive/**` | `shipglows_data/workflow/archives/legacy-root-archive/**` |
| `specs/**` | `shipglows_data/workflow/specs/**` |

La migration peut utiliser des deplacements en masse, mais toute fusion de contenu divergent doit etre revue fichier par fichier. La spec elle-meme est deplacee seulement apres que `shipglows_data/workflow/specs/` existe. Les references historiques dans les archives ne sont pas reecrites.

Stop conditions:

- inventaire source incomplet ou destination non determinee
- collision non equivalente sans archive preservee
- modification concurrente d'un fichier cible apres l'inventaire initial
- contenu potentiellement sensible detecte dans une source documentaire
- perte de fichier, d'entree tracker ou de preuve entre inventaires
- audit, lint, lien actif ou symlink encore invalide
- diff contenant un changement runtime ou un revert de travail preexistant

## Open Questions

None.

## Fresh External Docs

Fresh external docs not needed, because the migration depends only on the repository state and versioned local ShipGlows canonical-path and validation contracts inspected on 2026-08-03.
