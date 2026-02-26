import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildSnapshotTrend } from "../../src/lib/snapshot-report/trend";
import type { SnapshotReport } from "../../src/lib/snapshot-report/types";

async function withTempDir<T>(execute: (path: string) => Promise<T>): Promise<T> {
  const path = await mkdtemp(join(tmpdir(), "snapshot-trend-test-"));
  try {
    return await execute(path);
  } finally {
    await rm(path, { recursive: true, force: true });
  }
}

function createReport(generatedAt: string, commandCount = 4, ciPassRate = 95): SnapshotReport {
  return {
    metadata: {
      generatedAt,
      repositoryRoot: "/tmp/repo",
      branch: "main",
      windowDays: 30,
      dataSources: {
        local: true,
        github: false,
        repository: "owner/repo",
        githubReason: "auth unavailable"
      }
    },
    signals: {
      commandFileCount: commandCount,
      testFileCount: 10,
      docsPresent: {
        architecture: true,
        metricsSpec: true,
        executiveOnePager: true
      },
      ciConfigPresent: true,
      repoActivity: {
        totalCommits: 100,
        commitsInWindow: 8,
        firstCommitAt: "2026-01-01T00:00:00Z"
      },
      githubActivity: {
        workflowRunsEvaluated: 0,
        mergedPullsEvaluated: 0
      }
    },
    kpi: {
      timeToFirstFeatureHours: 24,
      ciPassRateBeforeMergePercent: ciPassRate,
      mergeFrictionMedianHours: 12
    },
    trend: {
      previousSnapshot: null,
      deltas: {
        timeToFirstFeatureHours: { previous: null, current: 24, delta: null, direction: "na" },
        ciPassRateBeforeMergePercent: {
          previous: null,
          current: ciPassRate,
          delta: null,
          direction: "na"
        },
        mergeFrictionMedianHours: { previous: null, current: 12, delta: null, direction: "na" },
        commitsInWindow: { previous: null, current: 8, delta: null, direction: "na" },
        commandFileCount: { previous: null, current: commandCount, delta: null, direction: "na" },
        testFileCount: { previous: null, current: 10, delta: null, direction: "na" }
      }
    },
    notes: []
  };
}

describe("buildSnapshotTrend", () => {
  it("returns fallback trend when no previous snapshot exists", async () => {
    await withTempDir(async (cwd) => {
      const report = createReport("2026-02-25T00:00:00Z");

      const trend = await buildSnapshotTrend(report, cwd, "reports");

      expect(trend.previousSnapshot).toBeNull();
      expect(trend.deltas.commandFileCount.direction).toBe("na");
    });
  });

  it("computes trend deltas when a previous snapshot file exists", async () => {
    await withTempDir(async (cwd) => {
      const outputPath = join(cwd, "reports");
      await mkdir(outputPath, { recursive: true });

      const previous = createReport("2026-02-24T00:00:00Z", 3, 90);
      await writeFile(
        join(outputPath, "snapshot-report-2026-02-24T00-00-00.json"),
        `${JSON.stringify(previous, null, 2)}\n`,
        "utf8"
      );

      const current = createReport("2026-02-25T00:00:00Z", 5, 95);
      const trend = await buildSnapshotTrend(current, cwd, "reports");

      expect(trend.previousSnapshot?.generatedAt).toBe("2026-02-24T00:00:00Z");
      expect(trend.deltas.commandFileCount.delta).toBe(2);
      expect(trend.deltas.commandFileCount.direction).toBe("up");
      expect(trend.deltas.ciPassRateBeforeMergePercent.delta).toBe(5);
      expect(trend.deltas.ciPassRateBeforeMergePercent.direction).toBe("up");
    });
  });
});
