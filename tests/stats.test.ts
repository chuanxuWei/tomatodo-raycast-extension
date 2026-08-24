import { describe, expect, it } from "vitest";
import { calculateSummaryStats, countTaskFocuses, startOfLocalWeek } from "../src/lib/stats";
import type { Session } from "../src/lib/types";

function focus(id: string, taskId: string, endedAt: number, durationSeconds = 1_500): Session {
  return {
    id,
    phase: "focus",
    taskId,
    taskTitleSnapshot: "Task",
    startedAt: endedAt - durationSeconds * 1000,
    endedAt,
    durationSeconds,
  };
}

describe("focus statistics", () => {
  it("uses local midnight and Monday as the week boundary", () => {
    const now = new Date(2026, 7, 24, 12, 0).getTime();
    const mondayMorning = new Date(2026, 7, 24, 9, 0).getTime();
    const previousSunday = new Date(2026, 7, 23, 22, 0).getTime();
    const sessions = [focus("monday", "task-1", mondayMorning), focus("sunday", "task-1", previousSunday)];

    expect(new Date(startOfLocalWeek(now)).getDay()).toBe(1);
    expect(calculateSummaryStats(sessions, now)).toEqual({
      today: { count: 1, seconds: 1_500 },
      week: { count: 1, seconds: 1_500 },
    });
  });

  it("counts focus sessions per task and ignores breaks", () => {
    const sessions: Session[] = [
      focus("focus-1", "task-1", 1_000),
      focus("focus-2", "task-2", 2_000),
      {
        id: "break",
        phase: "short-break",
        taskId: "task-1",
        startedAt: 2_000,
        endedAt: 3_000,
        durationSeconds: 300,
      },
    ];
    expect(countTaskFocuses(sessions, "task-1")).toBe(1);
  });
});
