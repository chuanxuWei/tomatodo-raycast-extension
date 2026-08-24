import { randomUUID } from "node:crypto";

import type { Task } from "./types";

export interface TaskInput {
  title: string;
  notes?: string;
  estimate: string | number;
}

export interface ValidTaskInput {
  title: string;
  notes?: string;
  estimate: number;
}

export function validateTaskInput(input: TaskInput): ValidTaskInput {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Task title is required.");
  }

  const estimate = typeof input.estimate === "number" ? input.estimate : Number(input.estimate.trim());
  if (!Number.isInteger(estimate) || estimate < 1 || estimate > 99) {
    throw new Error("Estimate must be a whole number from 1 to 99.");
  }

  const notes = input.notes?.trim();
  return { title, estimate, ...(notes ? { notes } : {}) };
}

export function createTask(input: TaskInput, now = Date.now(), id: string = randomUUID()): Task {
  const valid = validateTaskInput(input);
  return {
    id,
    ...valid,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

export function updateTask(task: Task, input: TaskInput, now = Date.now()): Task {
  const valid = validateTaskInput(input);
  return {
    ...task,
    ...valid,
    notes: valid.notes,
    updatedAt: now,
  };
}

export function setTaskCompleted(task: Task, completed: boolean, now = Date.now()): Task {
  return {
    ...task,
    status: completed ? "completed" : "active",
    updatedAt: now,
    ...(completed ? { completedAt: now } : { completedAt: undefined }),
  };
}
