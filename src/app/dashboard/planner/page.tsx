import { createClient } from "@/lib/supabase/server";
import { WeeklyBoard } from "@/components/planner/weekly-board";

export default async function PlannerPage() {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("seo_projects")
    .select("*")
    .limit(1)
    .single();

  if (!project) {
    return (
      <p className="text-muted-foreground">
        Brak projektu. Zaimportuj dane.
      </p>
    );
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, cluster:clusters(*)")
    .eq("project_id", project.id)
    .order("week_number")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Weekly Planner</h1>
          <p className="text-muted-foreground">
            12-tygodniowy plan pracy — {project.domain}
          </p>
        </div>
      </div>

      <WeeklyBoard
        tasks={tasks || []}
        projectId={project.id}
        projectCreatedAt={project.created_at}
      />
    </div>
  );
}
