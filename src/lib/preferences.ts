import { getPreferenceValues } from "@raycast/api";
import type { TimerPhase, TimerPreferences } from "./types";

interface RawPreferences {
  focusMinutes: string;
  shortBreakMinutes: string;
  longBreakMinutes: string;
  focusesPerLongBreak: string;
}

function positiveNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getTimerPreferences(): TimerPreferences {
  const values = getPreferenceValues<RawPreferences>();
  return {
    focusMinutes: positiveNumber(values.focusMinutes, 25),
    shortBreakMinutes: positiveNumber(values.shortBreakMinutes, 5),
    longBreakMinutes: positiveNumber(values.longBreakMinutes, 15),
    focusesPerLongBreak: positiveNumber(values.focusesPerLongBreak, 4),
  };
}

export function durationSecondsForPhase(phase: TimerPhase, preferences: TimerPreferences) {
  const minutes =
    phase === "focus"
      ? preferences.focusMinutes
      : phase === "short-break"
        ? preferences.shortBreakMinutes
        : preferences.longBreakMinutes;
  return minutes * 60;
}
