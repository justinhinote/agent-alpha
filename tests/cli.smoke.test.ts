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
    expect(stdout.join("")).toContain("metrics");
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

    const exitCode = await runCli(["init", "--help"], io);

    expect(exitCode).toBe(0);
    expect(stdout.join("")).toContain("Usage: agent-alpha init");
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
      expect(stdout.join("")).toContain("package.json");
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

  it("emits metrics snapshot in json format", async () => {
    await withTempDir(async (dirPath) => {
      const { io, stdout, stderr } = createTestIo();

      const exitCode = await runCli(
        ["metrics", "snapshot", "--path", "reports", "--format", "json"],
        io,
        {
          cwd: () => dirPath
        }
      );

      expect(exitCode).toBe(0);
      expect(stderr).toHaveLength(0);
      expect(stdout.join("")).toContain("Metrics snapshot generated");

      const reportFiles = await readdir(join(dirPath, "reports"));
      const jsonReport = reportFiles.find((fileName) => fileName.endsWith(".json"));
      expect(jsonReport).toBeDefined();

      const jsonContent = await readFile(join(dirPath, "reports", jsonReport as string), "utf8");
      const parsed = JSON.parse(jsonContent) as {
        generatedAt?: string;
        notes?: string[];
        kpi?: Record<string, unknown>;
      };

      expect(parsed.generatedAt).toBeTruthy();
      expect(parsed.kpi).toBeDefined();
      expect(parsed.notes?.length).toBeGreaterThan(0);
    });
  });

  it("validates metrics format option", async () => {
    await withTempDir(async (dirPath) => {
      const { io, stdout, stderr } = createTestIo();

      const exitCode = await runCli(["metrics", "snapshot", "--format", "xml"], io, {
        cwd: () => dirPath
      });

      expect(exitCode).toBe(1);
      expect(stdout).toHaveLength(0);
      expect(stderr.join("")).toContain("Invalid format value");
    });
  });
});
