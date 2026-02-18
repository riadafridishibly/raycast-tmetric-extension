import { Action, ActionPanel, Form, List, showToast, Toast, popToRoot, Icon, useNavigation } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useRef, useState } from "react";
import { TimerService } from "./services/timer-service";
import { createApiClient } from "./api/api-factory";
import { getPreferences } from "./lib/preferences";
import { ensureTMetricAppRunning } from "./services/app-launcher";
import { logger } from "./lib/logger";
function useService(): TimerService {
  const ref = useRef<TimerService | null>(null);
  if (!ref.current) {
    const { apiToken, useMockApi } = getPreferences();
    ref.current = new TimerService(createApiClient(apiToken, useMockApi));
  }
  return ref.current;
}

export default function StartTimer() {
  const service = useService();
  const [searchText, setSearchText] = useState("");
  const { push } = useNavigation();

  const { data: suggestions, isLoading } = useCachedPromise(
    () => service.getDescriptionSuggestions(),
    [],
  );

  const filtered = (suggestions ?? []).filter((s) =>
    s.description.toLowerCase().includes(searchText.toLowerCase()),
  );

  const hasExactMatch = filtered.some(
    (s) => s.description.toLowerCase() === searchText.trim().toLowerCase(),
  );

  function pushForm(prefill?: { description?: string; projectId?: number }) {
    push(<StartTimerForm service={service} prefill={prefill} />);
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search descriptions or type a new one..."
      filtering={false}
      onSearchTextChange={setSearchText}
    >
      {searchText.trim() && !hasExactMatch && (
        <List.Item
          key="__custom__"
          title={`Use "${searchText.trim()}"`}
          icon={Icon.Pencil}
          actions={
            <ActionPanel>
              <Action title="Use This Description" onAction={() => pushForm({ description: searchText.trim() })} />
            </ActionPanel>
          }
        />
      )}
      {!searchText.trim() && (
        <List.Item
          key="__blank__"
          title="Start Without Description"
          icon={Icon.Clock}
          actions={
            <ActionPanel>
              <Action title="Start Without Description" onAction={() => pushForm()} />
            </ActionPanel>
          }
        />
      )}
      {filtered.map((s) => (
        <List.Item
          key={s.description}
          title={s.description}
          accessories={[
            ...(s.lastProject ? [{ text: s.lastProject.name, icon: Icon.Folder }] : []),
            { text: `${s.count}x`, icon: Icon.Clock },
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Use This Description"
                onAction={() =>
                  pushForm({
                    description: s.description,
                    projectId: s.lastProject?.id,
                  })
                }
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function StartTimerForm({
  service,
  prefill,
}: {
  service: TimerService;
  prefill?: { description?: string; projectId?: number };
}) {
  const { data: projects, isLoading } = useCachedPromise(
    () => service.getProjects(),
    [],
  );

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
        defaultValue={prefill?.description ?? ""}
        autoFocus
      />
      <Form.Separator />
      <Form.Dropdown
        id="projectId"
        title="Project"
        defaultValue={prefill?.projectId != null ? String(prefill.projectId) : undefined}
        storeValue={prefill?.projectId == null}
      >
        <Form.Dropdown.Item value="" title="No Project" icon={Icon.Circle} />
        {(projects ?? []).map((project) => (
          <Form.Dropdown.Item key={project.id} value={String(project.id)} title={project.name} icon={Icon.Folder} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
