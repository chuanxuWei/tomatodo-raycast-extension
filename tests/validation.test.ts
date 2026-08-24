import { describe, expect, it } from "vitest";
import { createTask, setTaskCompleted, updateTask, validateTaskInput } from "../src/lib/validation";

describe("task validation", () => {
  it("normalizes a valid task", () => {
    expect(validateTaskInput({ title: "  Write release notes  ", notes: "  Keep it short  ", estimate: "3" })).toEqual({
      title: "Write release notes",
      notes: "Keep it short",
      estimate: 3,
    });
  });

  it.each(["", "0", "1.5", "100", "tomato"])("rejects invalid estimate %s", (estimate) => {
    expect(() => validateTaskInput({ title: "Task", estimate })).toThrow(
      "Estimate must be a whole number from 1 to 99.",
    );
  });

  it("rejects an empty title", () => {
    expect(() => validateTaskInput({ title: "   ", estimate: 1 })).toThrow("Task title is required.");
  });

  it("generates a UUID when the caller does not provide one", () => {
    expect(createTask({ title: "Draft", estimate: 1 }, 100).id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("creates, updates, completes, and reopens a task", () => {
    const task = createTask({ title: "Draft", estimate: 1 }, 100, "task-1");
    const updated = updateTask(task, { title: "Publish", notes: "Ship it", estimate: 2 }, 200);
    const completed = setTaskCompleted(updated, true, 300);
    const reopened = setTaskCompleted(completed, false, 400);

    expect(updated).toMatchObject({ id: "task-1", title: "Publish", estimate: 2, updatedAt: 200 });
    expect(completed).toMatchObject({ status: "completed", completedAt: 300 });
    expect(reopened).toMatchObject({ status: "active", updatedAt: 400 });
    expect(reopened.completedAt).toBeUndefined();
  });
});
