import { describe, expect, it } from "vitest";

import {
  calculateCiPassRateBeforeMergePercent,
  calculateKpiSnapshot,
  calculateMergeFrictionMedianHours,
  calculateTimeToFirstFeatureHours
} from "../../src/lib/snapshot-report/kpi";

describe("snapshot-report KPI calculations", () => {
  it("calculates CI pass rate from completed workflow runs", () => {
    const result = calculateCiPassRateBeforeMergePercent([
      { conclusion: "success", createdAt: "2026-01-01T00:00:00Z" },
      { conclusion: "failure", createdAt: "2026-01-02T00:00:00Z" },
      { conclusion: "success", createdAt: "2026-01-03T00:00:00Z" }
    ]);

    expect(result).toBe(66.67);
  });

  it("returns null CI pass rate when no runs are provided", () => {
    expect(calculateCiPassRateBeforeMergePercent([])).toBeNull();
  });

  it("calculates median merge friction hours for odd set", () => {
    const result = calculateMergeFrictionMedianHours([
      {
        number: 1,
        title: "a",
        createdAt: "2026-01-01T00:00:00Z",
        mergedAt: "2026-01-01T06:00:00Z",
        url: "x"
      },
      {
        number: 2,
        title: "b",
        createdAt: "2026-01-01T00:00:00Z",
        mergedAt: "2026-01-01T03:00:00Z",
        url: "x"
      },
      {
        number: 3,
        title: "c",
        createdAt: "2026-01-01T00:00:00Z",
        mergedAt: "2026-01-01T09:00:00Z",
        url: "x"
      }
    ]);

    expect(result).toBe(6);
  });

  it("calculates median merge friction hours for even set", () => {
    const result = calculateMergeFrictionMedianHours([
      {
        number: 1,
        title: "a",
        createdAt: "2026-01-01T00:00:00Z",
        mergedAt: "2026-01-01T02:00:00Z",
        url: "x"
      },
      {
        number: 2,
        title: "b",
        createdAt: "2026-01-01T00:00:00Z",
        mergedAt: "2026-01-01T06:00:00Z",
        url: "x"
      }
    ]);

    expect(result).toBe(4);
  });

  it("returns null time-to-first-feature when timestamps are missing", () => {
    expect(calculateTimeToFirstFeatureHours(null, "2026-01-01T00:00:00Z")).toBeNull();
    expect(calculateTimeToFirstFeatureHours("2026-01-01T00:00:00Z", null)).toBeNull();
  });

  it("calculates time-to-first-feature in hours", () => {
    const result = calculateTimeToFirstFeatureHours("2026-01-01T00:00:00Z", "2026-01-02T12:00:00Z");

    expect(result).toBe(36);
  });

  it("builds full KPI snapshot", () => {
    const kpi = calculateKpiSnapshot(
      [{ conclusion: "success", createdAt: "2026-01-01T00:00:00Z" }],
      [
        {
          number: 1,
          title: "feature",
          createdAt: "2026-01-01T00:00:00Z",
          mergedAt: "2026-01-01T08:00:00Z",
          url: "x"
        }
      ],
      "2026-01-01T00:00:00Z",
      "2026-01-02T00:00:00Z"
    );

    expect(kpi).toEqual({
      ciPassRateBeforeMergePercent: 100,
      mergeFrictionMedianHours: 8,
      timeToFirstFeatureHours: 24
    });
  });
});
