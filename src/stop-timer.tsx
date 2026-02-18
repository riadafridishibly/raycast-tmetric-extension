import { showHUD, showToast, Toast } from "@raycast/api";
import { TimerService } from "./services/timer-service";
import { createApiClient } from "./api/api-factory";
import { getPreferences } from "./lib/preferences";

export default async function StopTimer() {
  const { apiToken, useMockApi } = getPreferences();
  const api = createApiClient(apiToken, useMockApi);
  const service = new TimerService(api);

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
    await showToast({ style: Toast.Style.Failure, title: "Failed to stop timer", message: String(error) });
  }
}
