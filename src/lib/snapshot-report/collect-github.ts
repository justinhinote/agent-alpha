import { execFile } from "node:child_process";
import { basename } from "node:path";
import { promisify } from "node:util";

import type { GithubCollection, GithubMergedPull, GithubWorkflowRun } from "./types";

const execFileAsync = promisify(execFile);

const SCAFFOLD_COMMAND_NAMES = new Set(["init", "generate-command", "metrics", "registry"]);

interface WorkflowRunsResponse {
  workflow_runs?: Array<{
    conclusion?: string | null;
    created_at?: string;
  }>;
}

interface PullSummary {
  number: number;
  title: string;
  created_at: string;
  merged_at: string | null;
  html_url: string;
}

interface PullFileSummary {
  filename: string;
}

function isValidRepoSlug(value: string): boolean {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value);
}

function parseGithubSlugFromRemote(remoteUrl: string): string | null {
  const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/i);
  if (!match) {
    return null;
  }

  const [, owner, repo] = match;
  const slug = `${owner}/${repo}`;
  return isValidRepoSlug(slug) ? slug : null;
}

async function commandSucceeds(command: string, args: string[], cwd: string): Promise<boolean> {
  try {
    await execFileAsync(command, args, { cwd });
    return true;
  } catch {
    return false;
  }
}

async function runCommand(command: string, args: string[], cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(command, args, {
      cwd,
      maxBuffer: 10 * 1024 * 1024
    });
    const output = stdout.trim();
    return output.length > 0 ? output : null;
  } catch {
    return null;
  }
}

async function runGhApi<T>(endpoint: string, cwd: string): Promise<T> {
  const { stdout } = await execFileAsync(
    "gh",
    ["api", "-H", "Accept: application/vnd.github+json", endpoint],
    {
      cwd,
      maxBuffer: 10 * 1024 * 1024
    }
  );

  return JSON.parse(stdout) as T;
}

async function resolveRepositorySlug(cwd: string, repoOverride?: string): Promise<string | null> {
  if (repoOverride) {
    return isValidRepoSlug(repoOverride) ? repoOverride : null;
  }

  const remoteUrl = await runCommand("git", ["remote", "get-url", "origin"], cwd);
  if (!remoteUrl) {
    return null;
  }

  return parseGithubSlugFromRemote(remoteUrl);
}

async function collectWorkflowRuns(
  repository: string,
  cutoffIso: string,
  cwd: string
): Promise<GithubWorkflowRun[]> {
  const response = await runGhApi<WorkflowRunsResponse>(
    `repos/${repository}/actions/runs?event=pull_request&status=completed&per_page=100`,
    cwd
  );

  const runs = response.workflow_runs ?? [];

  return runs
    .filter((run) => typeof run.created_at === "string")
    .filter((run) => (run.created_at as string) >= cutoffIso)
    .map((run) => ({
      conclusion: run.conclusion ?? null,
      createdAt: run.created_at as string
    }));
}

async function collectMergedPullsInWindow(
  repository: string,
  cutoffIso: string,
  cwd: string
): Promise<GithubMergedPull[]> {
  const pulls = await runGhApi<PullSummary[]>(
    `repos/${repository}/pulls?state=closed&sort=updated&direction=desc&per_page=100`,
    cwd
  );

  return pulls
    .filter((pull) => pull.merged_at !== null)
    .filter((pull) => (pull.merged_at as string) >= cutoffIso)
    .map((pull) => ({
      number: pull.number,
      title: pull.title,
      createdAt: pull.created_at,
      mergedAt: pull.merged_at as string,
      url: pull.html_url
    }));
}

function extractCommandNamesFromFiles(files: PullFileSummary[]): string[] {
  const names = files
    .filter((file) => file.filename.startsWith("src/commands/") && file.filename.endsWith(".ts"))
    .map((file) => basename(file.filename, ".ts"));

  return Array.from(new Set(names));
}

