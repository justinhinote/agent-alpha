#!/usr/bin/env node

import { runCli } from "./index";

void runCli(process.argv.slice(2))
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Unhandled CLI error: ${message}\n`);
    process.exitCode = 1;
  });
