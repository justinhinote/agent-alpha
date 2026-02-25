import { readdir, mkdir, stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { relative, resolve } from "node:path";
import type { Dirent } from "node:fs";

import type { CliResult } from "../types/cli";

const execFileAsync = promisify(execFile);

type SnapshotFormat = "markdown" | "json" | "both";

interface MetricsSnapshotOptions {
  outputPath: string;
  format: SnapshotFormat;
}

interface MetricsSnapshot {
  generatedAt: string;
  repositoryRoot: string;
  branch: string | null;
  totalCommits: number | null;
  commitsLast30Days: number | null;
  testFileCount: number;
  commandFileCount: number;
  ciConfigPresent: boolean;
  docsPresent: {
    architecture: boolean;
    metricsSpec: boolean;
    executiveOnePager: boolean;
  };
  kpi: {
    timeToFirstFeatureHours: number | null;
    ciPassRateBeforeMergePercent: number | null;
    setupHoursSaved: number | null;
    mergeFrictionMedianHours: number | null;
  };
  notes: string[];
}

function parseMetricsArgs(args: string[]): { options?: MetricsSnapshotOptions; error?: string } {
  if (args[0] !== "snapshot") {
    return {
      error: "Metrics currently supports one subcommand: snapshot"
    };
  }

  let outputPath = "docs/reports";
  let format: SnapshotFormat = "both";

  for (let index = 1; index < args.length; index += 1) {
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
          error: "Invalid format value. Expected markdown, json, or both."
        };
      }
      format = value;
      index += 1;
      continue;
    }

    return {
      error: `Unknown option for metrics snapshot: ${arg}`
    };
  }

  return {
    options: {
      outputPath,
      format
    }
  };
}

