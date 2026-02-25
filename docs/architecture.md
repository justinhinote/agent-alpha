# Architecture

## Current Scope

- Single-package Node + TypeScript project
- CLI-first runtime surface
- Programmatic entrypoint for testability (`runCli`)

## Initial Flow

1. `src/cli.ts` receives process arguments.
2. `runCli(argv)` evaluates options and writes output.
3. Exit code is returned for shell/CI compatibility.

## Expansion Hooks

- Add command groups by extending argument evaluation in `src/index.ts`.
- Introduce dedicated command modules under `src/commands/` when complexity grows.
- Add linting/CI/release automation as the next maturity step.
