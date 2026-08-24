import { beforeEach, describe, expect, it } from "vitest";
import { reconcileAndNotify } from "../src/lib/notifications";
import { getActiveTimer, listSessions, saveTask } from "../src/lib/storage";
import { startTimer } from "../src/lib/timer";
import type { TimerPreferences } from "../src/lib/types";
import { createTask } from "../src/lib/validation";
import { MemoryStorage } from "./helpers";
import { shownToasts } from "./raycast-api-mock";

const preferences: TimerPreferences = {
  focusMinutes: 1,
  shortBreakMinutes: 1,
  longBreakMinutes: 1,
  focusesPerLongBreak: 4,
};

describe("completion notifications", () => {
  beforeEach(() => {
    shownToasts.length = 0;
  });

  it("offers the next phase without starting it automatically", async () => {
    const store = new MemoryStorage();
    const task = createTask({ title: "Keep control", estimate: 1 }, 1_000, "task-1");
    await saveTask(task, store);
    await startTimer("focus", preferences, { task }, store, 10_000);

    await reconcileAndNotify(store, 70_000);

    expect(await getActiveTimer(store)).toBeUndefined();
    expect(await listSessions(store)).toHaveLength(1);
    expect(shownToasts).toEqual([
      expect.objectContaining({
        title: "Focus Complete",
        primaryAction: expect.objectContaining({ title: "Start Short Break" }),
      }),
    ]);
  });
});
