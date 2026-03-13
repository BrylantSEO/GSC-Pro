import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InterventionForm } from "@/components/tracker/intervention-form";

const TYPE_LABELS: Record<string, string> = {
  NEW_PAGE: "Nowa strona",
  CONTENT_UPDATE: "Aktualizacja treści",
  META_OPTIMIZATION: "Meta optymalizacja",
  INTERNAL_LINKING: "Internal linking",
  TECHNICAL_FIX: "Fix techniczny",
  SCHEMA_MARKUP: "Schema markup",
};

export default async function InterventionsPage() {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("seo_projects")
    .select("*")
    .limit(1)
    .single();

  if (!project) {
    return <p className="text-muted-foreground">Brak projektu.</p>;
  }

  const { data: interventions } = await supabase
    .from("interventions")
    .select("*")
    .eq("project_id", project.id)
    .order("intervention_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Interwencje</h1>
        <p className="text-muted-foreground">
          Loguj zmiany na stronach, by śledzić ich wpływ na widoczność
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <InterventionForm projectId={project.id} />

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historia interwencji</CardTitle>
          </CardHeader>
          <CardContent>
            {!interventions || interventions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Brak interwencji
              </p>
            ) : (
              <div className="space-y-3">
                {interventions.map((i) => (
                  <div key={i.id} className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">
                        {TYPE_LABELS[i.intervention_type] ||
                          i.intervention_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {i.intervention_date}
                      </span>
                    </div>
                    <p className="text-sm">{i.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {i.urls.map((url: string) => (
                        <Badge
                          key={url}
                          variant="secondary"
                          className="text-[10px] font-mono"
                        >
                          {url}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
