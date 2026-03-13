"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskList } from "./task-list";
import { updateTaskStatus } from "@/app/dashboard/actions";
import type { Task } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface WeeklyBoardProps {
  tasks: Task[];
  projectId: string;
  projectCreatedAt: string;
}

export function WeeklyBoard({
  tasks,
  projectId,
  projectCreatedAt,
}: WeeklyBoardProps) {
  const [, startTransition] = useTransition();
  const [localTasks, setLocalTasks] = useState(tasks);
  const currentWeek = getCurrentWeek(projectCreatedAt);

  // Group tasks by week
  const weeks: Record<number, Task[]> = {};
  for (let w = 1; w <= 12; w++) weeks[w] = [];
  for (const task of localTasks) {
    const w = task.week_number;
    if (w >= 1 && w <= 12) weeks[w].push(task);
  }

  function handleStatusChange(taskId: string, newStatus: string) {
    // Optimistic update
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus as Task["status"],
              completed_at:
                newStatus === "DONE" ? new Date().toISOString() : null,
            }
          : t
      )
    );

    startTransition(async () => {
      await updateTaskStatus(taskId, newStatus);
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
        const weekTasks = weeks[week];
        const done = weekTasks.filter((t) => t.status === "DONE").length;
        const isCurrent = week === currentWeek;
        const isPast = week < currentWeek;

        return (
          <Card
            key={week}
            className={cn(
              "transition-shadow",
              isCurrent && "ring-2 ring-primary shadow-md",
              isPast && "opacity-70"
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>
                  Tydzień {week}
                  {isCurrent && (
                    <Badge className="ml-2 text-[10px]" variant="default">
                      Teraz
                    </Badge>
                  )}
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  {done}/{weekTasks.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList
                tasks={weekTasks}
                compact
                onStatusChange={handleStatusChange}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function getCurrentWeek(projectCreatedAt: string): number {
  const created = new Date(projectCreatedAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(12, diffWeeks + 1));
}
