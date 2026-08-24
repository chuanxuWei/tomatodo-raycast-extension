import type { Session, SummaryStats } from "./types";

export function startOfLocalDay(timestamp: number) {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function startOfLocalWeek(timestamp: number) {
  const date = new Date(startOfLocalDay(timestamp));
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return date.getTime();
}

function focusStats(sessions: Session[], since: number) {
  const completed = sessions.filter((session) => session.phase === "focus" && session.endedAt >= since);
  return {
    count: completed.length,
    seconds: completed.reduce((total, session) => total + session.durationSeconds, 0),
  };
}

export function calculateSummaryStats(sessions: Session[], now = Date.now()): SummaryStats {
  return {
    today: focusStats(sessions, startOfLocalDay(now)),
    week: focusStats(sessions, startOfLocalWeek(now)),
  };
}

export function countTaskFocuses(sessions: Session[], taskId: string) {
  return sessions.filter((session) => session.phase === "focus" && session.taskId === taskId).length;
}
