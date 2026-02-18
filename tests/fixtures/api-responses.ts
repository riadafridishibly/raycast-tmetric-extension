import type { TMetricUser, TMetricAccountScope, TMetricTimeEntry } from "../../src/types";

export const mockUser: TMetricUser = {
  id: 1001,
  name: "Test User",
  email: "test@example.com",
  activeAccountId: 42,
};

export const mockAccountScope: TMetricAccountScope = {
  projects: [
    { projectId: 101, projectName: "Project Alpha", isBillable: true, clientId: 1, clientName: "Client A" },
    { projectId: 102, projectName: "Project Beta", isBillable: false },
    { projectId: 103, projectName: "Internal Tasks", isBillable: false },
  ],
  tags: [
    { tagId: 201, tagName: "dev" },
    { tagId: 202, tagName: "design" },
  ],
  clients: [{ clientId: 1, clientName: "Client A" }],
};

export const mockRecentEntries: TMetricTimeEntry[] = [
  {
    timeEntryId: 5001,
    startTime: "2026-01-15T09:00:00Z",
    endTime: "2026-01-15T10:30:00Z",
    details: { description: "Standup + planning", projectId: 101 },
    projectName: "Project Alpha",
  },
  {
    timeEntryId: 5002,
    startTime: "2026-01-15T10:45:00Z",
    endTime: "2026-01-15T12:00:00Z",
    details: { description: "Feature work", projectId: 102 },
    projectName: "Project Beta",
  },
];
