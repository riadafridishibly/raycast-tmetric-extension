import fetch from "node-fetch";
import type { ITMetricApi } from "./tmetric-api";
import type { TMetricUser, TMetricTimer, TMetricTimeEntry, TMetricAccountScope, StartTimerInput } from "../types";

const DEFAULT_BASE_URL = "https://app.tmetric.com/api/v3";

export class TMetricHttpClient implements ITMetricApi {
  private token: string;
  private baseUrl: string;

  constructor(token: string, baseUrl: string = DEFAULT_BASE_URL) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`TMetric API error: ${response.status} ${response.statusText}${text ? ` — ${text}` : ""}`);
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    return JSON.parse(text) as T;
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
