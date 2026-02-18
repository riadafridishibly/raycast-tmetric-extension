import type { ITMetricApi } from "./tmetric-api";
import { TMetricHttpClient } from "./tmetric-http-client";

let apiClient: ITMetricApi | null = null;

export function createApiClient(token: string): ITMetricApi {
  apiClient = new TMetricHttpClient(token);
  return apiClient;
}

export function setApiClient(client: ITMetricApi): void {
  apiClient = client;
}

export function getApiClient(): ITMetricApi {
  if (!apiClient) {
    throw new Error("API client not initialized. Call createApiClient() or setApiClient() first.");
  }
  return apiClient;
}

export function resetApiClient(): void {
  apiClient = null;
}
