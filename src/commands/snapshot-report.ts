import { relative } from "node:path";

import { buildSnapshotReport } from "../lib/snapshot-report";
import type { SnapshotReportFormat, SnapshotReportOptions } from "../lib/snapshot-report/types";
import type { CliResult } from "../types/cli";

const SNAPSHOT_REPORT_USAGE =
  "agent-alpha snapshot-report [--path <dir>] [--format markdown|json|both] [--window-days <n>] [--repo <owner/name>]";

function isValidRepoSlug(value: string): boolean {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value);
}

function parseWindowDays(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 3650) {
    return null;
  }

  return parsed;
}

export function parseSnapshotReportArgs(args: string[]): {
  options?: SnapshotReportOptions;
  error?: string;
} {
  let outputPath = "docs/reports";
  let format: SnapshotReportFormat = "both";
  let windowDays = 30;
  let repoOverride: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--path") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        return {
          error: "Missing value for --path"
        };
      }
      outputPath = value;
      index += 1;
      continue;
    }

    if (arg === "--format") {
      const value = args[index + 1];
      if (value !== "markdown" && value !== "json" && value !== "both") {
        return {
          error: "Invalid value for --format. Expected markdown, json, or both."
        };
      }
      format = value;
      index += 1;
      continue;
    }

    if (arg === "--window-days") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        return {
          error: "Missing value for --window-days"
        };
      }

      const parsedDays = parseWindowDays(value);
      if (parsedDays === null) {
        return {
          error: "Invalid value for --window-days. Use an integer between 1 and 3650."
        };
      }

      windowDays = parsedDays;
      index += 1;
      continue;
    }

    if (arg === "--repo") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        return {
          error: "Missing value for --repo"
        };
      }

      if (!isValidRepoSlug(value)) {
        return {
          error: "Invalid value for --repo. Expected owner/name."
        };
      }

      repoOverride = value;
      index += 1;
      continue;
    }

    return {
      error: `Unknown option for snapshot-report: ${arg}`
    };
  }

  return {
    options: {
      outputPath,
      format,
      windowDays,
      repoOverride
    }
  };
}

export async function runSnapshotReportCommand(args: string[], cwd: string): Promise<CliResult> {
  const parsed = parseSnapshotReportArgs(args);
  if (parsed.error) {
    return {
      exitCode: 1,
      stream: "stderr",
      message: [parsed.error, `Usage: ${SNAPSHOT_REPORT_USAGE}`].join("\n")
    };
  }

  const options = parsed.options as SnapshotReportOptions;
  const startTime = Date.now();

  try {
    const result = await buildSnapshotReport(cwd, options);
    const elapsedMs = Date.now() - startTime;

    return {
      exitCode: 0,
      stream: "stdout",
      message: [
        `Snapshot report generated in ${elapsedMs}ms.`,
        ...result.writtenFiles.map((path) => `- ${relative(cwd, path) || path}`),
        `GitHub enrichment: ${result.report.metadata.dataSources.github ? "enabled" : "disabled"}`,
        `Trend baseline: ${result.report.trend.previousSnapshot?.generatedAt ?? "none"}`
      ].join("\n")
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      exitCode: 1,
      stream: "stderr",
      message: ["Snapshot report generation failed.", `Details: ${message}`].join("\n")
    };
  }
}

export const SNAPSHOT_REPORT_COMMAND_USAGE = SNAPSHOT_REPORT_USAGE;
