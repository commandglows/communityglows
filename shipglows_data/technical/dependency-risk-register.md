---
artifact: dependency_risk_register
metadata_schema_version: "1.0"
artifact_version: "1.0.5"
project: communityglows
created: "2026-04-30"
updated: "2026-08-14"
status: active
source_skill: 102-sg-start
scope: dependency-risk
owner: "Diane"
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
depends_on:
  - artifact: "shipglows_data/workflow/specs/socialflow-dependency-hygiene-and-major-line-migration.md"
    artifact_version: "1.0.0"
    required_status: "ready"
supersedes: []
evidence:
  - "Dependency hygiene and native RustSec migration specs define the accepted risk policy."
  - "Register entries document affected dependency paths, reachability, decision, and removal criteria."
  - "The 2026-08-14 Dependabot pass records four npm alerts across the root pnpm lockfile and independent Astro site npm lockfile."
next_review: "2026-09-03"
next_step: "/103-sg-verify sg-extension-deps-audit-fixes"
---

# Dependency Risk Register

This register records dependency risks that are accepted, blocked, or still under staged migration review. Do not use a transitive major override to quiet an advisory unless the direct package officially supports that dependency major and the affected build surface passes.

## 2026-08-14 Dependabot Security Patch

The active alert set contains four GitHub alerts but three vulnerable package/version paths. The root remediation is lock-only. The independent site graph additionally moves its existing Astro dependency from `^6.1.6` to the approved `^7.2.0` line so current secure transitive floors can resolve without overrides.

| Alert | Affected path | Previous lock | Patched lock | Reachability | Decision |
| --- | --- | --- | --- | --- | --- |
| `GHSA-5p4m-2wfm-xmqj` / root | ESLint and Vue i18n tooling -> `js-yaml` | `4.3.0` | `4.3.1` | Development/tooling | Resolve the existing compatible transitive patch in `pnpm-lock.yaml`; no direct dependency or override. |
| `GHSA-5p4m-2wfm-xmqj` / site | Astro and `@astrojs/markdown-remark` -> `js-yaml` | `4.1.1` | `4.3.1` | Site build/runtime graph | Resolve the compatible transitive patch in `site/package-lock.json`. |
| `GHSA-fxqj-rqcc-2cmp` | Site Vite -> `postcss` | `8.5.14` | `8.5.26` | Site build/runtime graph | Resolve the compatible PostCSS patch without changing Vite or Tailwind. |
| `GHSA-28wg-ghj8-5hjv` | Site PostCSS -> `nanoid` | `3.3.11` | `3.3.18` | Site build/runtime graph | Resolve the compatible Nano ID patch through the updated PostCSS lock entry, with the final patch admitted only after the seven-day release-age boundary. |

Dependabot coverage now includes a separate weekly npm entry for `/site`, using the same minor/patch grouping boundary as the root package graph. This prevents the independent npm lockfile from depending on root-only version update coverage.

Required proof before integration verification:

- exact lockfile versions remain at or above the GitHub patched floors;
- `pnpm audit` and `npm audit --prefix site` are recorded without misrepresenting unrelated findings as part of this slice;
- `pnpm-lock.yaml`, `site/package-lock.json`, and `.github/dependabot.yml` parse successfully;
- the diff contains no package manifest change except the approved site Astro range, no override, and no unrelated direct dependency change;
- `git diff --check` passes.

Current targeted validation and fresh-docs verdict:

