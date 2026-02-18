import { showHUD } from "@raycast/api";
import { TimerService } from "./services/timer-service";
import { createApiClient } from "./api/api-factory";
import { getPreferences } from "./lib/preferences";
import { logger } from "./lib/logger";

export default async function StopTimer() {
  const { apiToken, useMockApi } = getPreferences();
  const service = new TimerService(createApiClient(apiToken, useMockApi));

  try {
    const status = await service.getStatus();
    if (!status.isRunning) {
      await showHUD("No timer is running");
      return;
    }

    await service.stopTimer();

    const desc = status.description ? `: ${status.description}` : "";
    await showHUD(`Timer stopped${desc}`);
  } catch (error) {
    logger.error("Failed to stop timer", error);
    const message = error instanceof Error ? error.message : String(error);
    await showHUD(`Failed: ${message.slice(0, 80)}`);
  }
}
