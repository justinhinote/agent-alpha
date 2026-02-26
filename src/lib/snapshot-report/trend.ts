import { readFile, readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";

import type { SnapshotNumericDelta, SnapshotReport, SnapshotReportTrend } from "./types";

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateNumericDelta(
  current: number | null,
  previous: number | null
): SnapshotNumericDelta {
  if (current === null || previous === null) {
    return {
      previous,
      current,
      delta: null,
      direction: "na"
    };
  }

  const delta = roundToTwo(current - previous);
  const direction = delta === 0 ? "flat" : delta > 0 ? "up" : "down";

  return {
    previous,
    current,
    delta,
    direction
  };
}

function fallbackTrend(report: SnapshotReport): SnapshotReportTrend {
  return {
    previousSnapshot: null,
    deltas: {
      timeToFirstFeatureHours: calculateNumericDelta(report.kpi.timeToFirstFeatureHours, null),
      ciPassRateBeforeMergePercent: calculateNumericDelta(
        report.kpi.ciPassRateBeforeMergePercent,
        null
      ),
      mergeFrictionMedianHours: calculateNumericDelta(report.kpi.mergeFrictionMedianHours, null),
      commitsInWindow: calculateNumericDelta(report.signals.repoActivity.commitsInWindow, null),
      commandFileCount: calculateNumericDelta(report.signals.commandFileCount, null),
      testFileCount: calculateNumericDelta(report.signals.testFileCount, null)
    }
  };
}

interface SnapshotFileCandidate {
  fileName: string;
  report: SnapshotReport;
}

async function loadSnapshotFileCandidate(
  path: string,
  fileName: string
): Promise<SnapshotFileCandidate | null> {
  try {
    const content = await readFile(resolve(path, fileName), "utf8");
    const parsed = JSON.parse(content) as SnapshotReport;

    if (!parsed?.metadata?.generatedAt) {
      return null;
    }

    return {
      fileName,
      report: parsed
    };
  } catch {
    return null;
  }
}

async function findLatestSnapshot(outputDirectory: string): Promise<SnapshotFileCandidate | null> {
  let fileNames: string[] = [];

  try {
    fileNames = await readdir(outputDirectory, { encoding: "utf8" });
  } catch {
    return null;
  }

  const candidates = fileNames
    .filter((name) => /^snapshot-report-.*\.json$/.test(name))
    .sort((left, right) => right.localeCompare(left));

  for (const fileName of candidates) {
    const parsed = await loadSnapshotFileCandidate(outputDirectory, fileName);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

export async function buildSnapshotTrend(
  report: SnapshotReport,
  cwd: string,
  outputPath: string
): Promise<SnapshotReportTrend> {
  const outputDirectory = resolve(cwd, outputPath);
  const latestSnapshot = await findLatestSnapshot(outputDirectory);

  if (!latestSnapshot) {
    return fallbackTrend(report);
  }

  return {
    previousSnapshot: {
      generatedAt: latestSnapshot.report.metadata.generatedAt,
      filePath:
        relative(cwd, resolve(outputDirectory, latestSnapshot.fileName)) || latestSnapshot.fileName
    },
    deltas: {
      timeToFirstFeatureHours: calculateNumericDelta(
        report.kpi.timeToFirstFeatureHours,
        latestSnapshot.report.kpi.timeToFirstFeatureHours
      ),
      ciPassRateBeforeMergePercent: calculateNumericDelta(
        report.kpi.ciPassRateBeforeMergePercent,
        latestSnapshot.report.kpi.ciPassRateBeforeMergePercent
      ),
      mergeFrictionMedianHours: calculateNumericDelta(
        report.kpi.mergeFrictionMedianHours,
        latestSnapshot.report.kpi.mergeFrictionMedianHours
      ),
      commitsInWindow: calculateNumericDelta(
        report.signals.repoActivity.commitsInWindow,
        latestSnapshot.report.signals.repoActivity.commitsInWindow
      ),
      commandFileCount: calculateNumericDelta(
        report.signals.commandFileCount,
        latestSnapshot.report.signals.commandFileCount
      ),
      testFileCount: calculateNumericDelta(
        report.signals.testFileCount,
        latestSnapshot.report.signals.testFileCount
      )
    }
  };
}
