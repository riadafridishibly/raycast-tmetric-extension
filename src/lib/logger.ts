import { appendFile, writeFile, stat, mkdirSync } from "fs";
import { join } from "path";

let logFile: string | null = null;
let initialized = false;
const MAX_FILE_SIZE = 256 * 1024; // 256 KB

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

function truncateIfNeeded(file: string, callback: () => void) {
  stat(file, (err, stats) => {
    if (err || stats.size < MAX_FILE_SIZE) {
      callback();
      return;
    }
    // Truncate the file before writing the first line of this session
    writeFile(file, "", () => callback());
  });
}

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: string, message: string) {
  const file = getLogFile();
  if (!file) return;

  const line = `[${timestamp()}] [${level}] ${message}\n`;

  try {
    if (!initialized) {
      initialized = true;
      truncateIfNeeded(file, () => {
        appendFile(file, line, () => {});
      });
      return;
    }
    appendFile(file, line, () => {});
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