- The official Astro 7 upgrade guide and Astro 7 release notes confirm the Vite 8 migration, Rust compiler, and general expectation that sites without Vite-internal integrations usually need no source change. npm metadata for Astro 7.2.0 requires Node `>=22.12.0`; the repository's Node 24 floor is compatible.
- Date-bounded npm resolution initially used `--before=2026-08-07T16:41:04Z`. Package publication metadata confirms `nanoid@3.3.18` was published at `2026-08-07T16:41:05.696Z`; after the approved deadline, `npm update nanoid --prefix site --package-lock-only --ignore-scripts` moved only the existing transitive lock entry from `3.3.17` to `3.3.18`.
- YAML/JSON parsing confirms root `js-yaml@4.3.1`, site Astro `7.2.0`, Vite `8.2.1`, nested esbuild `0.28.1`, Sharp `0.35.3`, devalue `5.9.0`, SVGO `4.0.2`, `js-yaml@4.3.1`, `postcss@8.5.26`, `nanoid@3.3.18`, and a distinct `/site` Dependabot npm entry.
- `pnpm audit --prod --audit-level=low` passes with no known production vulnerabilities.
- Full `pnpm audit --audit-level=low` no longer reports `js-yaml`; it remains non-zero for two new `image-size@2.0.2` advisories in the dev-only `web-ext -> addons-linter` path. Those advisories have no published patched version and are outside this four-alert slice.
- Both `npm audit --prefix site --omit=dev --audit-level=low` and the full site audit report zero vulnerabilities after resolving `nanoid@3.3.18`. The prior Astro, devalue, esbuild, Sharp, SVGO, Vite, js-yaml, PostCSS, and Nano ID findings no longer appear locally.
- `npm ci --prefix site` succeeds. `npm run build --prefix site` builds all 21 static pages; Lightning CSS emits a non-fatal pre-existing `Unknown at rule: @theme` warning that remains visible for integration review.
- The repository's seven-day minimum release age prevented resolving `nanoid@3.3.18` before 2026-08-14 18:41:05 Europe/Paris. The final resolution occurred after that boundary without relaxing the policy.
- The bounded dependency slice is ship-ready locally. GitHub alert closure is not claimed until push, hosted CI, and the GitHub Dependabot state are verified.

## Accepted And Tracked Risks

| ID | Status | Affected path | Production reachability | Decision | Evidence | Removal criteria | Next review |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DEP-RISK-001 | accepted upstream risk | `web-ext@10.1.0 -> node-notifier@10.0.1 -> uuid@8.3.2` | Dev/build only; Firefox lint and extension tooling path | Do not force `uuid@14` through `pnpm.overrides`; keep the advisory tracked until `web-ext` or `node-notifier` ships a compatible fix | `pnpm audit --prod --audit-level low` is clean and full `pnpm audit --audit-level low` reports only this advisory; `pnpm why uuid` resolves only through `web-ext`; npm metadata still reports `web-ext@10.1.0` as latest and still depends on `node-notifier@10.0.1` | Upgrade normally when upstream removes the vulnerable path and `build:firefox` plus `lint:manifest` pass | 2026-06-09 |
| DEP-RISK-002 | mitigated in CI | RustSec scan execution gap for native release artifacts | Release path; desktop and Android native packages include Rust crates | Run `cargo audit` before Android debug APK builds and before Linux/Windows Tauri release builds | `.github/workflows/dev-builds.yml` and `.github/workflows/build.yml` install and run `cargo-audit` before native artifact builds; local `cargo audit` runs with exit 0 | Close after both workflows show RustSec audit logs before native artifacts | 2026-05-30 |
| DEP-RISK-003 | tracked upstream license review | `web-ext@10.1.0 -> update-notifier@7.3.1 -> configstore@7.0.0 -> atomically@2.0.3 -> stubborn-fs@1.2.5` | Dev/build only | Keep as a dev-tooling transitive license-review item while `web-ext` remains required for Firefox manifest linting | `pnpm why atomically` and `pnpm why stubborn-fs` resolve only through `web-ext` update notification tooling | Close if upstream changes dependency path or license metadata is confirmed acceptable for dev-only tooling | 2026-05-30 |
| DEP-RISK-004 | accepted visible native risk | RustSec warning set through Tauri Linux desktop stack and Tauri parser/codegen paths: GTK3 bindings, `glib`, `rand@0.7.3`, `proc-macro-error`, and `unic-*` crates | Native desktop release path; GTK/WebKitGTK warnings are Linux-specific, parser/codegen warnings remain lockfile-visible for all native scans | Keep `cargo-audit` as the executable gate, fix safe direct drift, and keep remaining warnings visible with advisory-level rationale; no transitive overrides, `.cargo/audit.toml`, `deny.toml`, `cargo-deny`, or suppression config in this stage | 2026-05-02 native pass moved direct `rand@0.8.5` to `0.8.6`; final local `cargo audit --json` reports 0 vulnerabilities, 17 unmaintained warnings, and 2 unsound warnings | Close after GTK/glib and parser warnings are removed by supported Tauri/Wry/GTK/parser updates with native packaging proof, or after a separate dependency-policy spec explicitly accepts suppression tooling | 2026-06-02 |
| DEP-RISK-005 | mitigated with bounded override | `@convex-dev/auth@0.0.92 -> convex@1.39.1 -> ws@8.18.0` (upstream pin) | Runtime + dev (Convex client and tests) | Keep Convex line upgraded (`convex@1.39.1`, `@convex-dev/auth@0.0.92`, `convex-test@0.0.53`) and enforce `pnpm.overrides.ws=8.20.1` because Convex latest still pins vulnerable `ws@8.18.0` | `pnpm audit --prod --audit-level low` now returns no vulnerabilities; `pnpm why ws` resolves to `8.20.1` through Convex paths; extension builds, lint:manifest, tests, typecheck, and `pnpm tauri:build` pass on this lockfile | Remove override once Convex releases a line that no longer pins vulnerable `ws`, then re-run full dependency validation without override | 2026-06-09 |
| DEP-RISK-006 | accepted upstream risk | `web-ext -> addons-linter -> image-size@2.0.2` | Dev/build only; Firefox extension lint tooling | Keep both current `image-size` advisories visible; no patched upstream version exists and no transitive override is introduced | The earlier full root `pnpm audit --audit-level=low` reported the two advisories only on this dev-tooling path; production audit remained clean | Upgrade normally when `addons-linter`/`web-ext` provides a patched path, then rerun Firefox build and manifest lint | 2026-09-03 |

