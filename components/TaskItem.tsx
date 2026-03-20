/* eslint-disable react/no-unescaped-entities */
"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { Task } from "@/lib/tasks";
import {
  formatDueDate,
  isTaskOverdue,
  validateTaskTitle,
} from "@/lib/tasks";

type TaskItemProps = {
  task: Task;
  searchQuery: string;
  onUpdateTaskTitle: (taskId: string, nextTitle: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskComplete: (taskId: string) => void;
};

export const TaskItem = memo(function TaskItem({
  task,
  searchQuery,
  onUpdateTaskTitle,
  onDeleteTask,
  onToggleTaskComplete,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [hasEntered, setHasEntered] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const deleteTimerRef = useRef<number | null>(null);

  // Keep the draft in sync when we're not actively editing.
  useEffect(() => {
    if (!isEditing) setDraftTitle(task.title);
  }, [isEditing, task.title]);

  const draftValidation = useMemo(() => validateTaskTitle(draftTitle), [draftTitle]);
  const canSave = draftValidation.isValid;
  const dueDateLabel = formatDueDate(task.dueDate);
  const overdue = isTaskOverdue(task.dueDate, task.completed);
  const displayDueDate = overdue ? "Overdue" : dueDateLabel;
  const normalizedSearchQuery = searchQuery.trim();

  useEffect(() => {
    const enterTimer = window.setTimeout(() => setHasEntered(true), 20);
    return () => window.clearTimeout(enterTimer);
  }, []);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current !== null) {
        window.clearTimeout(deleteTimerRef.current);
      }
    };
  }, []);

  function renderHighlightedTitle(title: string) {
    if (!normalizedSearchQuery) return title;

    const escapedQuery = normalizedSearchQuery.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    const segments = title.split(regex);

    return segments.map((segment, index) => {
      const isMatch =
        segment.toLowerCase() === normalizedSearchQuery.toLowerCase();
      if (!isMatch) return <span key={`${segment}-${index}`}>{segment}</span>;

      return (
        <mark
          key={`${segment}-${index}`}
          className="rounded bg-yellow-200 px-0.5 text-zinc-900 dark:bg-yellow-400 dark:text-zinc-900"
        >
          {segment}
        </mark>
      );
    });
  }

  function startEditing() {
    setDraftTitle(task.title);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftTitle(task.title);
    setIsEditing(false);
  }

  function save() {
    if (!canSave) return;
    onUpdateTaskTitle(task.id, draftValidation.normalized);
    setIsEditing(false);
  }

  function confirmAndDelete() {
    const ok = window.confirm("Are you sure you want to delete this task?");
    if (!ok) return;
    setIsRemoving(true);
    deleteTimerRef.current = window.setTimeout(() => {
      onDeleteTask(task.id);
    }, 260);
  }

  const priorityBadgeClass =
    task.priority === "High"
      ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900/60"
      : task.priority === "Medium"
      ? "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-200 dark:border-yellow-900/60"
      : "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-200 dark:border-green-900/60";

  return (
    <div
      className={[
        "w-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all duration-500 ease-out dark:border-zinc-800 dark:bg-black",
        hasEntered && !isRemoving
          ? "translate-x-0 translate-y-0 opacity-100"
          : isRemoving
          ? "-translate-x-3 opacity-0"
          : "translate-y-1 opacity-0",
        isRemoving ? "pointer-events-none" : "",
      ].join(" ")}
    >
      {!isEditing ? (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <input
              id={`task_${task.id}`}
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggleTaskComplete(task.id)}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 accent-zinc-900 focus:ring-0 dark:border-zinc-700 dark:bg-black dark:checked:bg-zinc-100 dark:checked:text-zinc-900"
            />
            <label
              htmlFor={`task_${task.id}`}
              className={`text-sm font-medium break-words ${
                task.completed
                  ? "line-through text-zinc-500 dark:text-zinc-400"
                  : overdue
                  ? "text-red-600 dark:text-red-400"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {renderHighlightedTitle(task.title)}
            </label>
            {displayDueDate ? (
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                  overdue
                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                    : "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                {displayDueDate}
              </span>
            ) : null}
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityBadgeClass}`}
            >
              {task.priority}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startEditing}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => confirmAndDelete()}
              className="rounded-xl bg-red-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 dark:bg-red-400 dark:hover:bg-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Edit task
          </label>

          <div className="flex items-center gap-2">
            <input
              id={`task_${task.id}_edit`}
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggleTaskComplete(task.id)}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 accent-zinc-900 focus:ring-0 dark:border-zinc-700 dark:bg-black dark:checked:bg-zinc-100 dark:checked:text-zinc-900"
            />
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  save();
                }
                if (e.key === "Escape") cancelEditing();
              }}
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />

            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
          </div>

          {!canSave ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {draftValidation.error}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
});

