import type { ITMetricApi } from "./tmetric-api";
import { TMetricHttpClient } from "./tmetric-http-client";

const MOCK_SERVER_URL = "http://localhost:19378/api/v3";

export function createApiClient(token: string, useMock: boolean = false): ITMetricApi {
  return new TMetricHttpClient(token, useMock ? MOCK_SERVER_URL : undefined);
}
