import { relative, resolve } from "node:path";

import { applyFilePlan, type FilePlanItem } from "../lib/file-plan";
import {
  ensureGeneratedCommandRegistryAvailable,
  registerGeneratedCommand
} from "../lib/registry-updater";
import { isValidCommandName, kebabToPascal } from "../lib/naming";
import type { CliResult } from "../types/cli";

interface GenerateCommandOptions {
  commandName: string;
  targetPath: string;
  dryRun: boolean;
  force: boolean;
}

function parseGenerateCommandArgs(args: string[]): {
  options?: GenerateCommandOptions;
  error?: string;
} {
  if (args[0] !== "command") {
    return {
      error: "Generate supports only one resource type right now: command"
    };
  }

  const commandName = args[1];
  if (!commandName) {
    return {
      error: "Missing command name."
    };
  }

  let targetPath = ".";
  let dryRun = false;
  let force = false;

  for (let index = 2; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--force") {
      force = true;
      continue;
    }

    if (arg === "--path") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        return {
          error: "Missing value for --path"
        };
      }
      targetPath = value;
      index += 1;
      continue;
    }

    return {
      error: `Unknown option for generate command: ${arg}`
    };
  }

  return {
    options: {
      commandName,
      targetPath,
      dryRun,
      force
    }
  };
}

function buildGeneratePlan(commandName: string, rootPath: string): FilePlanItem[] {
  const pascalName = kebabToPascal(commandName);
  const commandFileName = resolve(rootPath, "src", "commands", `${commandName}.ts`);
  const commandTestFileName = resolve(rootPath, "tests", "commands", `${commandName}.test.ts`);

  return [
    {
      path: commandFileName,
      content: [
        'import type { CliResult } from "../types/cli";',
        "",
        `export async function run${pascalName}Command(args: string[], _cwd: string): Promise<CliResult> {`,
        "  return {",
        "    exitCode: 0,",
        '    stream: "stdout",',
        `    message: \`TODO: implement ${commandName} command. Received args: \${args.join(" ")}\``,
        "  };",
        "}",
        ""
      ].join("\n")
    },
    {
      path: commandTestFileName,
      content: [
        'import { describe, expect, it } from "vitest";',
        "",
        `import { run${pascalName}Command } from "../../src/commands/${commandName}";`,
        "",
        `describe("run${pascalName}Command", () => {`,
        '  it("returns TODO response", async () => {',
        `    const result = await run${pascalName}Command([], process.cwd());`,
        "    expect(result.exitCode).toBe(0);",
        '    expect(result.message).toContain("TODO");',
        "  });",
        "});",
        ""
      ].join("\n")
    }
  ];
}

function summarizeCreatedPaths(created: string[], cwd: string): string {
  if (created.length === 0) {
    return "(none)";
  }

  return created.map((path) => `- ${relative(cwd, path) || path}`).join("\n");
}

export async function runGenerateCommand(args: string[], cwd: string): Promise<CliResult> {
  const parsed = parseGenerateCommandArgs(args);
  if (parsed.error) {
    return {
      exitCode: 1,
      stream: "stderr",
      message: [
        parsed.error,
        "Usage: agent-alpha generate command <name> [--path <target>] [--dry-run] [--force]"
      ].join("\n")
    };
  }

  const options = parsed.options as GenerateCommandOptions;

  if (!isValidCommandName(options.commandName)) {
    return {
      exitCode: 1,
      stream: "stderr",
      message:
        "Invalid command name. Use kebab-case starting with a letter (example: sync-reports)."
    };
  }

  const pascalName = kebabToPascal(options.commandName);
  const commandFunctionName = `run${pascalName}Command`;
  const rootPath = resolve(cwd, options.targetPath);

  let registryPath: string;
  try {
    registryPath = await ensureGeneratedCommandRegistryAvailable(rootPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      exitCode: 1,
      stream: "stderr",
      message: [
        "Cannot update command registry.",
        `Expected registry file at ${relative(cwd, resolve(rootPath, "src", "commands", "registry.ts"))}.`,
        "Ensure the target project contains marker-based registry scaffolding from this starter.",
        `Details: ${message}`
      ].join("\n")
    };
  }

  const plan = buildGeneratePlan(options.commandName, rootPath);
  const applied = await applyFilePlan(plan, {
    dryRun: options.dryRun,
    force: options.force
  });

  if (applied.collisions.length > 0) {
    return {
      exitCode: 1,
      stream: "stderr",
      message: [
        "Generate aborted. The following files already exist:",
        ...applied.collisions.map((path) => `- ${relative(cwd, path) || path}`),
        "Re-run with --force to overwrite existing files."
      ].join("\n")
    };
  }

  if (options.dryRun) {
    return {
      exitCode: 0,
      stream: "stdout",
      message: [
        `Dry run: ${applied.created.length} files would be created for command ${options.commandName}.`,
        summarizeCreatedPaths(applied.created, cwd),
        `- ${relative(cwd, registryPath) || registryPath} (registry update)`
      ].join("\n")
    };
  }

  try {
    await registerGeneratedCommand(rootPath, options.commandName, commandFunctionName);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      exitCode: 1,
      stream: "stderr",
      message: [
        "Command files were created, but registry auto-update failed.",
        summarizeCreatedPaths(applied.created, cwd),
        `Registry file: ${relative(cwd, registryPath) || registryPath}`,
        `Details: ${message}`
      ].join("\n")
    };
  }

  return {
    exitCode: 0,
    stream: "stdout",
    message: [
      `Generated command skeleton: ${options.commandName}`,
      summarizeCreatedPaths(applied.created, cwd),
      `- ${relative(cwd, registryPath) || registryPath} (updated)`,
      "",
      "Next steps:",
      "1. Implement command behavior in the generated source file.",
      "2. Expand the generated test from TODO coverage to behavior coverage.",
      "3. Run lint/test/build and execute the new command immediately."
    ].join("\n")
  };
}
