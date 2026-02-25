import type { GithubMergedPull, GithubWorkflowRun, SnapshotReportKpi } from "./types";

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateCiPassRateBeforeMergePercent(
  workflowRuns: GithubWorkflowRun[]
): number | null {
  if (workflowRuns.length === 0) {
    return null;
  }

  const completedRuns = workflowRuns.filter((run) => run.conclusion !== null);
  if (completedRuns.length === 0) {
    return null;
  }

  const passingRuns = completedRuns.filter((run) => run.conclusion === "success").length;
  return roundToTwo((passingRuns / completedRuns.length) * 100);
}

export function calculateMergeFrictionMedianHours(mergedPulls: GithubMergedPull[]): number | null {
  if (mergedPulls.length === 0) {
    return null;
  }

  const durations = mergedPulls
    .map((pull) => {
      const createdAt = Date.parse(pull.createdAt);
      const mergedAt = Date.parse(pull.mergedAt);

      if (Number.isNaN(createdAt) || Number.isNaN(mergedAt) || mergedAt < createdAt) {
        return null;
      }

      return (mergedAt - createdAt) / (1000 * 60 * 60);
    })
    .filter((duration): duration is number => duration !== null)
    .sort((left, right) => left - right);

  if (durations.length === 0) {
    return null;
  }

  const middle = Math.floor(durations.length / 2);
  if (durations.length % 2 === 1) {
    return roundToTwo(durations[middle]);
  }

  return roundToTwo((durations[middle - 1] + durations[middle]) / 2);
}

export function calculateTimeToFirstFeatureHours(
  firstCommitAt: string | null,
  firstProductionFeatureMergedAt: string | null
): number | null {
  if (!firstCommitAt || !firstProductionFeatureMergedAt) {
    return null;
  }

  const firstCommitTimestamp = Date.parse(firstCommitAt);
  const firstFeatureTimestamp = Date.parse(firstProductionFeatureMergedAt);

  if (
    Number.isNaN(firstCommitTimestamp) ||
    Number.isNaN(firstFeatureTimestamp) ||
    firstFeatureTimestamp < firstCommitTimestamp
  ) {
    return null;
  }

  return roundToTwo((firstFeatureTimestamp - firstCommitTimestamp) / (1000 * 60 * 60));
}

export function calculateKpiSnapshot(
  workflowRuns: GithubWorkflowRun[],
  mergedPulls: GithubMergedPull[],
  firstCommitAt: string | null,
  firstProductionFeatureMergedAt: string | null
): SnapshotReportKpi {
  return {
    ciPassRateBeforeMergePercent: calculateCiPassRateBeforeMergePercent(workflowRuns),
    mergeFrictionMedianHours: calculateMergeFrictionMedianHours(mergedPulls),
    timeToFirstFeatureHours: calculateTimeToFirstFeatureHours(
      firstCommitAt,
      firstProductionFeatureMergedAt
    )
  };
}
