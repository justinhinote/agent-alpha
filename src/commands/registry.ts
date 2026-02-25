import type { CliResult } from "../types/cli";
import { runGenerateCommand } from "./generate-command";
import { runInitCommand } from "./init";
import { runMetricsCommand } from "./metrics";
import { runSnapshotReportCommand } from "./snapshot-report";
// AUTO-GENERATED IMPORTS START
// AUTO-GENERATED IMPORTS END

export interface RegisteredCommand {
  name: string;
  summary: string;
  usage: string;
  run: (args: string[], cwd: string) => Promise<CliResult>;
}

const builtInCommands: RegisteredCommand[] = [
  {
    name: "init",
    summary: "Initialize a deterministic CLI starter",
    usage: "agent-alpha init [target-path] [--dry-run] [--force]",
    run: runInitCommand
  },
  {
    name: "generate",
    summary: "Generate project artifacts",
    usage: "agent-alpha generate command <name> [--path <target>] [--dry-run] [--force]",
    run: runGenerateCommand
  },
  {
    name: "metrics",
    summary: "Legacy alias for snapshot reports",
    usage:
      "agent-alpha metrics snapshot [--path <dir>] [--format markdown|json|both] [--window-days <n>] [--repo <owner/name>]",
    run: runMetricsCommand
  },
  {
    name: "snapshot-report",
    summary: "Generate executive-ready markdown/json KPI reports",
    usage:
      "agent-alpha snapshot-report [--path <dir>] [--format markdown|json|both] [--window-days <n>] [--repo <owner/name>]",
    run: runSnapshotReportCommand
  }
];

const generatedCommands: RegisteredCommand[] = [
  // AUTO-GENERATED ENTRIES START
  // AUTO-GENERATED ENTRIES END
];

export const commandRegistry: RegisteredCommand[] = [...builtInCommands, ...generatedCommands];

export function findCommand(name: string): RegisteredCommand | undefined {
  return commandRegistry.find((command) => command.name === name);
}
