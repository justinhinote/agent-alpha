export type CliStream = "stdout" | "stderr";

export interface CliResult {
  exitCode: number;
  message?: string;
  stream?: CliStream;
}

export interface CliIO {
  writeStdout: (text: string) => void;
  writeStderr: (text: string) => void;
  version: string;
}

export interface CliRuntime {
  cwd: () => string;
}
