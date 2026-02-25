import { collectGithubSignals } from "./collect-github";
import { collectLocalSignals } from "./collect-local";
import { calculateKpiSnapshot } from "./kpi";
import type { SnapshotReportBuildResult, SnapshotReportOptions } from "./types";
import { writeSnapshotReportArtifacts } from "./write";

function dedupeNotes(notes: string[]): string[] {
  return Array.from(new Set(notes));
}

export async function buildSnapshotReport(
  cwd: string,
  options: SnapshotReportOptions
): Promise<SnapshotReportBuildResult> {
  const local = await collectLocalSignals(cwd, options.windowDays);
  const github = await collectGithubSignals(cwd, options.windowDays, options.repoOverride);

  const kpi = calculateKpiSnapshot(
    github.workflowRunsInWindow,
    github.mergedPullsInWindow,
    local.repoActivity.firstCommitAt,
    github.firstProductionFeatureMergedAt
  );

  const notes = [...local.notes, ...github.notes];

  if (!github.enabled) {
    notes.push(`GitHub enrichment unavailable: ${github.reason ?? "unknown reason"}`);
  }

  if (kpi.ciPassRateBeforeMergePercent === null) {
    notes.push("CI pass rate before merge is unavailable for this run.");
  }

  if (kpi.mergeFrictionMedianHours === null) {
    notes.push("Merge friction median is unavailable for this run.");
  }

  if (kpi.timeToFirstFeatureHours === null) {
    notes.push("Time to first feature is unavailable for this run.");
  }

  notes.push("setup-hours-saved is deferred in v0 and intentionally omitted from this report.");

  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      repositoryRoot: cwd,
      branch: local.branch,
      windowDays: options.windowDays,
      dataSources: {
        local: true,
        github: github.enabled,
        repository: github.repository,
        githubReason: github.reason
      }
    },
    signals: {
      commandFileCount: local.commandFileCount,
      testFileCount: local.testFileCount,
      docsPresent: local.docsPresent,
      ciConfigPresent: local.ciConfigPresent,
      repoActivity: local.repoActivity,
      githubActivity: {
        workflowRunsEvaluated: github.enabled ? github.workflowRunsInWindow.length : null,
        mergedPullsEvaluated: github.enabled ? github.mergedPullsInWindow.length : null
      }
    },
    kpi,
    notes: dedupeNotes(notes)
  };

  const writtenFiles = await writeSnapshotReportArtifacts(
    report,
    cwd,
    options.outputPath,
    options.format
  );

  return {
    report,
    writtenFiles
  };
}
