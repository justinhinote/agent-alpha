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

describe("runCli", () => {
  it("returns help output for --help", async () => {
    const { io, stdout, stderr } = createTestIo();

    const exitCode = await runCli(["--help"], io);

    expect(exitCode).toBe(0);
    expect(stdout.join("")).toContain("Usage: agent-alpha [options]");
    expect(stderr).toHaveLength(0);
  });

  it("supports a leading double-dash passthrough token", async () => {
    const { io, stdout, stderr } = createTestIo();

    const exitCode = await runCli(["--", "--help"], io);

    expect(exitCode).toBe(0);
    expect(stdout.join("")).toContain("Usage: agent-alpha [options]");
    expect(stderr).toHaveLength(0);
  });

  it("returns version output for --version", async () => {
    const { io, stdout, stderr } = createTestIo("9.9.9");

    const exitCode = await runCli(["--version"], io);

    expect(exitCode).toBe(0);
    expect(stdout.join("").trim()).toBe("9.9.9");
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
});
