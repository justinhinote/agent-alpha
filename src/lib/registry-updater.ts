import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

interface UpdateRegistryResult {
  updated: boolean;
  registryPath: string;
}

const IMPORTS_START = "// AUTO-GENERATED IMPORTS START";
const IMPORTS_END = "// AUTO-GENERATED IMPORTS END";
const ENTRIES_START = "// AUTO-GENERATED ENTRIES START";
const ENTRIES_END = "// AUTO-GENERATED ENTRIES END";

function updateBlock(
  lines: string[],
  startMarker: string,
  endMarker: string,
  line: string
): {
  lines: string[];
  updated: boolean;
} {
  const startIndex = lines.findIndex((existingLine) => existingLine.trim() === startMarker);
  const endIndex = lines.findIndex((existingLine) => existingLine.trim() === endMarker);

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    throw new Error(
      `Registry markers not found or malformed. Expected markers: ${startMarker} and ${endMarker}`
    );
  }

  const existingBlockLines = lines
    .slice(startIndex + 1, endIndex)
    .filter((entry) => entry.trim().length > 0);

  if (existingBlockLines.includes(line)) {
    return {
      lines,
      updated: false
    };
  }

  const updatedBlockLines = [...existingBlockLines, line].sort((left, right) =>
    left.localeCompare(right)
  );

  return {
    lines: [...lines.slice(0, startIndex + 1), ...updatedBlockLines, ...lines.slice(endIndex)],
    updated: true
  };
}

function validateRegistryMarkers(registryContent: string): void {
  const lines = registryContent.split("\n");
  updateBlock(lines, IMPORTS_START, IMPORTS_END, "__validation_placeholder__");
  updateBlock(lines, ENTRIES_START, ENTRIES_END, "__validation_placeholder__");
}

export async function ensureGeneratedCommandRegistryAvailable(
  targetRootPath: string
): Promise<string> {
  const registryPath = resolve(targetRootPath, "src", "commands", "registry.ts");
  const registryContent = await readFile(registryPath, "utf8");
  validateRegistryMarkers(registryContent);
  return registryPath;
}

export async function registerGeneratedCommand(
  targetRootPath: string,
  commandName: string,
  commandFunctionName: string
): Promise<UpdateRegistryResult> {
  const registryPath = resolve(targetRootPath, "src", "commands", "registry.ts");
  const registryContent = await readFile(registryPath, "utf8");

  const importLine = `import { ${commandFunctionName} } from "./${commandName}";`;
  const entryLine = `  { name: "${commandName}", summary: "TODO: describe ${commandName} command", usage: "agent-alpha ${commandName} [options]", run: ${commandFunctionName} },`;

  let lines = registryContent.split("\n");

  const importUpdate = updateBlock(lines, IMPORTS_START, IMPORTS_END, importLine);
  lines = importUpdate.lines;

  const entryUpdate = updateBlock(lines, ENTRIES_START, ENTRIES_END, entryLine);
  lines = entryUpdate.lines;

  const updated = importUpdate.updated || entryUpdate.updated;

  if (updated) {
    await writeFile(registryPath, `${lines.join("\n")}\n`, "utf8");
  }

  return {
    updated,
    registryPath
  };
}
