import type { ITMetricApi } from "../../src/api/tmetric-api";
import type {
  TMetricUser,
  TMetricTimeEntry,
  TMetricRecentEntry,
  TMetricProject,
  StartTimerInput,
} from "../../src/types";
import { mockUser, mockProjects, mockRecentEntries } from "../fixtures/api-responses";

interface ApiCall {
  method: string;
  args: unknown[];
}

let nextEntryId = 9000;

export class TMetricApiMock implements ITMetricApi {
  calls: ApiCall[] = [];
  latestEntry: TMetricTimeEntry | null = null;
  user: TMetricUser = { ...mockUser };
  projects: TMetricProject[] = mockProjects.map((p) => ({ ...p }));
  recentEntries: TMetricRecentEntry[] = mockRecentEntries.map((e) => ({ ...e }));

  private record(method: string, ...args: unknown[]): void {
    this.calls.push({ method, args });
  }

  async getUser(): Promise<TMetricUser> {
    this.record("getUser");
    return this.user;
  }

  async getLatestEntry(accountId: number): Promise<TMetricTimeEntry | null> {
    this.record("getLatestEntry", accountId);
    return this.latestEntry;
  }

  async startTimer(accountId: number, input: StartTimerInput): Promise<void> {
    this.record("startTimer", accountId, input);
    const project = input.projectId != null
      ? this.projects.find((p) => p.id === input.projectId) ?? null
      : null;
    this.latestEntry = {
      id: nextEntryId++,
      startTime: new Date().toISOString(),
      endTime: null,
      project: project ? { id: project.id, name: project.name } : null,
      note: input.description ?? "",
      tags: [],
      isBillable: input.isBillable ?? false,
    };
  }

  async stopTimer(accountId: number): Promise<void> {
    this.record("stopTimer", accountId);
    if (this.latestEntry && this.latestEntry.endTime == null) {
      this.latestEntry = { ...this.latestEntry, endTime: new Date().toISOString() };
    }
  }

  async getRecentTimeEntries(accountId: number): Promise<TMetricRecentEntry[]> {
    this.record("getRecentTimeEntries", accountId);
    return this.recentEntries;
  }

  async getProjects(accountId: number): Promise<TMetricProject[]> {
    this.record("getProjects", accountId);
    return this.projects;
  }

  reset(): void {
    this.calls = [];
    this.latestEntry = null;
    this.user = { ...mockUser };
    this.projects = mockProjects.map((p) => ({ ...p }));
    this.recentEntries = mockRecentEntries.map((e) => ({ ...e }));
  }
}
