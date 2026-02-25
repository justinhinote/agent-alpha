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
