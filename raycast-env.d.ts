/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Focus Duration - Length of a focus session */
  "focusMinutes": "1" | "15" | "20" | "25" | "30" | "45" | "50" | "60",
  /** Short Break Duration - Length of a short break */
  "shortBreakMinutes": "1" | "5" | "10" | "15",
  /** Long Break Duration - Length of a long break */
  "longBreakMinutes": "1" | "10" | "15" | "20" | "30",
  /** Focuses Before Long Break - Completed focus sessions required before recommending a long break */
  "focusesPerLongBreak": "2" | "3" | "4" | "5" | "6"
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `manage-tasks` command */
  export type ManageTasks = ExtensionPreferences & {}
  /** Preferences accessible in the `quick-add-task` command */
  export type QuickAddTask = ExtensionPreferences & {}
  /** Preferences accessible in the `tomato-timer` command */
  export type TomatoTimer = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `manage-tasks` command */
  export type ManageTasks = {}
  /** Arguments passed to the `quick-add-task` command */
  export type QuickAddTask = {
  /** Task title */
  "title": string,
  /** Estimated tomatoes (1-99) */
  "estimate": string
}
  /** Arguments passed to the `tomato-timer` command */
  export type TomatoTimer = {}
}
