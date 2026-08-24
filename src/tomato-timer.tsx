import {
  Alert,
  Color,
  Icon,
  LaunchType,
  MenuBarExtra,
  Toast,
  confirmAlert,
  launchCommand,
  openExtensionPreferences,
  showToast,
} from "@raycast/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { reconcileAndNotify } from "./lib/notifications";
import { getTimerPreferences } from "./lib/preferences";
import { countTaskFocuses } from "./lib/stats";
import { getSnapshot, raycastStorage } from "./lib/storage";
import {
  formatRemaining,
  pauseTimer,
  phaseTitle,
  remainingSeconds,
  resumeTimer,
  startTimer,
  stopTimer,
} from "./lib/timer";
import type { AppSnapshot, Task, TimerPhase } from "./lib/types";

function uniqueTaskTitles(tasks: Task[]) {
  const totals = new Map<string, number>();
  const seen = new Map<string, number>();
  for (const task of tasks) totals.set(task.title, (totals.get(task.title) ?? 0) + 1);
  return tasks.map((task) => {
    const number = (seen.get(task.title) ?? 0) + 1;
    seen.set(task.title, number);
    return { task, title: (totals.get(task.title) ?? 0) > 1 ? `${task.title} (${number})` : task.title };
  });
}

export default function TomatoTimer() {
  const [snapshot, setSnapshot] = useState<AppSnapshot>({ tasks: [], sessions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const refreshing = useRef(false);

  const refresh = useCallback(async (notify = true) => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      if (notify) await reconcileAndNotify(raycastStorage);
      const nextSnapshot = await getSnapshot(raycastStorage);
      setNow(Date.now());
      setSnapshot(nextSnapshot);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Could Not Refresh Tomato Timer",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      refreshing.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const timer = snapshot.activeTimer;
    if (!timer || timer.status !== "running") return;
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (remainingSeconds(timer, current) === 0) void refresh();
    }, 1000);
    return () => clearInterval(interval);
  }, [refresh, snapshot.activeTimer]);

  async function run(action: () => Promise<unknown>) {
    setIsLoading(true);
    try {
      await action();
      await refresh(false);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Timer Action Failed",
        message: error instanceof Error ? error.message : String(error),
      });
      setIsLoading(false);
    }
  }

  async function begin(phase: TimerPhase, task?: Task) {
    await run(() => startTimer(phase, getTimerPreferences(), task ? { task } : {}, raycastStorage));
  }

  async function stopCurrent() {
    const timer = snapshot.activeTimer;
    if (!timer) return;
    const confirmed = await confirmAlert({
      title: "Stop Current Timer?",
      message: "This unfinished session will not be counted.",
      icon: Icon.Stop,
      primaryAction: { title: "Stop Timer", style: Alert.ActionStyle.Destructive },
    });
    if (confirmed) await run(() => stopTimer(timer, raycastStorage));
  }

  async function openTasks() {
    await launchCommand({ name: "manage-tasks", type: LaunchType.UserInitiated });
  }

  const timer = snapshot.activeTimer;
  const activeTasks = snapshot.tasks.filter((task) => task.status === "active").slice(0, 10);
  const title = timer ? formatRemaining(remainingSeconds(timer, now)) : undefined;
  const tooltip = timer
    ? `${phaseTitle(timer.phase)}${timer.taskTitleSnapshot ? ` · ${timer.taskTitleSnapshot}` : ""}`
    : "Tomato ToDo · Ready to focus";

  return (
    <MenuBarExtra icon="icon.png" title={title} tooltip={tooltip} isLoading={isLoading}>
      {timer ? (
        <>
          <MenuBarExtra.Section title={phaseTitle(timer.phase)}>
            <MenuBarExtra.Item
              icon={{ source: Icon.Clock, tintColor: timer.phase === "focus" ? Color.Red : Color.Green }}
              title={timer.taskTitleSnapshot ?? phaseTitle(timer.phase)}
              subtitle={formatRemaining(remainingSeconds(timer, now))}
            />
            {timer.status === "running" ? (
              <MenuBarExtra.Item
                title="Pause Timer"
                icon={Icon.Pause}
                onAction={() => run(() => pauseTimer(timer, raycastStorage))}
              />
            ) : (
              <MenuBarExtra.Item
                title="Resume Timer"
                icon={Icon.Play}
                onAction={() => run(() => resumeTimer(timer, raycastStorage))}
              />
            )}
            <MenuBarExtra.Item title="Stop Timer" icon={Icon.Stop} onAction={stopCurrent} />
          </MenuBarExtra.Section>
        </>
      ) : (
        <>
          <MenuBarExtra.Submenu title="Start Focus" icon={Icon.Play}>
            {uniqueTaskTitles(activeTasks).map(({ task, title: taskTitle }) => (
              <MenuBarExtra.Item
                key={task.id}
                title={taskTitle}
                subtitle={`🍅 ${countTaskFocuses(snapshot.sessions, task.id)}/${task.estimate}`}
                onAction={() => begin("focus", task)}
              />
            ))}
            {activeTasks.length === 0 ? <MenuBarExtra.Item title="No Active Tasks" /> : null}
          </MenuBarExtra.Submenu>
          <MenuBarExtra.Section title="Breaks">
            <MenuBarExtra.Item title="Start Short Break" icon={Icon.MugSteam} onAction={() => begin("short-break")} />
            <MenuBarExtra.Item title="Start Long Break" icon={Icon.MugSteam} onAction={() => begin("long-break")} />
          </MenuBarExtra.Section>
        </>
      )}
      <MenuBarExtra.Section>
        <MenuBarExtra.Item title="Open Task List" icon={Icon.List} onAction={openTasks} />
        <MenuBarExtra.Item title="Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
