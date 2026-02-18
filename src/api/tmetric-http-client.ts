import type { ITMetricApi } from "./tmetric-api";
import type { TMetricUser, TMetricTimeEntry, TMetricRecentEntry, TMetricProject, StartTimerInput } from "../types";
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

  private async request<T>(method: string, path: string, body?: unknown, allowEmpty?: boolean): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort("Request timed out"), REQUEST_TIMEOUT_MS);
    const start = Date.now();

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
    };
    if (body !== undefined) {
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
        if (allowEmpty) {
          return undefined as unknown as T;
        }
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
      if (err instanceof Error && err.name === "AbortError") {
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

  async getLatestEntry(accountId: number): Promise<TMetricTimeEntry | null> {
    return this.request<TMetricTimeEntry | null>("GET", `/accounts/${accountId}/timeentries/latest`, undefined, true);
  }

  async startTimer(accountId: number, input: StartTimerInput): Promise<void> {
    await this.request<unknown>("POST", `/accounts/${accountId}/timeentries`, {
      project: input.projectId != null ? { id: input.projectId } : null,
      note: input.description ?? "",
      startTime: null,
      endTime: null,
      tagIds: input.tagIds,
      isBillable: input.isBillable,
    }, true);
  }

  async stopTimer(accountId: number): Promise<void> {
    await this.request<unknown>("POST", `/accounts/${accountId}/timeentries/break`, {
      startTime: null,
      endTime: null,
    }, true);
  }

  async getRecentTimeEntries(accountId: number): Promise<TMetricRecentEntry[]> {
    return this.request<TMetricRecentEntry[]>("GET", `/accounts/${accountId}/timeentries/recent`);
  }

  async getProjects(accountId: number): Promise<TMetricProject[]> {
    return this.request<TMetricProject[]>("GET", `/accounts/${accountId}/timeentries/projects`);
  }

  async getTimeEntries(accountId: number, startDate: string, endDate: string): Promise<TMetricTimeEntry[]> {
    return this.request<TMetricTimeEntry[]>("GET", `/accounts/${accountId}/timeentries?startDate=${startDate}&endDate=${endDate}`);
  }
}