## Native RustSec Warning Migration Evidence

Date: 2026-05-02.

Versions:

- `rand` 0.8 lock entry: `0.8.5` -> `0.8.6`
- `tauri`: kept at locked `2.10.2`
- `tauri-runtime-wry`: kept at locked `2.10.0`
- `wry`: kept at locked `0.54.2`

Fresh docs checked:

- Context7 `/websites/v2_tauri_app`: `tauri build` and `tauri android build` generate native artifacts and run `build.beforeBuildCommand` against `build.frontendDist`.
- RustSec advisory data through `cargo audit 0.22.1`: `rand` patched on the 0.8 line at `>=0.8.6`, `glib` patched at `>=0.20.0`, GTK3 binding warnings have no patched GTK3 versions.
- `cargo-audit` policy remains visible warnings plus documentation; suppression config is deferred.

Applied decision:

- Fixed the direct `rand@0.8.5` warning with `cargo update -p rand@0.8.5 --precise 0.8.6`.
- Evaluated `cargo update --dry-run`; a broader compatible native refresh would update Tauri/Wry/parser paths and remove some parser warnings, but it changes 134 packages and needs a separate native packaging/MSRV validation pass.
- Kept remaining warnings visible and classified in `src-tauri/DEPENDENCY_AUDIT.md`.

Validation:

- `(cd src-tauri && cargo audit --json > /tmp/communityglows-cargo-audit-accepted.json)` -> 0 vulnerabilities, 17 unmaintained warnings, 2 unsound warnings.
- `(cd src-tauri && cargo tree --locked -i rand@0.8.6)` -> direct `app` edge now uses patched `rand@0.8.6`.
- `(cd src-tauri && cargo tree --locked -i rand@0.7.3)` -> remaining old `rand` line is Tauri parser/codegen owned.
- `(cd src-tauri && cargo tree --locked -i glib@0.18.5)` -> remaining `glib` warning is Linux GTK/WebKit/Tauri owned.
- `corepack pnpm tauri:build` -> passed; this validates Tauri frontend assets only, not native packaging.
- `(cd src-tauri && cargo check --locked)` -> passed after installing the Tauri Linux system dependencies.
- `pnpm tauri:bundle` -> passed after enabling the Corepack `pnpm` shim; produced `/home/ubuntu/communityglows/src-tauri/target/release/app`.
- Workflow review confirms RustSec runs before native artifact generation in `.github/workflows/build.yml` and `.github/workflows/dev-builds.yml`.

Proof gap:

- Live GitHub Actions logs still need to confirm `cargo audit` runs before native artifacts on the actual runners.

## Completed Hygiene Decisions

