/* eslint-disable react/no-unescaped-entities */
"use client";

import type { Task } from "@/lib/tasks";
import { memo } from "react";
import { useState } from "react";
import type { DragEvent } from "react";
import { TaskItem } from "./TaskItem";

type TaskListProps = {
  tasks: Task[];
  searchQuery: string;
  emptyStateMessage?: string;
  onReorderTasks: (sourceTaskId: string, targetTaskId: string) => void;
  onUpdateTaskTitle: (taskId: string, nextTitle: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskComplete: (taskId: string) => void;
};

export const TaskList = memo(function TaskList({
  tasks,
  searchQuery,
  emptyStateMessage,
  onReorderTasks,
  onUpdateTaskTitle,
  onDeleteTask,
  onToggleTaskComplete,
}: TaskListProps) {
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  function handleDragStart(taskId: string, e: DragEvent<HTMLElement>) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
    setDraggingTaskId(taskId);
  }

  function handleDragEnd() {
    setDraggingTaskId(null);
    setDragOverTaskId(null);
  }

  function handleDragOver(taskId: string, e: DragEvent<HTMLLIElement>) {
    e.preventDefault();
    if (dragOverTaskId !== taskId) setDragOverTaskId(taskId);

    if (!draggingTaskId || draggingTaskId === taskId) return;
    onReorderTasks(draggingTaskId, taskId);
    setDraggingTaskId(taskId);
  }

  function handleDrop(targetTaskId: string, e: DragEvent<HTMLLIElement>) {
    e.preventDefault();
    const sourceTaskId = draggingTaskId || e.dataTransfer.getData("text/plain");
    setDragOverTaskId(null);
    setDraggingTaskId(null);
    if (!sourceTaskId || sourceTaskId === targetTaskId) return;
    onReorderTasks(sourceTaskId, targetTaskId);
  }

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
        <li
          key={task.id}
          onDragOver={(e) => handleDragOver(task.id, e)}
          onDragLeave={() => setDragOverTaskId(null)}
          onDrop={(e) => handleDrop(task.id, e)}
        >
          <TaskItem
            task={task}
            searchQuery={searchQuery}
            isDragOver={dragOverTaskId === task.id}
            isDragging={draggingTaskId === task.id}
            onDragHandleStart={handleDragStart}
            onDragHandleEnd={handleDragEnd}
            onUpdateTaskTitle={onUpdateTaskTitle}
            onDeleteTask={onDeleteTask}
            onToggleTaskComplete={onToggleTaskComplete}
          />
        </li>
      ))}
    </ul>
  );
});

