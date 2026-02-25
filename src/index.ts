import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { CliIO, CliResult } from "./types/cli";

function readVersionFromPackageJson(): string {
  try {
    const packageJsonPath = resolve(__dirname, "..", "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      version?: string;
    };
    return packageJson.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function buildHelpText(): string {
  return [
    "agent-alpha",
    "",
    "Usage: agent-alpha [options]",
    "",
    "Options:",
    "  -h, --help       Show help",
    "  -v, --version    Show version",
    "",
    "Future command groups will be added here as the project evolves."
  ].join("\n");
}

function evaluateArgs(argv: string[], version: string): CliResult {
  const normalizedArgs = argv[0] === "--" ? argv.slice(1) : argv;
  const [firstArg] = normalizedArgs;

  if (!firstArg || firstArg === "--help" || firstArg === "-h") {
    return {
      exitCode: 0,
      stream: "stdout",
      message: buildHelpText()
    };
  }

  if (firstArg === "--version" || firstArg === "-v") {
    return {
      exitCode: 0,
      stream: "stdout",
      message: version
    };
  }

  return {
    exitCode: 1,
    stream: "stderr",
    message: `Unknown command: ${firstArg}\nRun "agent-alpha --help" for usage.`
  };
}

const defaultIo: CliIO = {
  writeStdout: (text: string) => {
    process.stdout.write(text);
  },
  writeStderr: (text: string) => {
    process.stderr.write(text);
  },
  version: readVersionFromPackageJson()
};

export async function runCli(argv: string[], ioOverrides: Partial<CliIO> = {}): Promise<number> {
  const io: CliIO = {
    ...defaultIo,
    ...ioOverrides
  };

  const result = evaluateArgs(argv, io.version);

  if (result.message) {
    const line = result.message.endsWith("\n") ? result.message : `${result.message}\n`;
    if (result.stream === "stderr") {
      io.writeStderr(line);
    } else {
      io.writeStdout(line);
    }
  }

  return result.exitCode;
}
