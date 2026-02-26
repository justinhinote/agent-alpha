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
- `agent-alpha snapshot-report [--path <dir>] [--format markdown|json|both] [--window-days <n>] [--repo <owner/name>]`
- `agent-alpha metrics snapshot ...` (legacy alias)
- `agent-alpha --help`
- `agent-alpha --version`

## Live Demo Environment

```bash
corepack pnpm demo:snapshot
```

This creates `.demo/snapshot-report/reports/`, runs `snapshot-report` twice, prints file paths plus trend/delta summary, and auto-opens the latest markdown report. Use `bash scripts/demo-snapshot-report.sh --no-open` to skip auto-open.

### Command Examples

```bash
# Create a new starter project
corepack pnpm start -- init my-new-cli

# Generate a command skeleton inside a project
corepack pnpm start -- generate command sync-reports --path my-new-cli

# Emit KPI snapshots to docs/reports/ (canonical)
corepack pnpm start -- snapshot-report --format both

# Re-run against the same output path to include trend/delta vs previous snapshot
corepack pnpm start -- snapshot-report --format both --path docs/reports

# Legacy alias (still supported)
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
- `start`: run CLI from TypeScript source (`tsx`) for immediate command availability
- `start:dist`: run compiled CLI binary from `dist/`

## Initial CLI Contract

- `init` generates a deterministic starter baseline.
- `generate command` scaffolds command + test skeleton files and auto-updates the command registry.
- `snapshot-report` is the production KPI reporting command (markdown/json output).
- `snapshot-report` includes trend/delta values when a prior JSON snapshot exists in the output path.
- `metrics snapshot` remains as a compatibility alias with deprecation messaging.
- Unknown commands return a non-zero exit code with actionable guidance.

## CI Snapshot Automation

- GitHub Actions `CI` workflow runs validation on PRs and pushes.
- On pushes to `main`, a follow-on `snapshot_artifacts` job runs:
  - fetches the previous successful `main` run artifact (when available) to seed trend baseline data
  - `pnpm start -- snapshot-report --path docs/reports --format both --repo <owner/name>`
  - uploads generated `docs/reports/snapshot-report-*` files as a build artifact.
- Local collection is always used; GitHub enrichment remains optional and does not block artifact generation.

## Supporting Docs

- [Architecture](/Users/justin/Agent_Alpha/docs/architecture.md)
- [Metrics Dashboard Spec](/Users/justin/Agent_Alpha/docs/metrics-dashboard-spec.md)
- [Executive One-Pager](/Users/justin/Agent_Alpha/docs/executive-one-pager.md)
