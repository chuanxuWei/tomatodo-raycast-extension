import { describe, expect, it } from "vitest";
import { listSessions, removeTask, saveActiveTimer, saveTask } from "../src/lib/storage";
import {
  pauseTimer,
  recommendedPhase,
  reconcileExpiredTimer,
  remainingSeconds,
  resumeTimer,
  startTimer,
  stopTimer,
} from "../src/lib/timer";
import type { Session, TimerPreferences } from "../src/lib/types";
import { createTask } from "../src/lib/validation";
import { MemoryStorage } from "./helpers";

const preferences: TimerPreferences = {
  focusMinutes: 1,
  shortBreakMinutes: 1,
  longBreakMinutes: 1,
  focusesPerLongBreak: 4,
};

describe("timer lifecycle", () => {
  it("starts, pauses, resumes, and stops without recording a session", async () => {
    const store = new MemoryStorage();
    const task = createTask({ title: "Ship extension", estimate: 1 }, 1_000, "task-1");
    const timer = await startTimer("focus", preferences, { task }, store, 10_000);

    expect(remainingSeconds(timer, 20_000)).toBe(50);
    const paused = await pauseTimer(timer, store, 20_000);
    expect(paused).toMatchObject({ status: "paused", remainingSeconds: 50 });
    expect(remainingSeconds(paused, 40_000)).toBe(50);

    const resumed = await resumeTimer(paused, store, 40_000);
    expect(resumed).toMatchObject({ status: "running", endsAt: 90_000 });
    await stopTimer(resumed, store);
    expect(await listSessions(store)).toEqual([]);
  });

  it("finalizes an expired timer exactly once", async () => {
    const store = new MemoryStorage();
    const task = createTask({ title: "Write tests", estimate: 2 }, 1_000, "task-1");
    const timer = await startTimer("focus", preferences, { task }, store, 10_000);

    const first = await reconcileExpiredTimer(store, preferences, 70_000);
    expect(first).toMatchObject({ created: true, recommendedPhase: "short-break" });
    expect(first?.session).toMatchObject({ id: timer.id, taskId: "task-1", taskTitleSnapshot: "Write tests" });

    await saveActiveTimer(timer, store);
    const repeated = await reconcileExpiredTimer(store, preferences, 80_000);
    expect(repeated).toMatchObject({ created: false });
    expect(await listSessions(store)).toHaveLength(1);
  });

  it("does not turn an already elapsed timer into a paused zero timer", async () => {
    const store = new MemoryStorage();
    const task = createTask({ title: "Finish on time", estimate: 1 }, 1_000, "task-1");
    const timer = await startTimer("focus", preferences, { task }, store, 10_000);

    expect(await pauseTimer(timer, store, 70_000)).toEqual(timer);
    expect(await reconcileExpiredTimer(store, preferences, 70_000)).toMatchObject({ created: true });
  });

  it("preserves a session snapshot after its task is deleted", async () => {
    const store = new MemoryStorage();
    const task = createTask({ title: "Keep this title", estimate: 1 }, 1_000, "task-1");
    await saveTask(task, store);
    await startTimer("focus", preferences, { task }, store, 10_000);
    await reconcileExpiredTimer(store, preferences, 70_000);
    await removeTask(task.id, store);

    expect(await listSessions(store)).toEqual([
      expect.objectContaining({ taskId: task.id, taskTitleSnapshot: "Keep this title" }),
    ]);
  });
});

describe("phase recommendation", () => {
  const session = (id: string, phase: Session["phase"], endedAt: number): Session => ({
    id,
    phase,
    startedAt: endedAt - 60_000,
    endedAt,
    durationSeconds: 60,
  });

  it("recommends a long break after the threshold", () => {
    const sessions = [1, 2, 3, 4].map((value) => session(`focus-${value}`, "focus", value));
    expect(recommendedPhase(sessions.slice(0, 3), 4)).toBe("short-break");
    expect(recommendedPhase(sessions, 4)).toBe("long-break");
  });

  it("resets the cycle after a completed long break", () => {
    const sessions = [
      session("focus-1", "focus", 1),
      session("focus-2", "focus", 2),
      session("focus-3", "focus", 3),
      session("focus-4", "focus", 4),
      session("long", "long-break", 5),
    ];
    expect(recommendedPhase(sessions, 4)).toBe("focus");
  });
});
