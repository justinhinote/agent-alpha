import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { commandRegistry, findCommand } from "./commands/registry";
import type { CliIO, CliResult, CliRuntime } from "./types/cli";

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
  const commandLines = commandRegistry
    .map((command) => `  ${command.name.padEnd(10)} ${command.summary}`)
    .join("\n");

  return [
    "agent-alpha",
    "",
    "Usage: agent-alpha <command> [options]",
    "",
    "Global options:",
    "  -h, --help       Show help",
    "  -v, --version    Show version",
    "",
    "Commands:",
    commandLines,
    "",
    "Examples:",
    "  agent-alpha init my-new-cli",
    "  agent-alpha generate command sync-reports --path my-new-cli",
    "  agent-alpha metrics snapshot --format both"
  ].join("\n");
}

function buildCommandHelp(commandName: string, usage: string): string {
  return [
    `Command: ${commandName}`,
    "",
    `Usage: ${usage}`,
    "",
    "Run `agent-alpha --help` to see all available commands."
  ].join("\n");
}

async function evaluateArgs(
  argv: string[],
  version: string,
  runtime: CliRuntime
): Promise<CliResult> {
  const normalizedArgs = argv[0] === "--" ? argv.slice(1) : argv;
  const [firstArg, ...restArgs] = normalizedArgs;

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

  const command = findCommand(firstArg);
  if (!command) {
    return {
      exitCode: 1,
      stream: "stderr",
      message: `Unknown command: ${firstArg}\nRun "agent-alpha --help" for usage.`
    };
  }

  if (restArgs[0] === "--help" || restArgs[0] === "-h") {
    return {
      exitCode: 0,
      stream: "stdout",
      message: buildCommandHelp(command.name, command.usage)
    };
  }

  return command.run(restArgs, runtime.cwd());
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

const defaultRuntime: CliRuntime = {
  cwd: () => process.cwd()
};

export async function runCli(
  argv: string[],
  ioOverrides: Partial<CliIO> = {},
  runtimeOverrides: Partial<CliRuntime> = {}
): Promise<number> {
  const io: CliIO = {
    ...defaultIo,
    ...ioOverrides
  };

  const runtime: CliRuntime = {
    ...defaultRuntime,
    ...runtimeOverrides
  };

  const result = await evaluateArgs(argv, io.version, runtime);

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
