export type SnapshotReportFormat = "markdown" | "json" | "both";

export interface SnapshotReportOptions {
  outputPath: string;
  format: SnapshotReportFormat;
  windowDays: number;
  repoOverride?: string;
}

export interface SnapshotReportMetadata {
  generatedAt: string;
  repositoryRoot: string;
  branch: string | null;
  windowDays: number;
  dataSources: {
    local: boolean;
    github: boolean;
    repository: string | null;
    githubReason: string | null;
  };
}

export interface SnapshotReportSignals {
  commandFileCount: number;
  testFileCount: number;
  docsPresent: {
    architecture: boolean;
    metricsSpec: boolean;
    executiveOnePager: boolean;
  };
  ciConfigPresent: boolean;
  repoActivity: {
    totalCommits: number | null;
    commitsInWindow: number | null;
    firstCommitAt: string | null;
  };
  githubActivity: {
    workflowRunsEvaluated: number | null;
    mergedPullsEvaluated: number | null;
  };
}

export interface SnapshotReportKpi {
  timeToFirstFeatureHours: number | null;
  ciPassRateBeforeMergePercent: number | null;
  mergeFrictionMedianHours: number | null;
}

export interface SnapshotReport {
  metadata: SnapshotReportMetadata;
  signals: SnapshotReportSignals;
  kpi: SnapshotReportKpi;
  notes: string[];
}

export interface LocalCollection {
  branch: string | null;
  commandFileCount: number;
  testFileCount: number;
  docsPresent: SnapshotReportSignals["docsPresent"];
  ciConfigPresent: boolean;
  repoActivity: SnapshotReportSignals["repoActivity"];
  notes: string[];
}

export interface GithubWorkflowRun {
  conclusion: string | null;
  createdAt: string;
}

export interface GithubMergedPull {
  number: number;
  title: string;
  createdAt: string;
  mergedAt: string;
  url: string;
}

export interface GithubCollection {
  enabled: boolean;
  repository: string | null;
  reason: string | null;
  workflowRunsInWindow: GithubWorkflowRun[];
  mergedPullsInWindow: GithubMergedPull[];
  firstProductionFeatureMergedAt: string | null;
  notes: string[];
}

export interface SnapshotReportBuildResult {
  report: SnapshotReport;
  writtenFiles: string[];
}
