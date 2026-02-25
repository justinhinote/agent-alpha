import { execFile } from "node:child_process";
import type { Dirent } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

import type { LocalCollection } from "./types";

const execFileAsync = promisify(execFile);

async function runGitCommand(cwd: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd });
    const value = stdout.trim();
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function parseNumber(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function countFilesRecursively(basePath: string, extension: string): Promise<number> {
  async function walk(currentPath: string): Promise<number> {
    let entries: Dirent<string>[] = [];

    try {
      entries = await readdir(currentPath, { withFileTypes: true, encoding: "utf8" });
    } catch {
      return 0;
    }

    let total = 0;
    for (const entry of entries) {
      const entryPath = resolve(currentPath, entry.name);

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

export async function collectLocalSignals(
  cwd: string,
  windowDays: number
): Promise<LocalCollection> {
  const cutoffIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const [
    branch,
    totalCommitsRaw,
    commitsInWindowRaw,
    firstCommitAt,
    commandFileCount,
    testFileCount
  ] = await Promise.all([
    runGitCommand(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]),
    runGitCommand(cwd, ["rev-list", "--count", "HEAD"]),
    runGitCommand(cwd, ["rev-list", "--count", `--since=${cutoffIso}`, "HEAD"]),
    runGitCommand(cwd, ["log", "--reverse", "--format=%cI", "--max-count=1"]),
    countFilesRecursively(resolve(cwd, "src", "commands"), ".ts"),
    countFilesRecursively(resolve(cwd, "tests"), ".ts")
  ]);

  const docsPaths = {
    architecture: resolve(cwd, "docs", "architecture.md"),
    metricsSpec: resolve(cwd, "docs", "metrics-dashboard-spec.md"),
    executiveOnePager: resolve(cwd, "docs", "executive-one-pager.md"),
    ciConfig: resolve(cwd, ".github", "workflows", "ci.yml")
  };

  const [architectureDoc, metricsDoc, executiveDoc, ciFile] = await Promise.all([
    stat(docsPaths.architecture).catch(() => null),
    stat(docsPaths.metricsSpec).catch(() => null),
    stat(docsPaths.executiveOnePager).catch(() => null),
    stat(docsPaths.ciConfig).catch(() => null)
  ]);

  const notes: string[] = [];
  if (branch === null) {
    notes.push("Git metadata is unavailable in the current directory.");
  }

  return {
    branch,
    commandFileCount,
    testFileCount,
    docsPresent: {
      architecture: architectureDoc !== null,
      metricsSpec: metricsDoc !== null,
      executiveOnePager: executiveDoc !== null
    },
    ciConfigPresent: ciFile !== null,
    repoActivity: {
      totalCommits: parseNumber(totalCommitsRaw),
      commitsInWindow: parseNumber(commitsInWindowRaw),
      firstCommitAt
    },
    notes
  };
}
