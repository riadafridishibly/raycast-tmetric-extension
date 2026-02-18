import { Action, ActionPanel, List, showToast, Toast, Icon } from "@raycast/api";
import { useState, useEffect, useCallback, useRef } from "react";
import { TimerService } from "./services/timer-service";
import { createApiClient } from "./api/api-factory";
import { getPreferences } from "./lib/preferences";
import type { TimerStatus as TimerStatusType } from "./types";

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
  const [status, setStatus] = useState<TimerStatusType | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { apiToken, useMockApi } = getPreferences();
  const api = createApiClient(apiToken, useMockApi);
  const service = new TimerService(api);

  function stopTicking() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startTicking(startTime: string) {
    stopTicking();
    setElapsed(computeElapsed(startTime));
    intervalRef.current = setInterval(() => {
      setElapsed(computeElapsed(startTime));
    }, 1000);
  }

  const loadStatus = useCallback(async () => {
    try {
      const result = await service.getStatus();
      setStatus(result);
      if (result.isRunning && result.startTime) {
        startTicking(result.startTime);
      } else {
        stopTicking();
      }
    } catch (error) {
      await showToast({ style: Toast.Style.Failure, title: "Failed to load status", message: String(error) });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    return () => stopTicking();
  }, []);

  async function handleStop() {
    try {
      await service.stopTimer();
      stopTicking();
      await showToast({ style: Toast.Style.Success, title: "Timer stopped" });
      await loadStatus();
    } catch (error) {
      await showToast({ style: Toast.Style.Failure, title: "Failed to stop timer", message: String(error) });
    }
  }

  if (!isLoading && status && !status.isRunning) {
    return (
      <List>
        <List.EmptyView icon={Icon.Clock} title="No Timer Running" description="Start a timer to see it here." />
      </List>
    );
  }

  return (
    <List isLoading={isLoading}>
      {status?.isRunning && (
        <List.Item
          icon={Icon.Clock}
          title={status.description || "No description"}
          subtitle={status.projectName}
          accessories={[{ text: formatElapsed(elapsed) }]}
          actions={
            <ActionPanel>
              <Action title="Stop Timer" icon={Icon.Stop} onAction={handleStop} />
              <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={loadStatus} />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
