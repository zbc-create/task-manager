"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Task, TaskPriority } from "@/lib/tasks";
import { createTaskId, validateTaskTitle } from "@/lib/tasks";
import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import {
  ToastLayer,
  type ToastMessage,
  type ToastPlacement,
  type ToastTone,
} from "@/components/ToastLayer";

const TASKS_STORAGE_KEY = "task-manager.tasks.v1";
const THEME_STORAGE_KEY = "task-manager.theme.v1";
type ThemeMode = "light" | "dark";

function createToastId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `toast_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Active" | "Completed"
  >("All");

  // Restore theme preference and fallback to system preference.
  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      return;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  // Apply theme class and persist preference.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore write failures (private mode, quota exceeded, etc.)
    }
  }, [theme]);

  // Load tasks on first mount so a refresh doesn't wipe them.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
      if (!raw) return;

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const nextTasks: Task[] = parsed
        .map((t: any) => {
          if (!t || typeof t.id !== "string" || typeof t.title !== "string")
            return null;
          const completed =
            typeof t.completed === "boolean" ? t.completed : false;
          const priority: TaskPriority =
            t.priority === "High" ||
            t.priority === "Medium" ||
            t.priority === "Low"
              ? t.priority
              : "Medium";
          const dueDate =
            typeof t.dueDate === "string" && t.dueDate.trim().length > 0
              ? t.dueDate
              : null;
          return { id: t.id, title: t.title, completed, priority, dueDate };
        })
        .filter((t: Task | null): t is Task => t !== null);

      setTasks(nextTasks);
    } catch {
      // If storage is corrupted, start fresh rather than crashing.
      setTasks([]);
    }
  }, []);

  // Persist tasks whenever they change.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        TASKS_STORAGE_KEY,
        JSON.stringify(tasks)
      );
    } catch {
      // Ignore write failures (private mode, quota exceeded, etc.)
    }
  }, [tasks]);

  // Debounce search so filtering waits briefly after typing stops.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const titleValidation = useMemo(() => validateTaskTitle(title), [title]);
  const canSubmit = titleValidation.isValid;

  const showToast = useCallback(function showToast(
    message: string,
    tone: ToastTone,
    placement: ToastPlacement
  ) {
    const nextToast: ToastMessage = {
      id: createToastId(),
      message,
      tone,
      placement,
    };
    setToasts((prev) => [...prev, nextToast]);
  }, []);

  const dismissToast = useCallback(function dismissToast(toastId: string) {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);

  const addTask = useCallback(function addTask() {
    if (!canSubmit) return;

    const nextTask: Task = {
      id: createTaskId(),
      title: titleValidation.normalized,
      completed: false,
      priority,
      dueDate: dueDate || null,
    };

    setTasks((prev) => [nextTask, ...prev]);
    // Clear after submission so the user can enter the next task.
    setTitle("");
    setPriority("Medium");
    setDueDate("");
    showToast("Task successfully added!", "success", "top-right");
  }, [canSubmit, dueDate, priority, showToast, titleValidation.normalized]);

  const updateTaskTitle = useCallback(function updateTaskTitle(
    taskId: string,
    nextTitle: string
  ) {
    const validation = validateTaskTitle(nextTitle);
    if (!validation.isValid) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, title: validation.normalized } : t
      )
    );
    showToast("Task updated successfully!", "success", "top-right");
  }, [showToast]);

  const deleteTask = useCallback(function deleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast("Task removed successfully.", "error", "top-right");
  }, [showToast]);

  const toggleTaskComplete = useCallback(function toggleTaskComplete(taskId: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    );
  }, []);

  const reorderTasks = useCallback(function reorderTasks(
    sourceTaskId: string,
    targetTaskId: string
  ) {
    setTasks((prev) => {
      const sourceIndex = prev.findIndex((task) => task.id === sourceTaskId);
      const targetIndex = prev.findIndex((task) => task.id === targetTaskId);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return prev;
      }

      const next = [...prev];
      const [movedTask] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, movedTask);
      return next;
    });
  }, []);

  const completedCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case "Active":
        return tasks.filter((t) => !t.completed);
      case "Completed":
        return tasks.filter((t) => t.completed);
      case "All":
      default:
        return tasks;
    }
  }, [activeFilter, tasks]);

  const normalizedSearchQuery = debouncedSearchQuery.trim().toLowerCase();
  const visibleTasks = useMemo(() => {
    if (!normalizedSearchQuery) return filteredTasks;
    return filteredTasks.filter((task) =>
      task.title.toLowerCase().includes(normalizedSearchQuery)
    );
  }, [filteredTasks, normalizedSearchQuery]);

  return (
    <div className="min-h-full flex flex-col items-center bg-zinc-50 p-6 font-sans dark:bg-black">
      <ToastLayer toasts={toasts} onDismiss={dismissToast} />
      <main className="w-full max-w-3xl flex flex-col gap-6">
        <header className="flex flex-col gap-2 items-center rounded-2xl bg-black px-6 py-5 text-center shadow">
          <div className="flex w-full justify-end">
            <button
              type="button"
              onClick={() =>
                setTheme((prev) => (prev === "dark" ? "light" : "dark"))
              }
              className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20"
              aria-label={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
              title={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
          <div
            aria-hidden="true"
            className="h-10 w-10 text-white/95"
            title="Task checklist"
          >
            {/* Simple clipboard with check icon */}
            <svg viewBox="0 0 24 24" className="h-full w-full" fill="none">
              <path
                d="M9 3h6a2 2 0 0 1 2 2v1h-2V5H11v1H9V5a2 2 0 0 1 2-2Z"
                fill="currentColor"
              />
              <path
                d="M7 6h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M8.6 12.3l2.2 2.2 4.6-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Task Manager
          </h1>
          <p className="text-sm text-white/80">
            Add tasks, edit titles inline, and remove tasks when done.
          </p>
        </header>

        <TaskForm
          value={title}
          onChangeValue={setTitle}
          priority={priority}
          onChangePriority={setPriority}
          dueDate={dueDate}
          onChangeDueDate={setDueDate}
          onSubmitTask={addTask}
          canSubmit={canSubmit}
        />

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Tasks
            </h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {completedCount} of {tasks.length} complete
            </span>
          </div>

          <div className="flex w-full gap-2">
            {(["All", "Active", "Completed"] as const).map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  aria-pressed={isActive}
                  className={[
                    "flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-zinc-400/60",
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700",
                  ].join(" ")}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="task-search"
              className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
            >
              Search tasks
            </label>
            <div className="flex items-center gap-2">
              <input
                id="task-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-0 dark:border-zinc-800 dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                disabled={searchQuery.length === 0}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                Clear
              </button>
            </div>
          </div>

          <TaskList
            tasks={visibleTasks}
            searchQuery={debouncedSearchQuery}
            emptyStateMessage={
              normalizedSearchQuery
                ? "No matching tasks for your search."
                : "No tasks yet. Add one above."
            }
            onReorderTasks={reorderTasks}
            onUpdateTaskTitle={updateTaskTitle}
            onDeleteTask={deleteTask}
            onToggleTaskComplete={toggleTaskComplete}
          />
        </section>
      </main>
    </div>
  );
}
