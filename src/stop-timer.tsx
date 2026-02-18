import { showHUD } from "@raycast/api";
import { TimerService } from "./services/timer-service";
import { createApiClient } from "./api/api-factory";
import { getPreferences } from "./lib/preferences";

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
    await showHUD(`Failed to stop timer: ${String(error)}`);
  }
}
