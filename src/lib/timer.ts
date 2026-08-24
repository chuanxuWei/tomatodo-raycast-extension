import { randomUUID } from "node:crypto";

import { durationSecondsForPhase } from "./preferences";
import {
  clearActiveTimer,
  getActiveTimer,
  getSession,
  listSessions,
  saveActiveTimer,
  saveSession,
  updateTimer,
  type StorageAdapter,
} from "./storage";
import type { Session, Task, Timer, TimerPhase, TimerPreferences } from "./types";

export class TimerConflictError extends Error {
  constructor() {
    super("A timer is already running.");
  }
}

export function remainingSeconds(timer: Timer, now = Date.now()) {
  if (timer.status === "paused") return Math.max(0, timer.remainingSeconds ?? 0);
  return Math.max(0, Math.ceil(((timer.endsAt ?? now) - now) / 1000));
}

export function phaseTitle(phase: TimerPhase) {
  if (phase === "focus") return "Focus";
  if (phase === "short-break") return "Short Break";
  return "Long Break";
}

export function formatRemaining(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  return `${String(minutes).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function recommendedPhase(sessions: Session[], focusesPerLongBreak: number): TimerPhase {
  const newestFirst = [...sessions].sort((a, b) => b.endedAt - a.endedAt);
  const latest = newestFirst[0];
  if (!latest || latest.phase === "short-break" || latest.phase === "long-break") return "focus";

  const lastLongBreakAt = newestFirst.find((session) => session.phase === "long-break")?.endedAt ?? -Infinity;
  const focusesSinceLongBreak = newestFirst.filter(
    (session) => session.phase === "focus" && session.endedAt > lastLongBreakAt,
  ).length;
  return focusesSinceLongBreak >= focusesPerLongBreak ? "long-break" : "short-break";
}

export async function startTimer(
  phase: TimerPhase,
  preferences: TimerPreferences,
  options: { task?: Task; taskId?: string; taskTitleSnapshot?: string } = {},
  store: StorageAdapter,
  now = Date.now(),
) {
  if (await getActiveTimer(store)) throw new TimerConflictError();
  if (phase === "focus" && !options.task && !options.taskId) {
    throw new Error("Choose an active task before starting a focus session.");
  }

  const durationSeconds = durationSecondsForPhase(phase, preferences);
  const taskId = options.task?.id ?? options.taskId;
  const taskTitleSnapshot = options.task?.title ?? options.taskTitleSnapshot;
  const timer: Timer = {
    id: randomUUID(),
    phase,
    status: "running",
    ...(taskId ? { taskId } : {}),
    ...(taskTitleSnapshot ? { taskTitleSnapshot } : {}),
    startedAt: now,
    endsAt: now + durationSeconds * 1000,
    durationSeconds,
  };
  await saveActiveTimer(timer, store);
  return timer;
}

export async function pauseTimer(timer: Timer, store: StorageAdapter, now = Date.now()) {
  if (timer.status !== "running") return timer;
  const seconds = remainingSeconds(timer, now);
  if (seconds === 0) return timer;
  const paused: Timer = {
    ...timer,
    status: "paused",
    remainingSeconds: seconds,
    endsAt: undefined,
  };
  await updateTimer(paused, store);
  return paused;
}

export async function resumeTimer(timer: Timer, store: StorageAdapter, now = Date.now()) {
  if (timer.status !== "paused") return timer;
  const seconds = Math.max(0, timer.remainingSeconds ?? 0);
  const resumed: Timer = {
    ...timer,
    status: "running",
    endsAt: now + seconds * 1000,
    remainingSeconds: undefined,
  };
  await updateTimer(resumed, store);
  return resumed;
}

export async function stopTimer(timer: Timer, store: StorageAdapter) {
  await clearActiveTimer(timer.id, store);
}

export interface ReconcileResult {
  session: Session;
  recommendedPhase: TimerPhase;
  created: boolean;
}

export async function reconcileExpiredTimer(
  store: StorageAdapter,
  preferences: TimerPreferences,
  now = Date.now(),
): Promise<ReconcileResult | undefined> {
  const timer = await getActiveTimer(store);
  if (!timer || timer.status === "paused" || remainingSeconds(timer, now) > 0) return undefined;

  const existing = await getSession(timer.id, store);
  const session: Session =
    existing ??
    ({
      id: timer.id,
      phase: timer.phase,
      ...(timer.taskId ? { taskId: timer.taskId } : {}),
      ...(timer.taskTitleSnapshot ? { taskTitleSnapshot: timer.taskTitleSnapshot } : {}),
      startedAt: timer.startedAt,
      endedAt: timer.endsAt ?? now,
      durationSeconds: timer.durationSeconds,
    } satisfies Session);

  if (!existing) await saveSession(session, store);
  await clearActiveTimer(timer.id, store);
  const sessions = await listSessions(store);
  return {
    session,
    recommendedPhase: recommendedPhase(sessions, preferences.focusesPerLongBreak),
    created: !existing,
  };
}

export async function markSessionNotified(session: Session, store: StorageAdapter, now = Date.now()) {
  if (session.notifiedAt) return session;
  const notified = { ...session, notifiedAt: now };
  await saveSession(notified, store);
  return notified;
}
