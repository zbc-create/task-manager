/* eslint-disable react/no-unescaped-entities */
"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  MAX_TASK_TITLE_LENGTH,
  type TaskPriority,
  validateTaskTitle,
} from "@/lib/tasks";

type TaskFormProps = {
  value: string;
  onChangeValue: (next: string) => void;
  priority: TaskPriority;
  onChangePriority: (next: TaskPriority) => void;
  dueDate: string;
  onChangeDueDate: (next: string) => void;
  onSubmitTask: () => void;
  canSubmit: boolean;
};

export function TaskForm({
  value,
  onChangeValue,
  priority,
  onChangePriority,
  dueDate,
  onChangeDueDate,
  onSubmitTask,
  canSubmit,
}: TaskFormProps) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const validation = useMemo(() => validateTaskTitle(value), [value]);
  const showError = hasInteracted && !validation.isValid;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHasInteracted(true);
    if (!canSubmit) return;
    onSubmitTask();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-black"
    >
      <label
        htmlFor="task-title"
        className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
      >
        Task title
      </label>

      <input
        id="task-title"
        type="text"
        value={value}
        onChange={(e) => {
          if (!hasInteracted) setHasInteracted(true);
          onChangeValue(e.target.value);
        }}
        onBlur={() => setHasInteracted(true)}
        placeholder="e.g. Buy groceries"
        className={`w-full rounded-xl border bg-white px-3 py-2 text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:ring-0 dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-500 ${
          showError
            ? "border-red-500 focus:border-red-500 dark:border-red-500"
            : "border-zinc-200 focus:border-zinc-400 dark:border-zinc-800"
        }`}
      />
      {showError ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {validation.error}
        </p>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {validation.normalized.length}/{MAX_TASK_TITLE_LENGTH} characters
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="task-priority"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Priority
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => onChangePriority(e.target.value as TaskPriority)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none ring-0 focus:border-zinc-400 focus:ring-0 dark:border-zinc-800 dark:bg-black dark:text-zinc-100"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="task-due-date"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Due date
          </label>
          <input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => onChangeDueDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none ring-0 focus:border-zinc-400 focus:ring-0 dark:border-zinc-800 dark:bg-black dark:text-zinc-100"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Add, edit, or delete tasks below.
        </p>

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400"
        >
          + Add Task
        </button>
      </div>
    </form>
  );
}

