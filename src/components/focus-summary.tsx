import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { calculateSummaryStats } from "../lib/stats";
import { phaseTitle } from "../lib/timer";
import type { Session } from "../lib/types";

interface FocusSummaryProps {
  sessions: Session[];
}

function minutes(seconds: number) {
  return Math.round(seconds / 60);
}

export function FocusSummary({ sessions }: FocusSummaryProps) {
  const summary = calculateSummaryStats(sessions);
  const recent = sessions.slice(0, 20);

  return (
    <List navigationTitle="Focus Summary" searchBarPlaceholder="Search recent sessions">
      <List.Section title="Today">
        <List.Item
          icon={{ source: Icon.Clock, tintColor: Color.Red }}
          title="Completed Focus Sessions"
          accessories={[{ text: `${summary.today.count} tomatoes` }]}
        />
        <List.Item
          icon={{ source: Icon.Stopwatch, tintColor: Color.Red }}
          title="Focused Time"
          accessories={[{ text: `${minutes(summary.today.seconds)} minutes` }]}
        />
      </List.Section>
      <List.Section title="This Week · Monday to Today">
        <List.Item
          icon={{ source: Icon.Calendar, tintColor: Color.Green }}
          title="Completed Focus Sessions"
          accessories={[{ text: `${summary.week.count} tomatoes` }]}
        />
        <List.Item
          icon={{ source: Icon.Stopwatch, tintColor: Color.Green }}
          title="Focused Time"
          accessories={[{ text: `${minutes(summary.week.seconds)} minutes` }]}
        />
      </List.Section>
      <List.Section title="Recent Sessions">
        {recent.length === 0 ? (
          <List.Item
            icon={Icon.Circle}
            title="No completed sessions yet"
            subtitle="Finish a focus to begin your history"
          />
        ) : (
          recent.map((session) => (
            <List.Item
              key={session.id}
              icon={{
                source: session.phase === "focus" ? Icon.Circle : Icon.MugSteam,
                tintColor: session.phase === "focus" ? Color.Red : Color.Green,
              }}
              title={session.taskTitleSnapshot ?? phaseTitle(session.phase)}
              subtitle={new Date(session.endedAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              accessories={[{ text: `${Math.round(session.durationSeconds / 60)} min` }]}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard
                    title="Copy Session Summary"
                    content={session.taskTitleSnapshot ?? phaseTitle(session.phase)}
                  />
                </ActionPanel>
              }
            />
          ))
        )}
      </List.Section>
    </List>
  );
}
