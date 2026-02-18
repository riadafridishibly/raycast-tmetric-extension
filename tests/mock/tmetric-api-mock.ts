import type { ITMetricApi } from "../../src/api/tmetric-api";
import type {
  TMetricUser,
  TMetricTimer,
  TMetricTimeEntry,
  TMetricAccountScope,
  StartTimerInput,
} from "../../src/types";
import { mockUser, mockAccountScope, mockRecentEntries } from "../fixtures/api-responses";

interface ApiCall {
  method: string;
  args: unknown[];
}

export class TMetricApiMock implements ITMetricApi {
  calls: ApiCall[] = [];
  currentTimer: TMetricTimer = { isStarted: false };
  user: TMetricUser = { ...mockUser };
  scope: TMetricAccountScope = { ...mockAccountScope };
  recentEntries: TMetricTimeEntry[] = [...mockRecentEntries];

  private record(method: string, ...args: unknown[]): void {
    this.calls.push({ method, args });
  }

  async getUser(): Promise<TMetricUser> {
    this.record("getUser");
    return this.user;
  }

  async getTimer(accountId: number): Promise<TMetricTimer> {
    this.record("getTimer", accountId);
    return this.currentTimer;
  }

  async startTimer(accountId: number, input: StartTimerInput): Promise<TMetricTimer> {
    this.record("startTimer", accountId, input);
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

  async stopTimer(accountId: number): Promise<TMetricTimer> {
    this.record("stopTimer", accountId);
    this.currentTimer = { isStarted: false };
    return this.currentTimer;
  }

  async getRecentTimeEntries(accountId: number): Promise<TMetricTimeEntry[]> {
    this.record("getRecentTimeEntries", accountId);
    return this.recentEntries;
  }

  async getAccountScope(accountId: number): Promise<TMetricAccountScope> {
    this.record("getAccountScope", accountId);
    return this.scope;
  }

  reset(): void {
    this.calls = [];
    this.currentTimer = { isStarted: false };
    this.user = { ...mockUser };
    this.scope = { ...mockAccountScope };
    this.recentEntries = [...mockRecentEntries];
  }
}
