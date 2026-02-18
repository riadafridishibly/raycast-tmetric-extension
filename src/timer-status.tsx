import { Action, ActionPanel, Detail, List, showToast, Toast, Icon, Color } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { TimerService } from "./services/timer-service";
import { createApiClient } from "./api/api-factory";
import { getPreferences } from "./lib/preferences";
import { logger } from "./lib/logger";

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function computeElapsed(startTime: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
}

export default function TimerStatusCommand() {
  const [elapsed, setElapsed] = useState(0);

  const { apiToken, useMockApi } = getPreferences();
  const serviceRef = useRef<TimerService | null>(null);
  if (!serviceRef.current) {
    serviceRef.current = new TimerService(createApiClient(apiToken, useMockApi));
  }

  const { data: status, isLoading, revalidate, error } = useCachedPromise(
    () => serviceRef.current!.getStatus(),
    [],
  );

  useEffect(() => {
    if (error) {
      logger.error("Failed to load timer status", error);
      showToast({ style: Toast.Style.Failure, title: "Failed to load status", message: String(error) });
    }
  }, [error]);

  useEffect(() => {
    if (status?.isRunning && status.startTime) {
      const startTime = status.startTime;
      setElapsed(computeElapsed(startTime));
      const id = setInterval(() => setElapsed(computeElapsed(startTime)), 1000);
      return () => clearInterval(id);
    }
  }, [status?.isRunning, status?.startTime]);

  const handleStop = useCallback(async () => {
    try {
      await serviceRef.current!.stopTimer();
      await showToast({ style: Toast.Style.Success, title: "Timer stopped" });
      revalidate();
    } catch (error) {
      logger.error("Failed to stop timer", error);
      await showToast({ style: Toast.Style.Failure, title: "Failed to stop timer", message: String(error) });
    }
  }, [revalidate]);

  if (!isLoading && status && !status.isRunning) {
    return (
      <List>
        <List.EmptyView icon={Icon.Clock} title="No Timer Running" description="Start a timer to see it here." />
      </List>
    );
  }

  if (status?.isRunning) {
    const startedAt = status.startTime ? new Date(status.startTime).toLocaleTimeString() : "—";
    const markdown = `# ${formatElapsed(elapsed)}\n\n${status.description || "No description"}`;

    return (
      <Detail
        isLoading={isLoading}
        markdown={markdown}
        metadata={
          <Detail.Metadata>
            <Detail.Metadata.Label
              title="Status"
              text={{ value: "Running", color: Color.Green }}
              icon={{ source: Icon.CircleFilled, tintColor: Color.Green }}
            />
            <Detail.Metadata.Separator />
            <Detail.Metadata.Label
              title="Project"
              text={status.projectName || "No Project"}
              icon={Icon.Folder}
            />
            <Detail.Metadata.Label
              title="Started At"
              text={startedAt}
              icon={Icon.Clock}
            />
            <Detail.Metadata.Label
              title="Elapsed"
              text={formatElapsed(elapsed)}
              icon={Icon.Stopwatch}
            />
          </Detail.Metadata>
        }
        actions={
          <ActionPanel>
            <Action title="Stop Timer" icon={{ source: Icon.Stop, tintColor: Color.Red }} onAction={handleStop} />
            <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={revalidate} />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <Detail isLoading={isLoading} markdown="" />
  );
}
