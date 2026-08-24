import { LaunchType, Toast, launchCommand, showToast } from "@raycast/api";
import { getTimerPreferences } from "./preferences";
import { listTasks, raycastStorage, type StorageAdapter } from "./storage";
import { markSessionNotified, phaseTitle, reconcileExpiredTimer, startTimer } from "./timer";
import type { TimerPhase } from "./types";

function nextActionTitle(phase: TimerPhase) {
  return phase === "focus" ? "Start Focus" : `Start ${phaseTitle(phase)}`;
}

export async function reconcileAndNotify(store: StorageAdapter = raycastStorage, now = Date.now()) {
  const preferences = getTimerPreferences();
  const result = await reconcileExpiredTimer(store, preferences, now);
  if (!result || result.session.notifiedAt) return result;
  const completion = result;

  await markSessionNotified(completion.session, store, now);
  const completedTitle = `${phaseTitle(completion.session.phase)} Complete`;
  const taskMessage =
    completion.session.phase === "focus" && completion.session.taskTitleSnapshot
      ? `Your focus on “${completion.session.taskTitleSnapshot}” is complete.`
      : undefined;
  async function startNextPhase() {
    try {
      if (completion.recommendedPhase === "focus") {
        const task = (await listTasks(store)).find(
          (candidate) => candidate.id === completion.session.taskId && candidate.status === "active",
        );
        if (!task) {
          await launchCommand({ name: "manage-tasks", type: LaunchType.UserInitiated });
          return;
        }
        await startTimer("focus", preferences, { task }, store);
      } else {
        await startTimer(
          completion.recommendedPhase,
          preferences,
          {
            taskId: completion.session.taskId,
            taskTitleSnapshot: completion.session.taskTitleSnapshot,
          },
          store,
        );
      }
      await launchCommand({ name: "tomato-timer", type: LaunchType.Background });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Could Not Start Timer",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await showToast({
    style: Toast.Style.Success,
    title: completedTitle,
    message: taskMessage ?? `Your ${phaseTitle(completion.session.phase).toLowerCase()} is complete.`,
    primaryAction: {
      title: nextActionTitle(completion.recommendedPhase),
      onAction: () => {
        void startNextPhase();
      },
    },
  });

  return result;
}
