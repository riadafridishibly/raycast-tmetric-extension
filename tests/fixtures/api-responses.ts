import type { TMetricUser, TMetricProject, TMetricRecentEntry } from "../../src/types";

export const mockUser: TMetricUser = {
  id: 1001,
  name: "Test User",
  email: "test@example.com",
  activeAccountId: 42,
};

export const mockProjects: TMetricProject[] = [
  { id: 101, name: "Project Alpha", client: { id: 1, name: "Client A" }, status: "active" },
  { id: 102, name: "Project Beta", status: "active" },
  { id: 103, name: "Internal Tasks", status: "active" },
];

export const mockRecentEntries: TMetricRecentEntry[] = [
  {
    project: { id: 101, name: "Project Alpha" },
    task: null,
    note: "Standup + planning",
    tags: [],
    isBillable: false,
    isPinned: false,
  },
  {
    project: { id: 102, name: "Project Beta" },
    task: null,
    note: "Feature work",
    tags: [],
    isBillable: false,
    isPinned: false,
  },
];
