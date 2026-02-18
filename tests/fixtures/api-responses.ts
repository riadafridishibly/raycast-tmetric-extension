import type { TMetricUser, TMetricProject, TMetricRecentEntry, TMetricTimeEntry } from "../../src/types";

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

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const mockTimeEntries: TMetricTimeEntry[] = [
  {
    id: 1,
    startTime: daysAgo(1),
    endTime: daysAgo(1),
    project: { id: 101, name: "Project Alpha" },
    note: "Standup + planning",
    tags: [],
    isBillable: false,
  },
  {
    id: 2,
    startTime: daysAgo(2),
    endTime: daysAgo(2),
    project: { id: 101, name: "Project Alpha" },
    note: "standup + planning",
    tags: [],
    isBillable: false,
  },
  {
    id: 3,
    startTime: daysAgo(3),
    endTime: daysAgo(3),
    project: { id: 102, name: "Project Beta" },
    note: "Feature work",
    tags: [],
    isBillable: false,
  },
  {
    id: 4,
    startTime: daysAgo(5),
    endTime: daysAgo(5),
    project: { id: 102, name: "Project Beta" },
    note: "Feature work",
    tags: [],
    isBillable: false,
  },
  {
    id: 5,
    startTime: daysAgo(7),
    endTime: daysAgo(7),
    project: { id: 102, name: "Project Beta" },
    note: "Feature work",
    tags: [],
    isBillable: false,
  },
  {
    id: 6,
    startTime: daysAgo(4),
    endTime: daysAgo(4),
    project: null,
    note: "",
    tags: [],
    isBillable: false,
  },
  {
    id: 7,
    startTime: daysAgo(6),
    endTime: daysAgo(6),
    project: { id: 103, name: "Internal Tasks" },
    note: "  Code review  ",
    tags: [],
    isBillable: false,
  },
  {
    id: 8,
    startTime: daysAgo(10),
    endTime: daysAgo(10),
    project: null,
    note: "   ",
    tags: [],
    isBillable: false,
  },
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
