import { Action, ActionPanel, List, showToast, Toast, popToRoot, Icon, useNavigation } from "@raycast/api";
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

  function pickProject(description?: string, suggestedProjectId?: number) {
    push(<ProjectPicker service={service} description={description} suggestedProjectId={suggestedProjectId} />);
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
              <Action title="Use This Description" onAction={() => pickProject(searchText.trim())} />
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
              <Action title="Start Without Description" onAction={() => pickProject()} />
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
                onAction={() => pickProject(s.description, s.lastProject?.id)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function ProjectPicker({
  service,
  description,
  suggestedProjectId,
}: {
  service: TimerService;
  description?: string;
  suggestedProjectId?: number;
}) {
  const [searchText, setSearchText] = useState("");

  const { data: projects, isLoading } = useCachedPromise(
    () => service.getProjects(),
    [],
  );

  async function startTimer(projectId?: number) {
    try {
      await ensureTMetricAppRunning();
      await service.startTimer({ description, projectId });
      await showToast({ style: Toast.Style.Success, title: "Timer started" });
      await popToRoot();
    } catch (error) {
      logger.error("Failed to start timer", error);
      await showToast({ style: Toast.Style.Failure, title: "Failed to start timer", message: String(error) });
    }
  }

  const allProjects = projects ?? [];
  const suggested = suggestedProjectId != null ? allProjects.find((p) => p.id === suggestedProjectId) : undefined;
  const rest = suggested ? allProjects.filter((p) => p.id !== suggested.id) : allProjects;
  const query = searchText.toLowerCase();
  const filteredRest = query ? rest.filter((p) => p.name.toLowerCase().includes(query)) : rest;
  const showSuggested = suggested && (!query || suggested.name.toLowerCase().includes(query));

  function projectItem(project: { id: number; name: string }) {
    return (
      <List.Item
        key={project.id}
        title={project.name}
        icon={Icon.Folder}
        actions={
          <ActionPanel>
            <Action title="Start Timer" onAction={() => startTimer(project.id)} />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search projects..."
      filtering={false}
      onSearchTextChange={setSearchText}
    >
      {showSuggested && (
        <List.Section title="Suggested">
          {projectItem(suggested)}
        </List.Section>
      )}
      <List.Section title={showSuggested ? "All Projects" : undefined}>
        <List.Item
          key="__no_project__"
          title="No Project"
          icon={Icon.Circle}
          actions={
            <ActionPanel>
              <Action title="Start Timer" onAction={() => startTimer()} />
            </ActionPanel>
          }
        />
        {filteredRest.map((p) => projectItem(p))}
      </List.Section>
    </List>
  );
}
