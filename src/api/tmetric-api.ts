import type { TMetricUser, TMetricTimer, TMetricTimeEntry, TMetricAccountScope, StartTimerInput } from "../types";

export interface ITMetricApi {
  getUser(): Promise<TMetricUser>;
  getTimer(accountId: number): Promise<TMetricTimer>;
  startTimer(accountId: number, input: StartTimerInput): Promise<TMetricTimer>;
  stopTimer(accountId: number): Promise<TMetricTimer>;
  getRecentTimeEntries(accountId: number): Promise<TMetricTimeEntry[]>;
  getAccountScope(accountId: number): Promise<TMetricAccountScope>;
}
