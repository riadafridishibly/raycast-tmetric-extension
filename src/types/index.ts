export interface TMetricUser {
  id: number;
  name: string;
  email: string;
  activeAccountId: number;
}

export interface TMetricProject {
  projectId: number;
  projectName: string;
  clientId?: number;
  clientName?: string;
  isBillable: boolean;
}

export interface TMetricTag {
  tagId: number;
  tagName: string;
}

export interface TMetricClient {
  clientId: number;
  clientName: string;
}

export interface TMetricAccountScope {
  projects: TMetricProject[];
  tags: TMetricTag[];
  clients: TMetricClient[];
}

export interface TMetricTimerDetails {
  description?: string;
  projectId?: number;
  tagIds?: number[];
  isBillable?: boolean;
}

export interface TMetricTimer {
  isStarted: boolean;
  startTime?: string;
  details?: TMetricTimerDetails;
}

export interface TMetricTimeEntry {
  timeEntryId: number;
  startTime: string;
  endTime: string;
  details: TMetricTimerDetails;
  projectName?: string;
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
}
