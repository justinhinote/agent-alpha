# Architecture

## Current Scope

- Single-package Node + TypeScript project
- CLI-first runtime surface
- Programmatic entrypoint for testability (`runCli`)
- Phase 0/1 command surface: `init`, `generate command`, and `metrics snapshot`
- Marker-based command registry supports generator-driven auto-registration

## Initial Flow

1. `src/cli.ts` receives process arguments.
2. `runCli(argv)` resolves commands through `src/commands/registry.ts`.
3. `generate command` creates source/test skeletons and updates registry markers.
4. `metrics snapshot` collects repo-level KPI signals and writes markdown/json reports.
5. `init` creates deterministic starter scaffolding (including marker-based registry layout).
6. Exit code is returned for shell/CI compatibility.

## Expansion Hooks

- Introduce template packs for domain-specific starter variants.
- Add GitHub API ingestion for pre-merge CI pass-rate and merge-friction KPIs.
- Add baseline comparison engine for setup-hours-saved automation.
- Add release automation as the next maturity step.
