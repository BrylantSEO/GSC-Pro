import type {
  Cluster,
  Task,
  TaskType,
  Effort,
  Priority,
} from "@/lib/supabase/types";

interface SchedulerConfig {
  totalWeeks: number;
  maxSlotsPerWeek: number;
  projectId: string;
}

const EFFORT_SLOTS: Record<Effort, number> = {
  S: 0.5,
  M: 1,
  L: 1.5,
  XL: 2,
};

const PRIORITY_WEEK_RANGES: Record<Priority, [number, number]> = {
  P0: [1, 4],
  P1: [3, 8],
  P2: [6, 10],
  P3: [8, 12],
};

function classifyTask(cluster: Cluster): { type: TaskType; effort: Effort } {
  const { coverage_status, core_outer } = cluster;

  if (coverage_status === "GAP" || coverage_status === "UNKNOWN") {
    if (core_outer === "CORE") {
      return { type: "CREATE_PAGE", effort: "L" };
    }
    return { type: "WRITE_BLOG", effort: "M" };
  }

  if (coverage_status === "PARTIAL" || coverage_status === "INDEX_EXISTING") {
    return { type: "EXPAND_CONTENT", effort: "M" };
  }

  // COVERED
  return { type: "OPTIMIZE_PAGE", effort: "S" };
}

function generateTitle(cluster: Cluster, taskType: TaskType): string {
  const labels: Record<TaskType, string> = {
    CREATE_PAGE: "Stwórz stronę",
    OPTIMIZE_PAGE: "Optymalizuj",
    WRITE_BLOG: "Napisz wpis blogowy",
    IMPROVE_CTR: "Popraw CTR",
    EXPAND_CONTENT: "Rozbuduj treść",
    INTERNAL_LINKING: "Internal linking",
    TECHNICAL_FIX: "Fix techniczny",
    SCHEMA_MARKUP: "Dodaj schema markup",
  };

  const label = labels[taskType] || taskType;
  return `${label}: ${cluster.canonical_query || cluster.name}`;
}

export function generateSchedule(
  clusters: Cluster[],
  config: SchedulerConfig
): Omit<Task, "id" | "brief_id">[] {
  const { totalWeeks, maxSlotsPerWeek, projectId } = config;

  // Sort: priority ASC, potential_score DESC
  const sorted = [...clusters].sort((a, b) => {
    const pOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
    const pDiff = (pOrder[a.priority] ?? 3) - (pOrder[b.priority] ?? 3);
    if (pDiff !== 0) return pDiff;
    return b.potential_score - a.potential_score;
  });

  // Track slots used per week
  const weekSlots: number[] = new Array(totalWeeks + 1).fill(0);
  // Track task types per week for balancing
  const weekCreates: number[] = new Array(totalWeeks + 1).fill(0);
  const weekBlogs: number[] = new Array(totalWeeks + 1).fill(0);

  const tasks: Omit<Task, "id" | "brief_id">[] = [];

  for (const cluster of sorted) {
    const { type, effort } = classifyTask(cluster);
    const slots = EFFORT_SLOTS[effort];
    const priority = cluster.priority || "P3";
    const [minWeek, maxWeek] = PRIORITY_WEEK_RANGES[priority];

    // Find best week within range
    let bestWeek = -1;
    for (let w = minWeek; w <= Math.min(maxWeek, totalWeeks); w++) {
      // Check capacity
      if (weekSlots[w] + slots > maxSlotsPerWeek) continue;

      // Balancing: max 2 CREATE_PAGE per week
      if (type === "CREATE_PAGE" && weekCreates[w] >= 2) continue;

      // Balancing: max 1 WRITE_BLOG per week
      if (type === "WRITE_BLOG" && weekBlogs[w] >= 1) continue;

      bestWeek = w;
      break;
    }

    // Overflow: find any available week
    if (bestWeek === -1) {
      for (let w = 1; w <= totalWeeks; w++) {
        if (weekSlots[w] + slots <= maxSlotsPerWeek) {
          bestWeek = w;
          break;
        }
      }
    }

    // Still no room — put in last week (overflow)
    if (bestWeek === -1) {
      bestWeek = totalWeeks;
    }

    weekSlots[bestWeek] += slots;
    if (type === "CREATE_PAGE") weekCreates[bestWeek]++;
    if (type === "WRITE_BLOG") weekBlogs[bestWeek]++;

    tasks.push({
      project_id: projectId,
      cluster_id: cluster.id,
      title: generateTitle(cluster, type),
      task_type: type,
      description: `Klaster: ${cluster.name} | Keywords: ${cluster.keywords_count} | Volume: ${cluster.total_volume} | KD: ${cluster.avg_kd}`,
      target_url: cluster.target_url || cluster.existing_url,
      assigned_to: null,
      status: "TODO",
      week_number: bestWeek,
      priority,
      effort,
      completed_at: null,
      notes: null,
      sort_order: tasks.length,
    });
  }

  return tasks;
}
