"use client";

import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  REVIEW:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  DONE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

const TYPE_LABELS: Record<string, string> = {
  CREATE_PAGE: "Nowa strona",
  OPTIMIZE_PAGE: "Optymalizacja",
  WRITE_BLOG: "Blog",
  IMPROVE_CTR: "CTR",
  EXPAND_CONTENT: "Rozbudowa",
  INTERNAL_LINKING: "Linkowanie",
  TECHNICAL_FIX: "Tech fix",
  SCHEMA_MARKUP: "Schema",
};

interface TaskListProps {
  tasks: Task[];
  compact?: boolean;
  onStatusChange?: (taskId: string, status: string) => void;
}

export function TaskList({ tasks, compact, onStatusChange }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">Brak tasków</p>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            "flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50",
            task.status === "DONE" && "opacity-60"
          )}
        >
          {/* Status checkbox */}
          {onStatusChange && (
            <button
              onClick={() =>
                onStatusChange(
                  task.id,
                  task.status === "DONE" ? "TODO" : "DONE"
                )
              }
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                task.status === "DONE"
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-muted-foreground/30 hover:border-primary"
              )}
            >
              {task.status === "DONE" && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-medium truncate",
                task.status === "DONE" && "line-through"
              )}
            >
              {task.title}
            </p>
            {!compact && task.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {task.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] px-1.5">
              {TYPE_LABELS[task.task_type] || task.task_type}
            </Badge>
            <Badge
              className={cn("text-[10px] px-1.5", STATUS_STYLES[task.status])}
            >
              {task.status}
            </Badge>
            {!compact && (
              <Badge variant="secondary" className="text-[10px] px-1.5">
                {task.effort}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
