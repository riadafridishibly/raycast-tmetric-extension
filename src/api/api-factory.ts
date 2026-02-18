import type { ITMetricApi } from "./tmetric-api";
import { TMetricHttpClient } from "./tmetric-http-client";

const MOCK_SERVER_URL = "http://localhost:19378/api/v3";

let apiClient: ITMetricApi | null = null;

export function createApiClient(token: string, useMock: boolean = false): ITMetricApi {
  apiClient = useMock ? new TMetricHttpClient(token, MOCK_SERVER_URL) : new TMetricHttpClient(token);
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
