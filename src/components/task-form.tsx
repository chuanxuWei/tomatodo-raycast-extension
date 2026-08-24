import { Action, ActionPanel, Form, Toast, showToast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { saveTask, type StorageAdapter } from "../lib/storage";
import type { Task } from "../lib/types";
import { createTask, updateTask, validateTaskInput } from "../lib/validation";

interface TaskFormProps {
  task?: Task;
  store: StorageAdapter;
  onSaved: () => Promise<void>;
}

export function TaskForm({ task, store, onSaved }: TaskFormProps) {
  const { pop } = useNavigation();
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [estimate, setEstimate] = useState(String(task?.estimate ?? 1));
  const [titleError, setTitleError] = useState<string>();
  const [estimateError, setEstimateError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    setTitleError(undefined);
    setEstimateError(undefined);

    try {
      const valid = validateTaskInput({ title, notes, estimate });
      setIsLoading(true);
      await saveTask(task ? updateTask(task, valid) : createTask(valid), store);
      pop();
      await onSaved();
      await showToast({ title: task ? "Task Updated" : "Task Created", message: valid.title });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("title")) setTitleError(message);
      if (message.includes("Estimate")) setEstimateError(message);
      await showToast({ style: Toast.Style.Failure, title: "Could Not Save Task", message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      navigationTitle={task ? "Edit Task" : "Create Task"}
      actions={
        <ActionPanel>
          <Action.SubmitForm title={task ? "Save Changes" : "Create Task"} onSubmit={submit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        title="Title"
        placeholder="What needs your focus?"
        value={title}
        error={titleError}
        onChange={(value) => {
          setTitle(value);
          if (value.trim()) setTitleError(undefined);
        }}
      />
      <Form.TextArea
        id="notes"
        title="Notes"
        placeholder="Optional context, outcome, or next step"
        value={notes}
        onChange={setNotes}
      />
      <Form.TextField
        id="estimate"
        title="Estimate"
        placeholder="1-99"
        info="Estimated number of focus sessions"
        value={estimate}
        error={estimateError}
        onChange={(value) => {
          setEstimate(value);
          setEstimateError(undefined);
        }}
      />
    </Form>
  );
}
