# Task Todo

## Plan

- [x] Confirm project defaults and scaffold scope.
- [x] Initialize repository hygiene (`git`, `.gitignore`, `README`).
- [x] Author canonical `AGENTS.md` from provided instruction source.
- [x] Create task system templates in `tasks/`.
- [x] Scaffold Node + TypeScript CLI structure.
- [x] Install dependencies and run verification gates.
- [x] Record final review results.

## Progress Notes

- Initialized repository and baseline file structure.
- Added instruction policy, CLI source, tests, and architecture placeholder.
- Installed dependencies with `corepack pnpm install`.
- Verified `typecheck`, `test`, and `build` successfully.
- Verified CLI behavior for `--help`, `--version`, and unknown command handling.

## Review / Results

- `corepack pnpm lint`: pass
- `corepack pnpm format:check`: pass
- `corepack pnpm typecheck`: pass
- `corepack pnpm test`: pass (4/4 smoke tests)
- `corepack pnpm build`: pass
- `corepack pnpm start -- --help`: pass
- `corepack pnpm start -- --version`: pass (`0.1.0`)
- `node dist/cli.js unknown-cmd`: pass (non-zero exit with actionable guidance)

## Follow-up: Quality Gates

- [x] Add ESLint + Prettier tooling and scripts.
- [x] Add CI workflow for lint/format/typecheck/test/build.
- [x] Re-run validation matrix after tooling changes.

## BRD Follow-up: Phase 0/1 + Strategy Docs

- [x] Implement `init` command for deterministic starter generation.
- [x] Implement `generate command` scaffolding command.
- [x] Add filesystem-collision and dry-run safety.
- [x] Expand tests for Phase 0/1 command flows.
- [x] Add metrics dashboard specification document.
- [x] Add non-technical executive one-pager.
- [x] Re-run full local validation matrix.

## BRD Follow-up: Review / Results

- `corepack pnpm format:check`: pass
- `corepack pnpm lint`: pass
- `corepack pnpm typecheck`: pass
- `corepack pnpm test`: pass (9/9 tests)
- `corepack pnpm build`: pass
- `corepack pnpm start -- --help`: pass
- `corepack pnpm start -- init --help`: pass
- `corepack pnpm start -- generate --help`: pass
- `corepack pnpm start -- init sandbox --dry-run`: pass
- `corepack pnpm start -- generate command sync-data --dry-run`: pass

## BRD Follow-up: Registry + Metrics

- [x] Add marker-based command registry for parser dispatch.
- [x] Auto-update registry during `generate command`.
- [x] Add `metrics snapshot` command for markdown/json KPI output.
- [x] Expand tests for registry updates and metrics output.
- [x] Re-run full validation matrix.

## BRD Follow-up: Registry + Metrics Results

- `corepack pnpm format:check`: pass
- `corepack pnpm lint`: pass
- `corepack pnpm typecheck`: pass
- `corepack pnpm test`: pass (12/12 tests)
- `corepack pnpm build`: pass
- `corepack pnpm start -- --help`: pass
- `corepack pnpm start -- metrics --help`: pass
- `corepack pnpm start -- metrics snapshot --format both`: pass

## BRD Follow-up: Snapshot Report v0

- [x] Add canonical `snapshot-report` top-level command.
- [x] Build shared reporting engine under `src/lib/snapshot-report/`.
- [x] Add optional GitHub enrichment with local-first fallback.
- [x] Refactor `metrics snapshot` into compatibility alias with deprecation notice.
- [x] Add parser + KPI unit tests and expanded CLI integration tests.
- [x] Update docs for v0 KPI contract and deferred setup-hours-saved metric.
- [x] Re-run full local validation matrix and runtime check.

## BRD Follow-up: Snapshot Report v0 Results

- `corepack pnpm format:check`: pass
- `corepack pnpm lint`: pass
- `corepack pnpm typecheck`: pass
- `corepack pnpm test`: pass (29/29 tests)
- `corepack pnpm build`: pass
- `corepack pnpm start -- --help`: pass
- `corepack pnpm start -- snapshot-report --help`: pass
- `corepack pnpm start -- snapshot-report --format both --path tmp-snapshot`: pass
- `corepack pnpm start -- metrics snapshot --format json --path tmp-snapshot-alias`: pass
- Performance gate: `snapshot-report` completed in ~2s on this repo (<60s target)

## Expansion Cycle: CI Snapshot Automation + Trend Deltas

- [x] Finalize trend/delta engine and markdown/json output contract.
- [x] Add tests for trend baseline and delta math.
- [x] Add CI automation job to publish snapshot artifacts on pushes to `main`.
- [x] Update docs for automation behavior and trend interpretation.
- [x] Run full validation matrix and record results.

## Expansion Cycle: Progress Notes

- Added trend model types and trend collector module under `src/lib/snapshot-report/`.
- Wired trend/delta output into snapshot-report rendering and command output.
- Added unit and integration tests for prior-snapshot baseline behavior.
- Added CI `snapshot_artifacts` job in `.github/workflows/ci.yml` (push `main` only, post-validate).
- Added CI pre-step to restore prior snapshot artifacts from the previous successful `main` run.
- Updated README and architecture/spec docs for trend and CI automation behavior.
- Opened PR #5 after push to `main` was blocked by branch protection rules.

## Expansion Cycle: Review / Results

- `corepack pnpm format`: pass
- `corepack pnpm lint`: pass
- `corepack pnpm format:check`: pass
- `corepack pnpm typecheck`: pass
- `corepack pnpm test`: pass (32/32 tests)
- `corepack pnpm build`: pass
- `corepack pnpm start -- snapshot-report --format json --path tmp-snapshot-ci`: pass
- `corepack pnpm start -- snapshot-report --format json --path tmp-snapshot-ci` (second run): pass, trend baseline populated
- `corepack pnpm start -- metrics snapshot --format json --path tmp-snapshot-ci-alias`: pass
