import type { CliResult } from "../types/cli";
import { runGenerateCommand } from "./generate-command";
import { runInitCommand } from "./init";
import { runMetricsCommand } from "./metrics";
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
    summary: "Emit KPI snapshot reports as markdown/json",
    usage: "agent-alpha metrics snapshot [--path <target>] [--format markdown|json|both]",
    run: runMetricsCommand
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
