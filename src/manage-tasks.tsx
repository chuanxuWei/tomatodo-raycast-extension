import {
  Action,
  ActionPanel,
  Alert,
  Color,
  Icon,
  LaunchType,
  List,
  Toast,
  confirmAlert,
  launchCommand,
  openExtensionPreferences,
  showToast,
} from "@raycast/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FocusSummary } from "./components/focus-summary";
import { TaskForm } from "./components/task-form";
import { reconcileAndNotify } from "./lib/notifications";
import { getTimerPreferences } from "./lib/preferences";
import { calculateSummaryStats, countTaskFocuses } from "./lib/stats";
import { getSnapshot, raycastStorage, removeTask, saveTask } from "./lib/storage";
import {
  formatRemaining,
  pauseTimer,
  phaseTitle,
  remainingSeconds,
  resumeTimer,
  startTimer,
  stopTimer,
} from "./lib/timer";
import { setTaskCompleted } from "./lib/validation";
import type { AppSnapshot, Task, Timer } from "./lib/types";

type TaskFilter = "active" | "completed" | "all";

function focusSummaryText(count: number, seconds: number) {
  return `${count} 🍅 · ${Math.round(seconds / 60)} min`;
}

export default function ManageTasks() {
  const [snapshot, setSnapshot] = useState<AppSnapshot>({ tasks: [], sessions: [] });
  const [filter, setFilter] = useState<TaskFilter>("active");
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async (notify = true) => {
    try {
      if (notify) await reconcileAndNotify(raycastStorage);
      const nextSnapshot = await getSnapshot(raycastStorage);
      setNow(Date.now());
      setSnapshot(nextSnapshot);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Could Not Load Tomato ToDo",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
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
  }, [snapshot.activeTimer, refresh]);

  const summary = useMemo(() => calculateSummaryStats(snapshot.sessions, now), [snapshot.sessions, now]);
  const activeTasks = snapshot.tasks.filter((task) => task.status === "active");
  const completedTasks = snapshot.tasks.filter((task) => task.status === "completed");

  async function startFocus(task: Task) {
    try {
      await reconcileAndNotify(raycastStorage);
      await startTimer("focus", getTimerPreferences(), { task }, raycastStorage);
      await launchCommand({ name: "tomato-timer", type: LaunchType.Background });
      await refresh(false);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Could Not Start Focus",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function toggleTask(task: Task) {
    const timer = snapshot.activeTimer;
    if (timer?.taskId === task.id) {
      const confirmed = await confirmAlert({
        title: "Complete Task and Stop Timer?",
        message: "The unfinished focus session will not be counted.",
        icon: Icon.CheckCircle,
        primaryAction: { title: "Complete Task", style: Alert.ActionStyle.Default },
      });
      if (!confirmed) return;
      await stopTimer(timer, raycastStorage);
    }
    await saveTask(setTaskCompleted(task, task.status !== "completed"), raycastStorage);
    await refresh(false);
  }

  async function deleteTask(task: Task) {
    const timer = snapshot.activeTimer;
    const confirmed = await confirmAlert({
      title: `Delete “${task.title}”?`,
      message:
        timer?.taskId === task.id
          ? "This will also stop the current timer. Completed focus history will be preserved."
          : "Completed focus history will be preserved.",
      icon: Icon.Trash,
      primaryAction: { title: "Delete Task", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) return;
    if (timer?.taskId === task.id) await stopTimer(timer, raycastStorage);
    await removeTask(task.id, raycastStorage);
    await refresh(false);
  }

  async function stopCurrentTimer(timer: Timer) {
    const confirmed = await confirmAlert({
      title: "Stop Current Timer?",
      message: "This unfinished session will not be counted.",
      icon: Icon.Stop,
      primaryAction: { title: "Stop Timer", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) return;
    await stopTimer(timer, raycastStorage);
    await refresh(false);
  }

  function commonActions() {
    return (
      <>
        <Action.Push
          title="Create Task"
          icon={Icon.Plus}
          target={<TaskForm store={raycastStorage} onSaved={() => refresh(false)} />}
        />
        <Action.Push
          title="View Focus Summary"
          icon={Icon.BarChart}
          target={<FocusSummary sessions={snapshot.sessions} />}
        />
        <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
      </>
    );
  }

  function timerActions(timer: Timer) {
    return (
      <ActionPanel>
        {timer.status === "running" ? (
          <Action
            title="Pause Timer"
            icon={Icon.Pause}
            onAction={async () => {
              await pauseTimer(timer, raycastStorage);
              await refresh(false);
            }}
          />
        ) : (
          <Action
            title="Resume Timer"
            icon={Icon.Play}
            onAction={async () => {
              await resumeTimer(timer, raycastStorage);
              await refresh(false);
            }}
          />
        )}
        <Action
          title="Stop Timer"
          icon={Icon.Stop}
          style={Action.Style.Destructive}
          onAction={() => stopCurrentTimer(timer)}
        />
        <ActionPanel.Section>{commonActions()}</ActionPanel.Section>
      </ActionPanel>
    );
  }

  function taskItem(task: Task) {
    const actual = countTaskFocuses(snapshot.sessions, task.id);
    const currentTimer = snapshot.activeTimer;
    const isCurrent = currentTimer?.taskId === task.id;
    return (
      <List.Item
        key={task.id}
        id={task.id}
        icon={{
          source: task.status === "completed" ? Icon.CheckCircle : isCurrent ? Icon.Clock : Icon.Circle,
          tintColor: task.status === "completed" ? Color.Green : Color.Red,
        }}
        title={task.title}
        subtitle={task.notes}
        accessories={[
          { tag: { value: `🍅 ${actual}/${task.estimate}`, color: actual >= task.estimate ? Color.Green : Color.Red } },
        ]}
        actions={
          <ActionPanel>
            {task.status === "active" && !currentTimer ? (
              <Action title="Start Focus" icon={Icon.Play} onAction={() => startFocus(task)} />
            ) : null}
            {task.status === "active" && isCurrent && currentTimer ? (
              currentTimer.status === "running" ? (
                <Action
                  title="Pause Timer"
                  icon={Icon.Pause}
                  onAction={async () => {
                    await pauseTimer(currentTimer, raycastStorage);
                    await refresh(false);
                  }}
                />
              ) : (
                <Action
                  title="Resume Timer"
                  icon={Icon.Play}
                  onAction={async () => {
                    await resumeTimer(currentTimer, raycastStorage);
                    await refresh(false);
                  }}
                />
              )
            ) : null}
            <Action.Push
              title="Edit Task"
              icon={Icon.Pencil}
              target={<TaskForm task={task} store={raycastStorage} onSaved={() => refresh(false)} />}
            />
            <Action
              title={task.status === "completed" ? "Reopen Task" : "Complete Task"}
              icon={task.status === "completed" ? Icon.Undo : Icon.CheckCircle}
              onAction={() => toggleTask(task)}
            />
            <ActionPanel.Section>
              {commonActions()}
              <Action
                title="Delete Task"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                onAction={() => deleteTask(task)}
              />
            </ActionPanel.Section>
          </ActionPanel>
        }
      />
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search tasks"
      searchBarAccessory={
        <List.Dropdown tooltip="Filter Tasks" value={filter} onChange={(value) => setFilter(value as TaskFilter)}>
          <List.Dropdown.Item title="Active" value="active" icon={Icon.Circle} />
          <List.Dropdown.Item title="Completed" value="completed" icon={Icon.CheckCircle} />
          <List.Dropdown.Item title="All Tasks" value="all" icon={Icon.List} />
        </List.Dropdown>
      }
    >
      {snapshot.activeTimer ? (
        <List.Section title="Current Timer">
          <List.Item
            icon={{ source: Icon.Clock, tintColor: snapshot.activeTimer.phase === "focus" ? Color.Red : Color.Green }}
            title={phaseTitle(snapshot.activeTimer.phase)}
            subtitle={snapshot.activeTimer.taskTitleSnapshot}
            accessories={[{ text: formatRemaining(remainingSeconds(snapshot.activeTimer, now)) }]}
            actions={timerActions(snapshot.activeTimer)}
          />
        </List.Section>
      ) : null}
      <List.Section title="Focus Summary">
        <List.Item
          icon={{ source: Icon.Clock, tintColor: Color.Red }}
          title="Today"
          accessories={[{ text: focusSummaryText(summary.today.count, summary.today.seconds) }]}
          actions={
            <ActionPanel>
              <Action.Push
                title="View Focus Summary"
                icon={Icon.BarChart}
                target={<FocusSummary sessions={snapshot.sessions} />}
              />
              <ActionPanel.Section>{commonActions()}</ActionPanel.Section>
            </ActionPanel>
          }
        />
        <List.Item
          icon={{ source: Icon.Calendar, tintColor: Color.Green }}
          title="This Week"
          accessories={[{ text: focusSummaryText(summary.week.count, summary.week.seconds) }]}
          actions={
            <ActionPanel>
              <Action.Push
                title="View Focus Summary"
                icon={Icon.BarChart}
                target={<FocusSummary sessions={snapshot.sessions} />}
              />
              <ActionPanel.Section>{commonActions()}</ActionPanel.Section>
            </ActionPanel>
          }
        />
      </List.Section>
      {filter !== "completed" ? (
        <List.Section title={`Active Tasks · ${activeTasks.length}`}>
          {activeTasks.length > 0 ? (
            activeTasks.map(taskItem)
          ) : (
            <List.Item
              icon={{ source: Icon.Plus, tintColor: Color.Red }}
              title="No active tasks"
              subtitle="Create a small, concrete next step"
              actions={<ActionPanel>{commonActions()}</ActionPanel>}
            />
          )}
        </List.Section>
      ) : null}
      {filter !== "active" ? (
        <List.Section title={`Completed Tasks · ${completedTasks.length}`}>{completedTasks.map(taskItem)}</List.Section>
      ) : null}
    </List>
  );
}