async function findFirstProductionFeatureMergedAt(
  repository: string,
  cwd: string
): Promise<{ mergedAt: string | null; notes: string[] }> {
  const notes: string[] = [];
  const maxPages = 3;
  const perPage = 20;
  let scannedMergedPulls = 0;

  for (let page = 1; page <= maxPages; page += 1) {
    const pulls = await runGhApi<PullSummary[]>(
      `repos/${repository}/pulls?state=closed&sort=created&direction=asc&per_page=${perPage}&page=${page}`,
      cwd
    );

    if (pulls.length === 0) {
      break;
    }

    for (const pull of pulls) {
      if (!pull.merged_at) {
        continue;
      }

      scannedMergedPulls += 1;

      const pullFiles = await runGhApi<PullFileSummary[]>(
        `repos/${repository}/pulls/${pull.number}/files?per_page=100`,
        cwd
      );

      const changedCommandNames = extractCommandNamesFromFiles(pullFiles);
      if (changedCommandNames.length === 0) {
        continue;
      }

      const hasNonScaffoldCommand = changedCommandNames.some(
        (commandName) => !SCAFFOLD_COMMAND_NAMES.has(commandName)
      );

      if (hasNonScaffoldCommand) {
        return {
          mergedAt: pull.merged_at,
          notes
        };
      }
    }
  }

  notes.push(
    "No merged pull request with non-scaffold command changes was found in the scanned history window."
  );
  notes.push(
    `First-feature detection scanned up to ${scannedMergedPulls} merged pull requests across ${maxPages} pages.`
  );

  return {
    mergedAt: null,
    notes
  };
}

export async function collectGithubSignals(
  cwd: string,
  windowDays: number,
  repoOverride?: string
): Promise<GithubCollection> {
  const notes: string[] = [];
  const cutoffIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const repository = await resolveRepositorySlug(cwd, repoOverride);
  if (!repository) {
    return {
      enabled: false,
      repository: null,
      reason: repoOverride
        ? "Provided --repo value is invalid. Expected owner/name."
        : "GitHub repository slug could not be resolved from origin remote.",
      workflowRunsInWindow: [],
      mergedPullsInWindow: [],
      firstProductionFeatureMergedAt: null,
      notes
    };
  }

  const ghInstalled = await commandSucceeds("gh", ["--version"], cwd);
  if (!ghInstalled) {
    return {
      enabled: false,
      repository,
      reason: "GitHub CLI (gh) is not installed.",
      workflowRunsInWindow: [],
      mergedPullsInWindow: [],
      firstProductionFeatureMergedAt: null,
      notes
    };
  }

  const ghAuthenticated = await commandSucceeds("gh", ["auth", "status", "-h", "github.com"], cwd);
  if (!ghAuthenticated) {
    return {
      enabled: false,
      repository,
      reason: "GitHub CLI is not authenticated for github.com.",
      workflowRunsInWindow: [],
      mergedPullsInWindow: [],
      firstProductionFeatureMergedAt: null,
      notes
    };
  }

  try {
    const [workflowRunsInWindow, mergedPullsInWindow, firstFeature] = await Promise.all([
      collectWorkflowRuns(repository, cutoffIso, cwd),
      collectMergedPullsInWindow(repository, cutoffIso, cwd),
      findFirstProductionFeatureMergedAt(repository, cwd)
    ]);

    notes.push(...firstFeature.notes);

    return {
      enabled: true,
      repository,
      reason: null,
      workflowRunsInWindow,
      mergedPullsInWindow,
      firstProductionFeatureMergedAt: firstFeature.mergedAt,
      notes
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      enabled: false,
      repository,
      reason: `GitHub API queries failed: ${message}`,
      workflowRunsInWindow: [],
      mergedPullsInWindow: [],
      firstProductionFeatureMergedAt: null,
      notes
    };
  }
}
