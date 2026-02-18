import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const TIMEOUT_MS = 5_000;

export async function ensureTMetricAppRunning(): Promise<void> {
  try {
    await execFileAsync("pgrep", ["-x", "TMetric Desktop"], { timeout: TIMEOUT_MS });
  } catch (err: unknown) {
    const exitCode = (err as { code?: number }).code;
    if (exitCode !== 1) {
      // pgrep exit code 1 = "no match". Anything else is an unexpected error.
      return;
    }
    // TMetric Desktop is not running — launch it
    await execFileAsync("open", ["-a", "TMetric Desktop"], { timeout: TIMEOUT_MS });
  }
}
