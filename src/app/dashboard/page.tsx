import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TaskList } from "@/components/planner/task-list";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get the first project (single-project MVP)
  const { data: project } = await supabase
    .from("seo_projects")
    .select("*")
    .limit(1)
    .single();

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-2xl font-semibold">Brak projektu</h2>
        <p className="text-muted-foreground">
          Zaimportuj dane, aby rozpocząć.
        </p>
        <a
          href="/dashboard/import"
          className="text-primary underline underline-offset-4"
        >
          Przejdź do importu
        </a>
      </div>
    );
  }

  // Fetch stats
  const [
    { count: clusterCount },
    { count: keywordCount },
    { count: taskCount },
    { count: doneTaskCount },
    { data: clusters },
    { data: thisWeekTasks },
  ] = await Promise.all([
    supabase
      .from("seo_clusters")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id),
    supabase
      .from("seo_keywords")
      .select("*", { count: "exact", head: true })
      .in(
        "cluster_id",
        (
          await supabase
            .from("seo_clusters")
            .select("id")
            .eq("project_id", project.id)
        ).data?.map((c: { id: string }) => c.id) || []
      ),
    supabase
      .from("seo_tasks")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id),
    supabase
      .from("seo_tasks")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id)
      .eq("status", "DONE"),
    supabase
      .from("seo_clusters")
      .select("*")
      .eq("project_id", project.id)
      .order("potential_score", { ascending: false }),
    supabase
      .from("seo_tasks")
      .select("*, cluster:seo_clusters(*)")
      .eq("project_id", project.id)
      .eq("week_number", getCurrentWeek(project.created_at))
      .order("sort_order"),
  ]);

  const coverageStats = getCoverageStats(clusters || []);
  const completionPct =
    taskCount && doneTaskCount
      ? Math.round((doneTaskCount / taskCount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{project.domain}</h1>
        <p className="text-muted-foreground">{project.name}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Klastry" value={clusterCount || 0} />
        <StatCard title="Keywords" value={keywordCount || 0} />
        <StatCard title="Taski" value={taskCount || 0} />
        <StatCard
          title="Ukończone"
          value={`${completionPct}%`}
          subtitle={`${doneTaskCount || 0}/${taskCount || 0}`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coverage Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={coverageStats.coveredPct} className="h-2" />
            <div className="grid grid-cols-2 gap-2 text-sm">
              {coverageStats.items.map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${color}`}
                  />
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium ml-auto">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* This week */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Ten tydzień (W{getCurrentWeek(project.created_at)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {thisWeekTasks && thisWeekTasks.length > 0 ? (
              <TaskList tasks={thisWeekTasks} compact />
            ) : (
              <p className="text-sm text-muted-foreground">
                Brak tasków na ten tydzień
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top clusters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top klastry wg Potential Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(clusters || []).slice(0, 5).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={c.priority === "P0" ? "default" : "secondary"}>
                    {c.priority}
                  </Badge>
                  <span className="text-sm font-medium">{c.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {c.core_outer}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{c.keywords_count} kw</span>
                  <span>vol {c.total_volume}</span>
                  <span className="font-mono font-medium text-foreground">
                    {c.potential_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function getCurrentWeek(projectCreatedAt: string): number {
  const created = new Date(projectCreatedAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(12, diffWeeks + 1));
}

interface ClusterRow {
  coverage_status: string;
}

function getCoverageStats(clusters: ClusterRow[]) {
  const counts: Record<string, number> = {
    COVERED: 0,
    PARTIAL: 0,
    GAP: 0,
    INDEX_EXISTING: 0,
    UNKNOWN: 0,
  };
  for (const c of clusters) {
    counts[c.coverage_status] = (counts[c.coverage_status] || 0) + 1;
  }
  const total = clusters.length || 1;
  const covered = counts.COVERED + counts.INDEX_EXISTING;

  return {
    coveredPct: Math.round((covered / total) * 100),
    items: [
      { label: "Covered", count: counts.COVERED, color: "bg-green-500" },
      { label: "Partial", count: counts.PARTIAL, color: "bg-yellow-500" },
      { label: "Gap", count: counts.GAP, color: "bg-red-500" },
      {
        label: "Index Existing",
        count: counts.INDEX_EXISTING,
        color: "bg-blue-500",
      },
    ],
  };
}
