import type { ITMetricApi } from "./tmetric-api";
import type {
  TMetricUser,
  TMetricTimer,
  TMetricTimeEntry,
  TMetricAccountScope,
  StartTimerInput,
} from "../types";

const mockUser: TMetricUser = {
  id: 1001,
  name: "Test User",
  email: "test@example.com",
  activeAccountId: 42,
};

const mockAccountScope: TMetricAccountScope = {
  projects: [
    { projectId: 101, projectName: "Project Alpha", isBillable: true, clientId: 1, clientName: "Client A" },
    { projectId: 102, projectName: "Project Beta", isBillable: false },
    { projectId: 103, projectName: "Internal Tasks", isBillable: false },
  ],
  tags: [
    { tagId: 201, tagName: "dev" },
    { tagId: 202, tagName: "design" },
  ],
  clients: [{ clientId: 1, clientName: "Client A" }],
};

export class TMetricApiMock implements ITMetricApi {
  private currentTimer: TMetricTimer = { isStarted: false };

  async getUser(): Promise<TMetricUser> {
    return mockUser;
  }

  async getTimer(): Promise<TMetricTimer> {
    return this.currentTimer;
  }

  async startTimer(_accountId: number, input: StartTimerInput): Promise<TMetricTimer> {
    this.currentTimer = {
      isStarted: true,
      startTime: new Date().toISOString(),
      details: {
        description: input.description,
        projectId: input.projectId,
        tagIds: input.tagIds,
        isBillable: input.isBillable,
      },
    };
    return this.currentTimer;
  }

  async stopTimer(): Promise<TMetricTimer> {
    this.currentTimer = { isStarted: false };
    return this.currentTimer;
  }

  async getRecentTimeEntries(): Promise<TMetricTimeEntry[]> {
    return [
      {
        timeEntryId: 5001,
        startTime: "2026-01-15T09:00:00Z",
        endTime: "2026-01-15T10:30:00Z",
        details: { description: "Standup + planning", projectId: 101 },
        projectName: "Project Alpha",
      },
    ];
  }

  async getAccountScope(): Promise<TMetricAccountScope> {
    return mockAccountScope;
  }
}
