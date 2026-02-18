import type { ITMetricApi } from "./tmetric-api";
import type { TMetricUser, TMetricTimer, TMetricTimeEntry, TMetricAccountScope, StartTimerInput } from "../types";
import { logger } from "../lib/logger";

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
    const timeoutId = setTimeout(() => controller.abort("Request timed out"), REQUEST_TIMEOUT_MS);
    const start = Date.now();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
    };
    if (body) {
      headers["Content-Type"] = "application/json";
    }

    logger.request(method, path);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      logger.response(method, path, response.status, Date.now() - start);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        const msg = `TMetric API error: ${response.status} ${response.statusText}${errorBody ? ` — ${errorBody}` : ""}`;
        logger.error(msg);
        throw new Error(msg);
      }

      const text = await response.text();
      if (!text) {
        throw new Error(`TMetric API returned empty response for ${method} ${path}`);
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        const msg = `TMetric API returned invalid JSON: ${text.slice(0, 200)}`;
        logger.error(msg);
        throw new Error(msg);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        const msg = `TMetric API request timed out after ${REQUEST_TIMEOUT_MS}ms: ${method} ${path}`;
        logger.error(msg);
        throw new Error(msg);
      }
      throw err;
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
