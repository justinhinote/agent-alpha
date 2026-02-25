import { describe, expect, it } from "vitest";

import { parseSnapshotReportArgs } from "../../src/commands/snapshot-report";

describe("parseSnapshotReportArgs", () => {
  it("returns defaults when no options are provided", () => {
    const parsed = parseSnapshotReportArgs([]);

    expect(parsed.error).toBeUndefined();
    expect(parsed.options).toEqual({
      outputPath: "docs/reports",
      format: "both",
      windowDays: 30,
      repoOverride: undefined
    });
  });

  it("accepts valid explicit options", () => {
    const parsed = parseSnapshotReportArgs([
      "--path",
      "reports",
      "--format",
      "json",
      "--window-days",
      "14",
      "--repo",
      "queen-cityai/agent-alpha"
    ]);

    expect(parsed.error).toBeUndefined();
    expect(parsed.options).toEqual({
      outputPath: "reports",
      format: "json",
      windowDays: 14,
      repoOverride: "queen-cityai/agent-alpha"
    });
  });

  it("fails on invalid format", () => {
    const parsed = parseSnapshotReportArgs(["--format", "xml"]);

    expect(parsed.error).toContain("--format");
  });

  it("fails when --path has no value", () => {
    const parsed = parseSnapshotReportArgs(["--path"]);

    expect(parsed.error).toContain("--path");
  });

  it("fails when --window-days value is out of range", () => {
    const parsed = parseSnapshotReportArgs(["--window-days", "0"]);

    expect(parsed.error).toContain("--window-days");
  });

  it("fails when --window-days value is non-integer", () => {
    const parsed = parseSnapshotReportArgs(["--window-days", "1.5"]);

    expect(parsed.error).toContain("--window-days");
  });

  it("fails when --repo has invalid shape", () => {
    const parsed = parseSnapshotReportArgs(["--repo", "not-a-slug"]);

    expect(parsed.error).toContain("--repo");
  });

  it("fails on unknown option", () => {
    const parsed = parseSnapshotReportArgs(["--mystery"]);

    expect(parsed.error).toContain("Unknown option");
  });
});
