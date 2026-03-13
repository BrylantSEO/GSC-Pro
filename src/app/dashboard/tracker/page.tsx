import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function TrackerPage() {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("seo_projects")
    .select("*")
    .limit(1)
    .single();

  if (!project) {
    return <p className="text-muted-foreground">Brak projektu.</p>;
  }

  // Get pages with GSC data (aggregated)
  const { data: pages } = await supabase
    .from("gsc_page_daily")
    .select("page_url, total_clicks, total_impressions, avg_position, queries_count, date")
    .eq("project_id", project.id)
    .order("date", { ascending: false })
    .limit(500);

  // Get interventions for markers
  const { data: interventions } = await supabase
    .from("interventions")
    .select("*")
    .eq("project_id", project.id)
    .order("intervention_date", { ascending: false });

  // Aggregate pages: latest data per URL
  const pageMap = new Map<
    string,
    {
      url: string;
      clicks: number;
      impressions: number;
      position: number;
      queries: number;
      interventionCount: number;
    }
  >();

  for (const p of pages || []) {
    if (!pageMap.has(p.page_url)) {
      pageMap.set(p.page_url, {
        url: p.page_url,
        clicks: p.total_clicks,
        impressions: p.total_impressions,
        position: p.avg_position,
        queries: p.queries_count,
        interventionCount: 0,
      });
    }
  }

  // Count interventions per URL
  for (const intv of interventions || []) {
    for (const url of intv.urls) {
      const entry = pageMap.get(url);
      if (entry) {
        entry.interventionCount++;
      }
    }
  }

  const sortedPages = Array.from(pageMap.values()).sort(
    (a, b) => b.clicks - a.clicks
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Performance Tracker</h1>
        <p className="text-muted-foreground">
          Śledź widoczność stron w GSC i wpływ interwencji
        </p>
      </div>

      {sortedPages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Brak danych GSC. Dodaj dane przez import lub poczekaj na cron.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Możesz już logować interwencje w zakładce Interwencje.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Strony ({sortedPages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedPages.map((p) => (
                <Link
                  key={p.url}
                  href={`/dashboard/tracker/${encodeURIComponent(p.url)}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-medium truncate">
                      {p.url}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{p.clicks} clicks</span>
                      <span>{p.impressions} impressions</span>
                      <span>pos {p.position.toFixed(1)}</span>
                      <span>{p.queries} queries</span>
                    </div>
                  </div>
                  {p.interventionCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {p.interventionCount} interwencji
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
