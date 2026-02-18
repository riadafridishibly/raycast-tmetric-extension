import type { ITMetricApi } from "../api/tmetric-api";
import type { StartTimerInput, TimerStatus, TMetricProject } from "../types";

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
    return this.cachedAccountId;
  }

  async startTimer(input: StartTimerInput): Promise<void> {
    const accountId = await this.getAccountId();
    await this.api.startTimer(accountId, input);
  }

  async stopTimer(): Promise<void> {
    const accountId = await this.getAccountId();
    await this.api.stopTimer(accountId);
  }

  async getStatus(): Promise<TimerStatus> {
    const accountId = await this.getAccountId();
    const [timer, scope] = await Promise.all([
      this.api.getTimer(accountId),
      this.api.getAccountScope(accountId),
    ]);

    if (!timer.isStarted) {
      return { isRunning: false };
    }

    const project = timer.details?.projectId
      ? scope.projects.find((p) => p.projectId === timer.details?.projectId)
      : undefined;

    return {
      isRunning: true,
      description: timer.details?.description,
      projectName: project?.projectName,
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
