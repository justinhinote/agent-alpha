# Agent Alpha

Agent Alpha is a CLI-first TypeScript project scaffolded for rapid iteration with strict typing, testable command handling, and documented operator workflow.

## Prerequisites

- Node.js 22+
- pnpm (or use `corepack pnpm`)

## Quickstart

```bash
corepack pnpm install
corepack pnpm lint
corepack pnpm format:check
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm start -- --help
```

## CLI Commands

- `agent-alpha init [target-path] [--dry-run] [--force]`
- `agent-alpha generate command <name> [--path <target>] [--dry-run] [--force]`
- `agent-alpha metrics snapshot [--path <target>] [--format markdown|json|both]`
- `agent-alpha --help`
- `agent-alpha --version`

### Command Examples

```bash
# Create a new starter project
corepack pnpm start -- init my-new-cli

# Generate a command skeleton inside a project
corepack pnpm start -- generate command sync-reports --path my-new-cli

# Emit KPI snapshots to docs/reports/
corepack pnpm start -- metrics snapshot --format both
```

## Available Scripts

- `dev`: run the CLI directly from TypeScript source
- `lint`: run ESLint across the codebase
- `format`: apply Prettier formatting
- `format:check`: validate formatting without rewriting files
- `typecheck`: run TypeScript static checks without emitting files
- `test`: execute CLI smoke tests
- `build`: compile TypeScript into `dist/`
- `start`: run compiled CLI binary

## Initial CLI Contract

- `init` generates a deterministic starter baseline.
- `generate command` scaffolds command + test skeleton files and auto-updates the command registry.
- `metrics snapshot` emits KPI reports in markdown/json for executive and operator review.
- Unknown commands return a non-zero exit code with actionable guidance.

## Supporting Docs

- [Architecture](/Users/justin/Agent_Alpha/docs/architecture.md)
- [Metrics Dashboard Spec](/Users/justin/Agent_Alpha/docs/metrics-dashboard-spec.md)
- [Executive One-Pager](/Users/justin/Agent_Alpha/docs/executive-one-pager.md)
