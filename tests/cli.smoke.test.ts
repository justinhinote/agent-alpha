import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { runCli } from "../src/index";
import type { CliIO } from "../src/types/cli";

function createTestIo(version = "0.1.0-test"): {
  io: CliIO;
  stdout: string[];
  stderr: string[];
} {
  const stdout: string[] = [];
  const stderr: string[] = [];

  return {
    io: {
      version,
      writeStdout: (text: string) => {
        stdout.push(text);
      },
      writeStderr: (text: string) => {
        stderr.push(text);
      }
    },
    stdout,
    stderr
  };
}

async function withTempDir<T>(execute: (dirPath: string) => Promise<T>): Promise<T> {
  const dirPath = await mkdtemp(join(tmpdir(), "agent-alpha-test-"));
  try {
    return await execute(dirPath);
  } finally {
    await rm(dirPath, { recursive: true, force: true });
  }
}

describe("runCli", () => {
  it("returns help output for --help", async () => {
    const { io, stdout, stderr } = createTestIo();

    const exitCode = await runCli(["--help"], io);

    expect(exitCode).toBe(0);
    expect(stdout.join("")).toContain("Usage: agent-alpha <command> [options]");
    expect(stdout.join("")).toContain("snapshot-report");
    expect(stderr).toHaveLength(0);
  });

  it("supports a leading double-dash passthrough token", async () => {
    const { io, stdout, stderr } = createTestIo();

    const exitCode = await runCli(["--", "--help"], io);

    expect(exitCode).toBe(0);
    expect(stdout.join("")).toContain("Usage: agent-alpha <command> [options]");
    expect(stderr).toHaveLength(0);
  });

  it("returns version output for --version", async () => {
    const { io, stdout, stderr } = createTestIo("9.9.9");

    const exitCode = await runCli(["--version"], io);

    expect(exitCode).toBe(0);
    expect(stdout.join("").trim()).toBe("9.9.9");
    expect(stderr).toHaveLength(0);
  });

  it("returns command-specific help", async () => {
    const { io, stdout, stderr } = createTestIo();

    const exitCode = await runCli(["snapshot-report", "--help"], io);

    expect(exitCode).toBe(0);
    expect(stdout.join("")).toContain("Usage: agent-alpha snapshot-report");
    expect(stderr).toHaveLength(0);
  });

  it("fails unknown commands with actionable guidance", async () => {
    const { io, stdout, stderr } = createTestIo();

    const exitCode = await runCli(["unknown-cmd"], io);

    expect(exitCode).toBe(1);
    expect(stdout).toHaveLength(0);
    expect(stderr.join("")).toContain("Unknown command: unknown-cmd");
    expect(stderr.join("")).toContain("agent-alpha --help");
  });

  it("creates starter files with init", async () => {
    await withTempDir(async (dirPath) => {
      const { io, stderr } = createTestIo();

      const exitCode = await runCli(["init", "starter"], io, {
        cwd: () => dirPath
      });

      expect(exitCode).toBe(0);
      expect(stderr).toHaveLength(0);

      const packageJsonContent = await readFile(join(dirPath, "starter", "package.json"), "utf8");
      const packageJson = JSON.parse(packageJsonContent) as { name?: string };
      expect(packageJson.name).toBe("starter");

      const registryContent = await readFile(
        join(dirPath, "starter", "src", "commands", "registry.ts"),
        "utf8"
      );
      expect(registryContent).toContain("AUTO-GENERATED IMPORTS START");
      expect(registryContent).toContain("AUTO-GENERATED ENTRIES START");
    });
  });

  it("supports dry-run for init", async () => {
    await withTempDir(async (dirPath) => {
      const { io, stdout, stderr } = createTestIo();

      const exitCode = await runCli(["init", "dry-run-project", "--dry-run"], io, {
        cwd: () => dirPath
      });

      expect(exitCode).toBe(0);
      expect(stderr).toHaveLength(0);
      expect(stdout.join("")).toContain("Dry run");
      expect(stdout.join("")).toContain("src/commands/registry.ts");
    });
  });

  it("generates command skeleton files and updates command registry", async () => {
    await withTempDir(async (dirPath) => {
      const initIo = createTestIo();
      const generateIo = createTestIo();

      const initExitCode = await runCli(["init", "workspace"], initIo.io, {
        cwd: () => dirPath
      });
      expect(initExitCode).toBe(0);

      const exitCode = await runCli(
        ["generate", "command", "sync-reports", "--path", "workspace"],
        generateIo.io,
        {
          cwd: () => dirPath
        }
      );

      expect(exitCode).toBe(0);
      expect(generateIo.stderr).toHaveLength(0);

      const commandFile = await readFile(
        join(dirPath, "workspace", "src", "commands", "sync-reports.ts"),
        "utf8"
      );
      const commandTestFile = await readFile(
        join(dirPath, "workspace", "tests", "commands", "sync-reports.test.ts"),
        "utf8"
      );
      const registryFile = await readFile(
        join(dirPath, "workspace", "src", "commands", "registry.ts"),
        "utf8"
      );

      expect(commandFile).toContain("runSyncReportsCommand");
      expect(commandTestFile).toContain("runSyncReportsCommand");
      expect(registryFile).toContain('import { runSyncReportsCommand } from "./sync-reports";');
      expect(registryFile).toContain('name: "sync-reports"');
    });
  });

  it("rejects invalid generated command names", async () => {
    await withTempDir(async (dirPath) => {
      const { io, stdout, stderr } = createTestIo();

      const exitCode = await runCli(["generate", "command", "SyncReports"], io, {
        cwd: () => dirPath
      });

      expect(exitCode).toBe(1);
      expect(stdout).toHaveLength(0);
      expect(stderr.join("")).toContain("Invalid command name");
    });
  });

  it("detects collisions during command generation", async () => {
    await withTempDir(async (dirPath) => {
      const initIo = createTestIo();
      const initial = createTestIo();
      const duplicate = createTestIo();

      const initExitCode = await runCli(["init", "workspace"], initIo.io, {
        cwd: () => dirPath
      });
      expect(initExitCode).toBe(0);

      await runCli(["generate", "command", "sync-reports", "--path", "workspace"], initial.io, {
        cwd: () => dirPath
      });

      const exitCode = await runCli(
        ["generate", "command", "sync-reports", "--path", "workspace"],
        duplicate.io,
        {
          cwd: () => dirPath
        }
      );

      expect(exitCode).toBe(1);
      expect(duplicate.stderr.join("")).toContain("already exist");
    });
  });

  it("emits snapshot-report json with local-only fallback notes", async () => {
    await withTempDir(async (dirPath) => {
      const outputPath = join(dirPath, "reports");
      const { io, stdout, stderr } = createTestIo();

      const exitCode = await runCli(
        ["snapshot-report", "--path", outputPath, "--format", "json"],
        io,
        {
          cwd: () => dirPath
        }
      );

      expect(exitCode).toBe(0);
      expect(stderr).toHaveLength(0);
      expect(stdout.join("")).toContain("Snapshot report generated");

      const reportFiles = await readdir(outputPath);
      const jsonReport = reportFiles.find((fileName) => fileName.endsWith(".json"));
      expect(jsonReport).toBeDefined();

      const jsonContent = await readFile(join(outputPath, jsonReport as string), "utf8");
      const parsed = JSON.parse(jsonContent) as {
        metadata?: {
          dataSources?: {
            github?: boolean;
          };
        };
        notes?: string[];
        kpi?: Record<string, unknown>;
      };

      expect(parsed.metadata?.dataSources?.github).toBe(false);
      expect(parsed.kpi).toBeDefined();
      expect(parsed.notes?.some((note) => note.includes("GitHub enrichment unavailable"))).toBe(
        true
      );
    });
  });

  it("emits snapshot-report markdown and json in both mode", async () => {
    await withTempDir(async (dirPath) => {
      const outputPath = join(dirPath, "reports");
      const { io } = createTestIo();

      const exitCode = await runCli(
        ["snapshot-report", "--path", outputPath, "--format", "both"],
        io,
        {
          cwd: () => dirPath
        }
      );

      expect(exitCode).toBe(0);

      const reportFiles = await readdir(outputPath);
      expect(reportFiles.some((fileName) => fileName.endsWith(".json"))).toBe(true);
      expect(reportFiles.some((fileName) => fileName.endsWith(".md"))).toBe(true);
    });
  });

  it("includes trend/delta data when a previous snapshot exists", async () => {
    await withTempDir(async (dirPath) => {
      const outputPath = join(dirPath, "reports");
      const firstIo = createTestIo();
      const secondIo = createTestIo();

      const firstExitCode = await runCli(
        ["snapshot-report", "--path", outputPath, "--format", "json"],
        firstIo.io,
        {
          cwd: () => dirPath
        }
      );
      expect(firstExitCode).toBe(0);

      const secondExitCode = await runCli(
        ["snapshot-report", "--path", outputPath, "--format", "json"],
        secondIo.io,
        {
          cwd: () => dirPath
        }
      );
      expect(secondExitCode).toBe(0);
      expect(secondIo.stdout.join("")).toContain("Trend baseline:");

      const reportFiles = (await readdir(outputPath))
        .filter((name) => name.endsWith(".json"))
        .sort((left, right) => right.localeCompare(left));

      const latestReportContent = await readFile(join(outputPath, reportFiles[0]), "utf8");
      const latestReport = JSON.parse(latestReportContent) as {
        trend?: {
          previousSnapshot?: {
            generatedAt?: string;
          } | null;
          deltas?: {
            commandFileCount?: {
              direction?: string;
            };
          };
        };
      };

      expect(latestReport.trend?.previousSnapshot?.generatedAt).toBeTruthy();
      expect(latestReport.trend?.deltas?.commandFileCount?.direction).toBe("flat");
    });
  });

  it("supports metrics snapshot as a compatibility alias", async () => {
    await withTempDir(async (dirPath) => {
      const outputPath = join(dirPath, "reports");
      const { io, stdout, stderr } = createTestIo();

      const exitCode = await runCli(
        ["metrics", "snapshot", "--path", outputPath, "--format", "json"],
        io,
        {
          cwd: () => dirPath
        }
      );

      expect(exitCode).toBe(0);
      expect(stderr).toHaveLength(0);
      expect(stdout.join("")).toContain("Deprecated");
      expect(stdout.join("")).toContain("snapshot-report");
    });
  });

  it(
    "completes snapshot-report within 60 seconds on the current repository",
    {
      timeout: 70000
    },
    async () => {
      await withTempDir(async (dirPath) => {
        const outputPath = join(dirPath, "reports");
        const { io } = createTestIo();

        const startedAt = Date.now();
        const exitCode = await runCli(
          ["snapshot-report", "--path", outputPath, "--format", "json"],
          io,
          {
            cwd: () => process.cwd()
          }
        );
        const elapsedMs = Date.now() - startedAt;

        expect(exitCode).toBe(0);
        expect(elapsedMs).toBeLessThan(60000);
      });
    }
  );
});
