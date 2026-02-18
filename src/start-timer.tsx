import { Action, ActionPanel, Form, showToast, Toast, popToRoot } from "@raycast/api";
import { useState, useEffect, useMemo } from "react";
import { TimerService } from "./services/timer-service";
import { createApiClient } from "./api/api-factory";
import { getPreferences } from "./lib/preferences";
import { ensureTMetricAppRunning } from "./services/app-launcher";
import type { TMetricProject } from "./types";

export default function StartTimer() {
  const [projects, setProjects] = useState<TMetricProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { apiToken, useMockApi } = getPreferences();
  const service = useMemo(() => new TimerService(createApiClient(apiToken, useMockApi)), []);

  useEffect(() => {
    async function loadProjects() {
      try {
        const result = await service.getProjects();
        setProjects(result);
      } catch (error) {
        await showToast({ style: Toast.Style.Failure, title: "Failed to load projects", message: String(error) });
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, [service]);

  async function handleSubmit(values: { description: string; projectId: string }) {
    try {
      await ensureTMetricAppRunning();
      await service.startTimer({
        description: values.description,
        projectId: values.projectId ? Number(values.projectId) : undefined,
      });
      await showToast({ style: Toast.Style.Success, title: "Timer started" });
      await popToRoot();
    } catch (error) {
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
      <Form.TextField id="description" title="Description" placeholder="What are you working on?" />
      <Form.Dropdown id="projectId" title="Project">
        <Form.Dropdown.Item value="" title="No Project" />
        {projects.map((project) => (
          <Form.Dropdown.Item key={project.projectId} value={String(project.projectId)} title={project.projectName} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
