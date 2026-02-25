import { SNAPSHOT_REPORT_COMMAND_USAGE, runSnapshotReportCommand } from "./snapshot-report";
import type { CliResult } from "../types/cli";

const METRICS_USAGE =
  "agent-alpha metrics snapshot [--path <dir>] [--format markdown|json|both] [--window-days <n>] [--repo <owner/name>]";

export async function runMetricsCommand(args: string[], cwd: string): Promise<CliResult> {
  if (args.length === 0 || args[0] !== "snapshot") {
    return {
      exitCode: 1,
      stream: "stderr",
      message: [
        "Metrics currently supports one subcommand: snapshot",
        `Usage: ${METRICS_USAGE}`
      ].join("\n")
    };
  }

  if (args[1] === "--help" || args[1] === "-h") {
    return {
      exitCode: 0,
      stream: "stdout",
      message: [
        `Usage: ${METRICS_USAGE}`,
        "",
        "Deprecated: use `agent-alpha snapshot-report` instead.",
        `Canonical usage: ${SNAPSHOT_REPORT_COMMAND_USAGE}`
      ].join("\n")
    };
  }

  const delegated = await runSnapshotReportCommand(args.slice(1), cwd);

  return {
    ...delegated,
    message: [
      "Deprecated: `metrics snapshot` is an alias. Use `agent-alpha snapshot-report`.",
      delegated.message ?? ""
    ]
      .filter((line) => line.length > 0)
      .join("\n")
  };
}
