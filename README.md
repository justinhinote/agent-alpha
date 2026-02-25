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

- `agent-alpha --help`
- `agent-alpha --version`
- Unknown commands return a non-zero exit code with actionable guidance.
