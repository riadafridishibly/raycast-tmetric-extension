export interface TMetricUser {
  id: number;
  name: string;
  email: string;
  activeAccountId: number;
}

export interface TMetricProject {
  id: number;
  name: string;
  client?: { id: number; name: string };
  status?: string;
}

export interface TMetricTimeEntry {
  id: number;
  startTime: string;
  endTime: string | null;
  project: { id: number; name: string } | null;
  note: string;
  tags: { id: number; name: string }[];
  isBillable: boolean;
}

export interface TMetricRecentEntry {
  project: { id: number; name: string } | null;
  task: { id: number; name: string } | null;
  note: string;
  tags: { id: number; name: string }[];
  isBillable: boolean;
  isPinned: boolean;
}

export interface StartTimerInput {
  description?: string;
  projectId?: number;
  tagIds?: number[];
  isBillable?: boolean;
}

export interface TimerStatus {
  isRunning: boolean;
  description?: string;
  projectName?: string;
  startTime?: string;
  elapsedSeconds?: number;
}

export interface ExtensionPreferences {
  apiToken: string;
  useMockApi: boolean;
}
