const values = new Map<string, string | number | boolean>();

interface ToastOptions {
  title: string;
  message?: string;
  style?: string;
  primaryAction?: {
    title: string;
    onAction: () => void;
  };
}

export const shownToasts: ToastOptions[] = [];

export const LaunchType = {
  Background: "background",
  UserInitiated: "user-initiated",
};

export const Toast = {
  Style: {
    Animated: "animated",
    Failure: "failure",
    Success: "success",
  },
};

export async function launchCommand() {}

export async function showToast(options: ToastOptions) {
  shownToasts.push(options);
  return options;
}

export const LocalStorage = {
  async getItem(key: string) {
    return values.get(key);
  },
  async setItem(key: string, value: string | number | boolean) {
    values.set(key, value);
  },
  async removeItem(key: string) {
    values.delete(key);
  },
  async allItems() {
    return Object.fromEntries(values);
  },
};

export function getPreferenceValues() {
  return {
    focusMinutes: "25",
    shortBreakMinutes: "5",
    longBreakMinutes: "15",
    focusesPerLongBreak: "4",
  };
}
