import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";

let logFile: string | null = null;
let lineCount = 0;
const MAX_LINES = 2000;

function getLogFile(): string | null {
  if (logFile !== null) return logFile;
  try {
    // Lazy import to avoid breaking vitest (which can't resolve @raycast/api)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { environment } = require("@raycast/api");
    const dir = environment.supportPath;
    mkdirSync(dir, { recursive: true });
    logFile = join(dir, "tmetric.log");
  } catch {
    logFile = "";
  }
  return logFile || null;
}

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: string, message: string) {
  lineCount++;
  if (lineCount > MAX_LINES) return;

  const file = getLogFile();
  if (!file) return;

  try {
    appendFileSync(file, `[${timestamp()}] [${level}] ${message}\n`);
  } catch {
    // best-effort — never crash the extension
  }
}

export const logger = {
  info(message: string) {
    write("INFO", message);
  },
  error(message: string, err?: unknown) {
    const detail = err instanceof Error ? `: ${err.message}` : err ? `: ${String(err)}` : "";
    write("ERROR", `${message}${detail}`);
  },
  request(method: string, path: string) {
    write("HTTP", `${method} ${path}`);
  },
  response(method: string, path: string, status: number, durationMs: number) {
    write("HTTP", `${method} ${path} → ${status} (${durationMs}ms)`);
  },
};
