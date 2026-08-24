export const SCHEMA_VERSION = 1;

export type TaskStatus = "active" | "completed";
export type TimerPhase = "focus" | "short-break" | "long-break";
export type TimerStatus = "running" | "paused";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  estimate: number;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface Timer {
  id: string;
  phase: TimerPhase;
  status: TimerStatus;
  taskId?: string;
  taskTitleSnapshot?: string;
  startedAt: number;
  endsAt?: number;
  durationSeconds: number;
  remainingSeconds?: number;
}

export interface Session {
  id: string;
  phase: TimerPhase;
  taskId?: string;
  taskTitleSnapshot?: string;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  notifiedAt?: number;
}

export interface TimerPreferences {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  focusesPerLongBreak: number;
}

export interface AppSnapshot {
  tasks: Task[];
  sessions: Session[];
  activeTimer?: Timer;
}

export interface FocusStats {
  count: number;
  seconds: number;
}

export interface SummaryStats {
  today: FocusStats;
  week: FocusStats;
}
