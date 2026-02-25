import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname } from "node:path";

export interface FilePlanItem {
  path: string;
  content: string;
}

export interface ApplyFilePlanOptions {
  dryRun: boolean;
  force: boolean;
}

export interface ApplyFilePlanResult {
  created: string[];
  collisions: string[];
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function applyFilePlan(
  plan: FilePlanItem[],
  options: ApplyFilePlanOptions
): Promise<ApplyFilePlanResult> {
  const collisions: string[] = [];

  for (const item of plan) {
    if (await fileExists(item.path)) {
      collisions.push(item.path);
    }
  }

  if (collisions.length > 0 && !options.force) {
    return {
      created: [],
      collisions
    };
  }

  if (options.dryRun) {
    return {
      created: plan.map((item) => item.path),
      collisions: []
    };
  }

  for (const item of plan) {
    await mkdir(dirname(item.path), { recursive: true });
    await writeFile(item.path, item.content, "utf8");
  }

  return {
    created: plan.map((item) => item.path),
    collisions: []
  };
}
