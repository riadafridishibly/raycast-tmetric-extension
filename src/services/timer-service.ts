import type { ITMetricApi } from "../api/tmetric-api";
import type { StartTimerInput, TimerStatus, TMetricProject, DescriptionSuggestion } from "../types";
import { logger } from "../lib/logger";

export class TimerService {
  private api: ITMetricApi;
  private cachedAccountId: number | null = null;
  private inflight = new Map<string, Promise<unknown>>();

  constructor(api: ITMetricApi) {
    this.api = api;
  }

  /** Return an in-flight promise for `key`, or start one via `fn`. */
  private dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
    let promise = this.inflight.get(key) as Promise<T> | undefined;
    if (!promise) {
      promise = fn().finally(() => this.inflight.delete(key));
      this.inflight.set(key, promise);
    }
    return promise;
  }

  async getAccountId(): Promise<number> {
    if (this.cachedAccountId !== null) return this.cachedAccountId;
    return this.dedup("getAccountId", async () => {
      const user = await this.api.getUser();
      this.cachedAccountId = user.activeAccountId;
      logger.info(`Resolved account ID: ${this.cachedAccountId}`);
      return this.cachedAccountId;
    });
  }

  async startTimer(input: StartTimerInput): Promise<void> {
    const accountId = await this.getAccountId();
    logger.info(`Starting timer: "${input.description ?? ""}" (project: ${input.projectId ?? "none"})`);
    await this.api.startTimer(accountId, input);
  }

  async stopTimer(): Promise<void> {
    const accountId = await this.getAccountId();
    logger.info("Stopping timer");
    await this.api.stopTimer(accountId);
  }

  async getStatus(): Promise<TimerStatus> {
    return this.dedup("getStatus", async () => {
      const accountId = await this.getAccountId();
      const entry = await this.api.getLatestEntry(accountId);

      if (!entry || entry.endTime != null) {
        return { isRunning: false };
      }

      return {
        isRunning: true,
        description: entry.note || undefined,
        projectName: entry.project?.name,
        startTime: entry.startTime,
        elapsedSeconds: Math.floor((Date.now() - new Date(entry.startTime).getTime()) / 1000),
      };
    });
  }

  async getProjects(): Promise<TMetricProject[]> {
    return this.dedup("getProjects", async () => {
      const accountId = await this.getAccountId();
      return this.api.getProjects(accountId);
    });
  }

  async getDescriptionSuggestions(): Promise<DescriptionSuggestion[]> {
    return this.dedup("getDescriptionSuggestions", async () => {
      const accountId = await this.getAccountId();
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);

      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      const entries = await this.api.getTimeEntries(accountId, fmt(startDate), fmt(endDate));

      const map = new Map<string, DescriptionSuggestion>();

      for (const entry of entries) {
        const trimmed = entry.note.trim();
        if (!trimmed) continue;

        const key = trimmed.toLowerCase();
        const existing = map.get(key);

        if (!existing) {
          map.set(key, {
            description: trimmed,
            lastProject: entry.project,
            lastUsed: entry.startTime,
            count: 1,
          });
        } else {
          existing.count++;
          if (entry.startTime > existing.lastUsed) {
            existing.lastUsed = entry.startTime;
            existing.description = trimmed;
            existing.lastProject = entry.project;
          }
        }
      }

      return [...map.values()].sort((a, b) => {
        const dateCompare = b.lastUsed.localeCompare(a.lastUsed);
        if (dateCompare !== 0) return dateCompare;
        return b.count - a.count;
      });
    });
  }
}
