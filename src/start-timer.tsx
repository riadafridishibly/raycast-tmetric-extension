import { Action, ActionPanel, Form, showToast, Toast, popToRoot, Icon } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useRef } from "react";
import { TimerService } from "./services/timer-service";
import { createApiClient } from "./api/api-factory";
import { getPreferences } from "./lib/preferences";
import { ensureTMetricAppRunning } from "./services/app-launcher";
import { logger } from "./lib/logger";

export default function StartTimer() {
  const { apiToken, useMockApi } = getPreferences();
  const serviceRef = useRef<TimerService | null>(null);
  if (!serviceRef.current) {
    serviceRef.current = new TimerService(createApiClient(apiToken, useMockApi));
  }

  const { data: projects, isLoading } = useCachedPromise(
    () => serviceRef.current!.getProjects(),
    [],
  );

  async function handleSubmit(values: { description: string; projectId: string }) {
    try {
      await ensureTMetricAppRunning();
      await serviceRef.current!.startTimer({
        description: values.description,
        projectId: values.projectId ? Number(values.projectId) : undefined,
      });
      await showToast({ style: Toast.Style.Success, title: "Timer started" });
      await popToRoot();
    } catch (error) {
      logger.error("Failed to start timer", error);
      await showToast({ style: Toast.Style.Failure, title: "Failed to start timer", message: String(error) });
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Start Timer" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="description"
        title="Description"
        placeholder="What are you working on?"
        autoFocus
      />
      <Form.Separator />
      <Form.Dropdown id="projectId" title="Project" storeValue>
        <Form.Dropdown.Item value="" title="No Project" icon={Icon.Circle} />
        {(projects ?? []).map((project) => (
          <Form.Dropdown.Item key={project.id} value={String(project.id)} title={project.name} icon={Icon.Folder} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
