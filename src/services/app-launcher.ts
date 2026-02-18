import { execSync } from "child_process";

export function ensureTMetricAppRunning(): void {
  try {
    execSync("pgrep -x 'TMetric Desktop'", { stdio: "ignore" });
  } catch {
    // TMetric Desktop is not running — launch it
    execSync("open -a 'TMetric Desktop'", { stdio: "ignore" });
  }
}
