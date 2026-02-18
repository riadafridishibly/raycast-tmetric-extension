import { execFile } from "child_process";
import { promisify } from "util";
import { logger } from "../lib/logger";

const execFileAsync = promisify(execFile);
const TIMEOUT_MS = 5_000;

export async function ensureTMetricAppRunning(): Promise<void> {
  try {
    await execFileAsync("pgrep", ["-x", "TMetric Desktop"], { timeout: TIMEOUT_MS });
    logger.info("TMetric Desktop is already running");
  } catch (err: unknown) {
    const exitCode = (err as { code?: number | string }).code;
    if (typeof exitCode !== "number" || exitCode !== 1) {
      // pgrep exit code 1 = "no match". Anything else (ENOENT, signal, etc.) is unexpected.
      logger.error("pgrep failed unexpectedly", err);
      throw err;
    }
    // TMetric Desktop is not running — launch it
    logger.info("Launching TMetric Desktop");
    await execFileAsync("open", ["-a", "TMetric Desktop"], { timeout: TIMEOUT_MS });
  }
}
