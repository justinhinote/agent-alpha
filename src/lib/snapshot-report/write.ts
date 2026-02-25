import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { SnapshotReport, SnapshotReportFormat } from "./types";
import { renderSnapshotReportMarkdown } from "./render";

function buildFileStem(generatedAtIso: string): string {
  return generatedAtIso.replace(/[:]/g, "-").replace(/\..+$/, "");
}

export async function writeSnapshotReportArtifacts(
  report: SnapshotReport,
  cwd: string,
  outputPath: string,
  format: SnapshotReportFormat
): Promise<string[]> {
  const targetDir = resolve(cwd, outputPath);
  await mkdir(targetDir, { recursive: true });

  const fileStem = `snapshot-report-${buildFileStem(report.metadata.generatedAt)}`;
  const writtenFiles: string[] = [];

  if (format === "json" || format === "both") {
    const jsonPath = resolve(targetDir, `${fileStem}.json`);
    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    writtenFiles.push(jsonPath);
  }

  if (format === "markdown" || format === "both") {
    const markdownPath = resolve(targetDir, `${fileStem}.md`);
    await writeFile(markdownPath, renderSnapshotReportMarkdown(report), "utf8");
    writtenFiles.push(markdownPath);
  }

  return writtenFiles;
}
