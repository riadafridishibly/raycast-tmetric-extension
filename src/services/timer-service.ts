import type { ITMetricApi } from "../api/tmetric-api";
import type { StartTimerInput, TimerStatus, TMetricProject } from "../types";
import { logger } from "../lib/logger";

export class TimerService {
  private api: ITMetricApi;
  private cachedAccountId: number | null = null;

  constructor(api: ITMetricApi) {
    this.api = api;
  }

  async getAccountId(): Promise<number> {
    if (this.cachedAccountId !== null) {
      return this.cachedAccountId;
    }
    const user = await this.api.getUser();
    this.cachedAccountId = user.activeAccountId;
    logger.info(`Resolved account ID: ${this.cachedAccountId}`);
    return this.cachedAccountId;
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
    const accountId = await this.getAccountId();
    const timer = await this.api.getTimer(accountId);

    if (!timer.isStarted) {
      return { isRunning: false };
    }

    let projectName: string | undefined;
    const projectId = timer.details?.projectId;
    if (projectId) {
      const scope = await this.api.getAccountScope(accountId);
      projectName = scope.projects.find((p) => p.projectId === projectId)?.projectName;
    }

    return {
      isRunning: true,
      description: timer.details?.description,
      projectName,
      startTime: timer.startTime,
      elapsedSeconds: Math.floor((Date.now() - new Date(timer.startTime).getTime()) / 1000),
    };
  }

  async getProjects(): Promise<TMetricProject[]> {
    const accountId = await this.getAccountId();
    const scope = await this.api.getAccountScope(accountId);
    return scope.projects;
  }
}
