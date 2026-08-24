import { LaunchProps, Toast, showHUD, showToast } from "@raycast/api";
import { raycastStorage, saveTask } from "./lib/storage";
import { createTask } from "./lib/validation";

interface QuickAddArguments {
  title: string;
  estimate?: string;
}

export default async function QuickAddTask(props: LaunchProps<{ arguments: QuickAddArguments }>) {
  try {
    const task = createTask({ title: props.arguments.title, estimate: props.arguments.estimate ?? "1" });
    await saveTask(task, raycastStorage);
    await showHUD(`Added: ${task.title} · 🍅 ${task.estimate}`);
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could Not Add Task",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
