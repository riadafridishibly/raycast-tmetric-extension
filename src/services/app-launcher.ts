import { execSync } from "child_process";

export function ensureTMetricAppRunning(): void {
  try {
    execSync("pgrep -x TMetric", { stdio: "ignore" });
  } catch {
    // TMetric is not running — launch it
    execSync("open -a TMetric", { stdio: "ignore" });
  }
}