| Decision | Result | Validation target |
| --- | --- | --- |
| Node floor flooring for staged Vite/ESLint upgrades | Explicit Node floor is now pinned to `24.0.0` in `engines.node`, `.nvmrc`, and Node setup steps of `.github/workflows/build.yml` + `.github/workflows/dev-builds.yml` | `node --version` must show 24.0.x+ locally, CI `node-version` now pins 24.0.0 explicitly |
| Unused direct dependencies | Removed unused stale direct dev packages while keeping `@iconify-json/ph` because `<i-ph-*>` components are used | Frozen install, typecheck, tests, lint, web/Chrome/Firefox builds |
| `scripts/vue-tsc-fixed.cjs` hidden `semver` dependency | Removed the dead script instead of adding `semver`; package scripts and source no longer reference it | `rg "vue-tsc-fixed|semver"` outside lockfiles should not find runtime package usage |
| npm package license posture | Added `license: UNLICENSED` to match private product posture | `node -e "console.log(require('./package.json').license)"` |
| Cargo crate posture | Replaced empty license metadata with `publish = false` | `cargo metadata --manifest-path src-tauri/Cargo.toml --format-version 1` |

## Major Migration Preflight

Before each major-line migration stage, record these items in the implementation notes or this register:

1. Print `node --version`; Vite 7+/8 and ESLint 10 require Node `24.0.0` or later while staying on the Node 20 major line unless a separate runtime decision approves another major.
2. Record local package versions before editing and the exact official docs source checked for the stage.
3. Define the rollback boundary before changing package files.
4. Run the stage-specific install, audit, typecheck, lint, test, build, extension, Convex, Tauri frontend, and native packaging checks named in the spec.
5. Stop the stage if official docs require dropping Chrome, Firefox, web, desktop, Android, frozen lockfiles, audit checks, or Node 20 compatibility.

Docs to re-check immediately before their migration stage: Vite migration guide, Tauri distribute/build docs, ESLint v10 migration guide, TypeScript 6 release notes, Pinia v2 to v3 migration guide, Vue Router v5 / file-based routing docs, Convex/Auth docs, web-ext repository/npm metadata, VueUse release metadata, Marked release metadata, PrimeVue v4 styled-mode docs, Tailwind CSS v4 migration docs, CRXJS Vite plugin docs.

## PrimeVue 4 Migration Evidence

Date: 2026-05-02.

Versions:

- `primevue`: `^3.53.1` -> `^4.5.5`
- `@primevue/themes`: removed
- `@primeuix/themes`: added at `^2.0.3`
- `primeflex`: `^3.3.1` -> `^4.0.0`
- `primeicons`: kept at `^7.0.0`

Fresh docs checked:

- Context7 `/primefaces/primevue`: v4 migration, styled mode, removed `primevue/resources`, `@primeuix/themes` preset configuration.
- Official PrimeVue migration guide: `https://primevue.org/guides/migration/v4/`.
- Official PrimeVue styled mode docs: `https://primevue.org/theming/styled`.

Rollback boundary: package dependency changes plus `src/ui/setup/pages/CommunityGlows/main.ts` only. Do not start Tailwind, router, Vite, TypeScript, or runtime/auth upgrades in this stage.

Applied decision: use the Lara preset from `@primeuix/themes/lara` to stay closest to the previous `lara-light-blue` theme, configure `darkModeSelector: '.dark'` to preserve the existing `html.dark` store behavior, and keep `cssLayer: false` to avoid changing Tailwind/DaisyUI cascade order in this stage.

Validation:

- `corepack pnpm install --frozen-lockfile --ignore-scripts`
- `corepack pnpm audit --prod --audit-level=high`
- `corepack pnpm audit --audit-level=high`
- `corepack pnpm typecheck`
- `corepack pnpm typecheck:full`
- `corepack pnpm exec tsc -p convex/tsconfig.json --noEmit`
- `corepack pnpm lint:check`
- `corepack pnpm test:once`
- `corepack pnpm build:web`
- `corepack pnpm build:chrome`
- `corepack pnpm build:firefox`
- `corepack pnpm lint:manifest`
- `corepack pnpm tauri:build`

Visual smoke: blocked in this environment because Playwright requires Chrome at `/opt/google/chrome/chrome`, and `npx playwright install chrome` reports Chrome installation is unsupported on Linux Arm64. Run a manual browser smoke on a Chrome-capable machine before closing this stage as fully verified.
