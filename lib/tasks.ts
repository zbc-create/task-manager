export type TaskPriority = "High" | "Medium" | "Low";
export const MAX_TASK_TITLE_LENGTH = 100;

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate: string | null;
};

export function normalizeTaskTitle(title: string): string {
  return title.trim();
}

export function validateTaskTitle(title: string): {
  normalized: string;
  isValid: boolean;
  error: string | null;
} {
  const normalized = normalizeTaskTitle(title);
  if (normalized.length === 0) {
    return {
      normalized,
      isValid: false,
      error: "Task title is required.",
    };
  }
  if (normalized.length > MAX_TASK_TITLE_LENGTH) {
    return {
      normalized,
      isValid: false,
      error: `Task title must be ${MAX_TASK_TITLE_LENGTH} characters or less.`,
    };
  }
  return { normalized, isValid: true, error: null };
}

export function createTaskId(): string {
  // Prefer the built-in UUID generator when available (modern browsers).
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // Fallback: good enough for local-only task IDs.
  return `task_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function parseDateOnly(rawDate: string): Date | null {
  if (!rawDate) return null;
  const parts = rawDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return isValid ? date : null;
}

function getLocalStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDueDate(dueDate: string | null | undefined): string {
  if (!dueDate) return "";
  const parsedDueDate = parseDateOnly(dueDate);
  if (!parsedDueDate) return "";

  const today = getLocalStartOfDay(new Date());
  const due = getLocalStartOfDay(parsedDueDate);
  const diffInDays = Math.floor(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays < 0) return "";
  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Tomorrow";
  return `In ${diffInDays} days`;
}

export function isTaskOverdue(
  dueDate: string | null | undefined,
  completed: boolean
): boolean {
  if (!dueDate || completed) return false;
  const parsedDueDate = parseDateOnly(dueDate);
  if (!parsedDueDate) return false;

  const today = getLocalStartOfDay(new Date());
  const due = getLocalStartOfDay(parsedDueDate);
  return due.getTime() < today.getTime();
}

