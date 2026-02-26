# Architecture

## Current Scope

- Single-package Node + TypeScript project
- CLI-first runtime surface
- Programmatic entrypoint for testability (`runCli`)
- Phase 0/v1 command surface: `init`, `generate command`, `snapshot-report`, and `metrics snapshot` (alias)
- Marker-based command registry supports generator-driven auto-registration
- CI automation publishes snapshot-report artifacts on merges to `main`

## Initial Flow

1. `src/cli.ts` receives process arguments.
2. `runCli(argv)` resolves commands through `src/commands/registry.ts`.
3. `generate command` creates source/test skeletons and updates registry markers.
4. `snapshot-report` runs shared report engine modules under `src/lib/snapshot-report/`.
5. `metrics snapshot` delegates to `snapshot-report` with deprecation notice.
6. Report engine combines local git/filesystem signals with optional GitHub API enrichment.
7. Engine computes trend/delta values against the latest prior JSON snapshot in the same output path.
8. Engine writes deterministic markdown/json artifacts to target output path.
9. On pushes to `main`, CI restores prior snapshot artifacts when available, then uploads fresh artifacts for operating review.
10. `init` creates deterministic starter scaffolding (including marker-based registry layout).
11. Exit code is returned for shell/CI compatibility.

## Expansion Hooks

- Introduce template packs for domain-specific starter variants.
- Add deeper GitHub pagination strategy for very active repos.
- Add baseline onboarding flow for setup-hours-saved KPI (deferred in v0 output).
- Add release automation as the next maturity step.
- Add historical trend aggregation across more than two snapshots.
