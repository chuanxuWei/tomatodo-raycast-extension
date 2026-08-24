import { LocalStorage } from "@raycast/api";
import { SCHEMA_VERSION, type AppSnapshot, type Session, type Task, type Timer } from "./types";

export type StorageValue = string | number | boolean;

export interface StorageAdapter {
  getItem(key: string): Promise<StorageValue | undefined>;
  setItem(key: string, value: StorageValue): Promise<void>;
  removeItem(key: string): Promise<void>;
  allItems(): Promise<Record<string, StorageValue>>;
}

export const raycastStorage: StorageAdapter = {
  getItem: (key) => LocalStorage.getItem(key),
  setItem: (key, value) => LocalStorage.setItem(key, value),
  removeItem: (key) => LocalStorage.removeItem(key),
  allItems: () => LocalStorage.allItems(),
};

const META_SCHEMA_VERSION = "meta:schema-version";
const ACTIVE_TIMER_KEY = "timer:active";
const TASK_PREFIX = "task:";
const TIMER_PREFIX = "timer:";
const SESSION_PREFIX = "session:";

function parseRecord<T>(value: StorageValue | undefined): T | undefined {
  if (typeof value !== "string") return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function taskKey(id: string) {
  return `${TASK_PREFIX}${id}`;
}

function timerKey(id: string) {
  return `${TIMER_PREFIX}${id}`;
}

function sessionKey(id: string) {
  return `${SESSION_PREFIX}${id}`;
}

export async function ensureSchema(store: StorageAdapter = raycastStorage) {
  const version = await store.getItem(META_SCHEMA_VERSION);
  if (version === undefined) {
    await store.setItem(META_SCHEMA_VERSION, SCHEMA_VERSION);
    return;
  }
  if (version !== SCHEMA_VERSION) {
    throw new Error(`Unsupported Tomato ToDo data version: ${String(version)}.`);
  }
}

export async function listTasks(store: StorageAdapter = raycastStorage): Promise<Task[]> {
  const items = await store.allItems();
  return Object.entries(items)
    .filter(([key]) => key.startsWith(TASK_PREFIX))
    .map(([, value]) => parseRecord<Task>(value))
    .filter((task): task is Task => Boolean(task?.id && task.title))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveTask(task: Task, store: StorageAdapter = raycastStorage) {
  await ensureSchema(store);
  await store.setItem(taskKey(task.id), JSON.stringify(task));
}

export async function removeTask(id: string, store: StorageAdapter = raycastStorage) {
  await store.removeItem(taskKey(id));
}

export async function listSessions(store: StorageAdapter = raycastStorage): Promise<Session[]> {
  const items = await store.allItems();
  return Object.entries(items)
    .filter(([key]) => key.startsWith(SESSION_PREFIX))
    .map(([, value]) => parseRecord<Session>(value))
    .filter((session): session is Session => Boolean(session?.id && session.endedAt))
    .sort((a, b) => b.endedAt - a.endedAt);
}

export async function getSession(id: string, store: StorageAdapter = raycastStorage) {
  return parseRecord<Session>(await store.getItem(sessionKey(id)));
}

export async function saveSession(session: Session, store: StorageAdapter = raycastStorage) {
  await ensureSchema(store);
  await store.setItem(sessionKey(session.id), JSON.stringify(session));
}

export async function getActiveTimer(store: StorageAdapter = raycastStorage): Promise<Timer | undefined> {
  const id = await store.getItem(ACTIVE_TIMER_KEY);
  if (typeof id !== "string") return undefined;
  return parseRecord<Timer>(await store.getItem(timerKey(id)));
}

export async function saveActiveTimer(timer: Timer, store: StorageAdapter = raycastStorage) {
  await ensureSchema(store);
  await store.setItem(timerKey(timer.id), JSON.stringify(timer));
  await store.setItem(ACTIVE_TIMER_KEY, timer.id);
}

export async function updateTimer(timer: Timer, store: StorageAdapter = raycastStorage) {
  await store.setItem(timerKey(timer.id), JSON.stringify(timer));
}

export async function clearActiveTimer(id: string, store: StorageAdapter = raycastStorage) {
  const activeId = await store.getItem(ACTIVE_TIMER_KEY);
  if (activeId === id) {
    await store.removeItem(ACTIVE_TIMER_KEY);
  }
  await store.removeItem(timerKey(id));
}

export async function getSnapshot(store: StorageAdapter = raycastStorage): Promise<AppSnapshot> {
  const [tasks, sessions, activeTimer] = await Promise.all([
    listTasks(store),
    listSessions(store),
    getActiveTimer(store),
  ]);
  return { tasks, sessions, activeTimer };
}
