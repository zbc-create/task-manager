/* eslint-disable react/no-unescaped-entities */
"use client";

import type { Task } from "@/lib/tasks";
import { memo } from "react";
import { TaskItem } from "./TaskItem";

type TaskListProps = {
  tasks: Task[];
  searchQuery: string;
  emptyStateMessage?: string;
  onUpdateTaskTitle: (taskId: string, nextTitle: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskComplete: (taskId: string) => void;
};

export const TaskList = memo(function TaskList({
  tasks,
  searchQuery,
  emptyStateMessage,
  onUpdateTaskTitle,
  onDeleteTask,
  onToggleTaskComplete,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-black dark:text-zinc-400">
        {emptyStateMessage ?? "No tasks yet. Add one above."}
      </div>
    );
  }

  return (
    <ul className="w-full flex flex-col gap-3" aria-label="Task list">
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskItem
            task={task}
            searchQuery={searchQuery}
            onUpdateTaskTitle={onUpdateTaskTitle}
            onDeleteTask={onDeleteTask}
            onToggleTaskComplete={onToggleTaskComplete}
          />
        </li>
      ))}
    </ul>
  );
});

