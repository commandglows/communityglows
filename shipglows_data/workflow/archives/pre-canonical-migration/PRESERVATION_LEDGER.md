---
artifact: migration_record
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: socialglowz
created: "2026-08-03"
updated: "2026-08-03"
status: reviewed
source_skill: 102-sg-start
scope: governance-corpus-migration-preservation
owner: Diane
confidence: high
risk_level: medium
security_impact: none
docs_impact: yes
linked_systems:
  - shipglows_data/workflow/specs/shipglows-data-corpus-migration.md
  - shipglows_data/workflow/archives/pre-canonical-migration/site-shipflow_data/
  - shipglows_data/workflow/archives/legacy-root-archive/
depends_on: []
supersedes: []
evidence:
  - "The nine divergent site governance files were copied byte-for-byte before the nested corpus was removed."
  - "Root tracker entries were compared by stable id or subject before the legacy tracker files were removed."
next_review: "2026-11-03"
next_step: "Keep this record with the archived migration sources."
---

# Governance Corpus Migration Preservation Ledger

| Source artifact | Canonical target | Content preserved | Content intentionally rejected | Tracker extraction | Final local state |
|---|---|---|---|---|---|
| `shipflow_data/**` | `shipglows_data/**` | Entire active corpus moved with Git-visible history | None | Existing workflow trackers retained | Legacy root removed |
| `site/shipflow_data/**` | `shipglows_data/workflow/archives/pre-canonical-migration/site-shipflow_data/**` | Nine divergent files copied byte-for-byte | No variant content deleted; archived variants remain available for later semantic review | None | Nested corpus removed |
| Root `TASKS.md` | `shipglows_data/workflow/TASKS.md` | Both task ids already existed canonically; the active major-migration task has the newer `in_progress` state | Duplicate, older tracker lines | Compared by stable task id | Root tracker removed |
| Root `AUDIT_LOG.md` | `shipglows_data/workflow/AUDIT_LOG.md` | Dependency-hygiene audit already existed canonically with identical material content | Duplicate line | Compared by date and subject | Root tracker removed |
| Root `TEST_LOG.md` | `shipglows_data/workflow/TEST_LOG.md` | CinderReels Android session-isolation result appended verbatim in meaning | None | QA record added under its original date | Root tracker removed |
| `docs/**` | Business, technical, and workflow families under `shipglows_data/` | All six documents moved according to the migration spec | None | Exploration reports reclassified | Root docs directory removed |
| `archive/**` | `shipglows_data/workflow/archives/legacy-root-archive/**` | Full historical snapshot and archive policy moved without content edits | None | None | Root archive removed |
| `specs/**` | `shipglows_data/workflow/specs/**` | Migration spec moved and remains the chantier source of truth | None | Skill history retained in spec | Root specs directory removed |

Historical path strings inside archived snapshots are intentionally unchanged. They are evidence, not active instructions.