async function runGitCommand(cwd: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd });
    const value = stdout.trim();
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function toNumberOrNull(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function countFilesRecursively(basePath: string, extension: string): Promise<number> {
  async function walk(path: string): Promise<number> {
    let total = 0;

    let entries: Dirent<string>[] = [];
    try {
      entries = await readdir(path, { withFileTypes: true, encoding: "utf8" });
    } catch {
      return 0;
    }

    for (const entry of entries) {
      const entryPath = resolve(path, entry.name);
      if (entry.isDirectory()) {
        total += await walk(entryPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(extension)) {
        total += 1;
      }
    }

    return total;
  }

  return walk(basePath);
}

function buildMarkdownSnapshot(snapshot: MetricsSnapshot): string {
  return [
    "# Metrics Snapshot",
    "",
    `Generated At: ${snapshot.generatedAt}`,
    `Repository Root: ${snapshot.repositoryRoot}`,
    "",
    "## Delivery Signals",
    `- Branch: ${snapshot.branch ?? "n/a"}`,
    `- Total commits: ${snapshot.totalCommits ?? "n/a"}`,
    `- Commits in last 30 days: ${snapshot.commitsLast30Days ?? "n/a"}`,
    "",
    "## Engineering Signals",
    `- Test file count: ${snapshot.testFileCount}`,
    `- Command file count: ${snapshot.commandFileCount}`,
    `- CI config present: ${snapshot.ciConfigPresent ? "yes" : "no"}`,
    "",
    "## Documentation Signals",
    `- Architecture doc: ${snapshot.docsPresent.architecture ? "yes" : "no"}`,
    `- Metrics spec: ${snapshot.docsPresent.metricsSpec ? "yes" : "no"}`,
    `- Executive one-pager: ${snapshot.docsPresent.executiveOnePager ? "yes" : "no"}`,
    "",
    "## BRD KPI Snapshot",
    `- Time to first feature (hours): ${snapshot.kpi.timeToFirstFeatureHours ?? "pending data"}`,
    `- CI pass rate before merge (%): ${snapshot.kpi.ciPassRateBeforeMergePercent ?? "pending data"}`,
    `- Setup hours saved: ${snapshot.kpi.setupHoursSaved ?? "pending baseline"}`,
    `- Median merge friction (hours): ${snapshot.kpi.mergeFrictionMedianHours ?? "pending data"}`,
    "",
    "## Notes",
    ...snapshot.notes.map((note) => `- ${note}`),
    ""
  ].join("\n");
}

async function collectSnapshot(cwd: string): Promise<MetricsSnapshot> {
  const generatedAt = new Date().toISOString();
  const branch = await runGitCommand(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const totalCommits = toNumberOrNull(await runGitCommand(cwd, ["rev-list", "--count", "HEAD"]));
  const commitsLast30Days = toNumberOrNull(
    await runGitCommand(cwd, ["rev-list", "--count", "--since=30 days ago", "HEAD"])
  );

  const testFileCount = await countFilesRecursively(resolve(cwd, "tests"), ".ts");
  const commandFileCount = await countFilesRecursively(resolve(cwd, "src", "commands"), ".ts");

  const docsArchitecturePath = resolve(cwd, "docs", "architecture.md");
  const docsMetricsPath = resolve(cwd, "docs", "metrics-dashboard-spec.md");
  const docsExecPath = resolve(cwd, "docs", "executive-one-pager.md");
  const ciPath = resolve(cwd, ".github", "workflows", "ci.yml");

  const [architectureStat, metricsStat, execStat, ciStat] = await Promise.all([
    stat(docsArchitecturePath).catch(() => null),
    stat(docsMetricsPath).catch(() => null),
    stat(docsExecPath).catch(() => null),
    stat(ciPath).catch(() => null)
  ]);

  const notes: string[] = [];

  if (branch === null) {
    notes.push(
      "Git metadata unavailable. Run this command inside a git repository for commit KPIs."
    );
  }

  notes.push("CI pass rate before merge requires GitHub workflow API ingestion (not yet wired).");
  notes.push(
    "Time-to-first-feature and merge friction require PR timestamp extraction (not yet wired)."
  );
  notes.push("Setup-hours-saved requires a validated baseline from historical projects.");

  return {
    generatedAt,
    repositoryRoot: cwd,
    branch,
    totalCommits,
    commitsLast30Days,
    testFileCount,
    commandFileCount,
    ciConfigPresent: ciStat !== null,
    docsPresent: {
      architecture: architectureStat !== null,
      metricsSpec: metricsStat !== null,
      executiveOnePager: execStat !== null
    },
    kpi: {
      timeToFirstFeatureHours: null,
      ciPassRateBeforeMergePercent: null,
      setupHoursSaved: null,
      mergeFrictionMedianHours: null
    },
    notes
  };
}

function buildSnapshotFileStem(generatedAtIso: string): string {
  return generatedAtIso.replace(/[:]/g, "-").replace(/\..+$/, "");
}

export async function runMetricsCommand(args: string[], cwd: string): Promise<CliResult> {
  const parsed = parseMetricsArgs(args);
  if (parsed.error) {
    return {
      exitCode: 1,
      stream: "stderr",
      message: [
        parsed.error,
        "Usage: agent-alpha metrics snapshot [--path <target>] [--format markdown|json|both]"
      ].join("\n")
    };
  }

  const options = parsed.options as MetricsSnapshotOptions;
  const snapshot = await collectSnapshot(cwd);

  const targetDir = resolve(cwd, options.outputPath);
  await mkdir(targetDir, { recursive: true });

  const fileStem = `metrics-snapshot-${buildSnapshotFileStem(snapshot.generatedAt)}`;
  const writtenFiles: string[] = [];

  if (options.format === "json" || options.format === "both") {
    const jsonPath = resolve(targetDir, `${fileStem}.json`);
    await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    writtenFiles.push(jsonPath);
  }

  if (options.format === "markdown" || options.format === "both") {
    const markdownPath = resolve(targetDir, `${fileStem}.md`);
    await writeFile(markdownPath, buildMarkdownSnapshot(snapshot), "utf8");
    writtenFiles.push(markdownPath);
  }

  return {
    exitCode: 0,
    stream: "stdout",
    message: [
      "Metrics snapshot generated.",
      ...writtenFiles.map((path) => `- ${relative(cwd, path) || path}`)
    ].join("\n")
  };
}
