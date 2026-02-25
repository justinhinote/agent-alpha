import type { SnapshotReport } from "./types";

export function renderSnapshotReportMarkdown(report: SnapshotReport): string {
  const lines = [
    "# Snapshot Report",
    "",
    `Generated At: ${report.metadata.generatedAt}`,
    `Repository Root: ${report.metadata.repositoryRoot}`,
    `Window (days): ${report.metadata.windowDays}`,
    "",
    "## Data Sources",
    `- Local: ${report.metadata.dataSources.local ? "yes" : "no"}`,
    `- GitHub: ${report.metadata.dataSources.github ? "yes" : "no"}`,
    `- Repository: ${report.metadata.dataSources.repository ?? "n/a"}`,
    `- GitHub status: ${report.metadata.dataSources.githubReason ?? "connected"}`,
    "",
    "## Signals",
    `- Branch: ${report.metadata.branch ?? "n/a"}`,
    `- Command file count: ${report.signals.commandFileCount}`,
    `- Test file count: ${report.signals.testFileCount}`,
    `- CI config present: ${report.signals.ciConfigPresent ? "yes" : "no"}`,
    `- Architecture doc present: ${report.signals.docsPresent.architecture ? "yes" : "no"}`,
    `- Metrics spec present: ${report.signals.docsPresent.metricsSpec ? "yes" : "no"}`,
    `- Executive one-pager present: ${report.signals.docsPresent.executiveOnePager ? "yes" : "no"}`,
    `- Total commits: ${report.signals.repoActivity.totalCommits ?? "n/a"}`,
    `- Commits in window: ${report.signals.repoActivity.commitsInWindow ?? "n/a"}`,
    `- Workflow runs evaluated: ${report.signals.githubActivity.workflowRunsEvaluated ?? "n/a"}`,
    `- Merged PRs evaluated: ${report.signals.githubActivity.mergedPullsEvaluated ?? "n/a"}`,
    "",
    "## KPI Snapshot",
    `- Time to first feature (hours): ${report.kpi.timeToFirstFeatureHours ?? "pending data"}`,
    `- CI pass rate before merge (%): ${report.kpi.ciPassRateBeforeMergePercent ?? "pending data"}`,
    `- Merge friction median (hours): ${report.kpi.mergeFrictionMedianHours ?? "pending data"}`,
    "",
    "## Notes",
    ...report.notes.map((note) => `- ${note}`),
    ""
  ];

  return lines.join("\n");
}
