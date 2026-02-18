import type { TMetricUser, TMetricTimeEntry, TMetricRecentEntry, TMetricProject, StartTimerInput } from "../types";

export interface ITMetricApi {
  getUser(): Promise<TMetricUser>;
  getLatestEntry(accountId: number): Promise<TMetricTimeEntry | null>;
  startTimer(accountId: number, input: StartTimerInput): Promise<void>;
  stopTimer(accountId: number): Promise<void>;
  getRecentTimeEntries(accountId: number): Promise<TMetricRecentEntry[]>;
  getProjects(accountId: number): Promise<TMetricProject[]>;
  getTimeEntries(accountId: number, startDate: string, endDate: string): Promise<TMetricTimeEntry[]>;
}
