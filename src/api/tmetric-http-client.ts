import type { ITMetricApi } from "./tmetric-api";
import type { TMetricUser, TMetricTimer, TMetricTimeEntry, TMetricAccountScope, StartTimerInput } from "../types";

const DEFAULT_BASE_URL = "https://app.tmetric.com/api/v3";
const REQUEST_TIMEOUT_MS = 10_000;

export class TMetricHttpClient implements ITMetricApi {
  private token: string;
  private baseUrl: string;

  constructor(token: string, baseUrl: string = DEFAULT_BASE_URL) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
    };
    if (body) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(`TMetric API error: ${response.status} ${response.statusText}${errorBody ? ` — ${errorBody}` : ""}`);
      }

      const text = await response.text();
      if (!text) {
        return { isStarted: false } as T;
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        throw new Error(`TMetric API returned invalid JSON: ${text.slice(0, 200)}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getUser(): Promise<TMetricUser> {
    return this.request<TMetricUser>("GET", "/user");
  }

  async getTimer(accountId: number): Promise<TMetricTimer> {
    return this.request<TMetricTimer>("GET", `/accounts/${accountId}/timer`);
  }

  async startTimer(accountId: number, input: StartTimerInput): Promise<TMetricTimer> {
    return this.request<TMetricTimer>("PUT", `/accounts/${accountId}/timer`, {
      isStarted: true,
      details: {
        description: input.description,
        projectId: input.projectId,
        tagIds: input.tagIds,
        isBillable: input.isBillable,
      },
    });
  }

  async stopTimer(accountId: number): Promise<TMetricTimer> {
    return this.request<TMetricTimer>("PUT", `/accounts/${accountId}/timer`, {
      isStarted: false,
    });
  }

  async getRecentTimeEntries(accountId: number): Promise<TMetricTimeEntry[]> {
    return this.request<TMetricTimeEntry[]>("GET", `/accounts/${accountId}/timeentries/recent`);
  }

  async getAccountScope(accountId: number): Promise<TMetricAccountScope> {
    return this.request<TMetricAccountScope>("GET", `/accounts/${accountId}/scope`);
  }
}
