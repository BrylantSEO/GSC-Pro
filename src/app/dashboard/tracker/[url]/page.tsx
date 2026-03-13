import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PerformanceChart } from "@/components/charts/performance-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PageProps {
  params: Promise<{ url: string }>;
}

export default async function UrlTrackerPage({ params }: PageProps) {
  const { url: encodedUrl } = await params;
  const pageUrl = decodeURIComponent(encodedUrl);
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("seo_projects")
    .select("*")
    .limit(1)
    .single();

  if (!project) return null;

  // Fetch page daily data
  const { data: dailyData } = await supabase
    .from("seo_gsc_page_daily")
    .select("*")
    .eq("project_id", project.id)
    .eq("page_url", pageUrl)
    .order("date");

  // Fetch query-level data (latest snapshot)
  const { data: queryData } = await supabase
    .from("seo_gsc_snapshots")
    .select("*")
    .eq("project_id", project.id)
    .eq("page_url", pageUrl)
    .order("snapshot_date", { ascending: false })
    .limit(100);

  // Fetch interventions for this URL
  const { data: interventions } = await supabase
    .from("seo_interventions")
    .select("*")
    .eq("project_id", project.id)
    .contains("urls", [pageUrl])
    .order("intervention_date", { ascending: false });

  // Latest stats
  const latest = dailyData?.[dailyData.length - 1];

  // Deduplicate queries by latest date
  const queryMap = new Map<string, NonNullable<typeof queryData>[0]>();
  for (const q of queryData || []) {
    if (!queryMap.has(q.query)) queryMap.set(q.query, q);
  }
  const queries = Array.from(queryMap.values()).sort(
    (a, b) => b.impressions - a.impressions
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-mono font-bold">{pageUrl}</h1>
        <p className="text-muted-foreground">{project.domain}</p>
      </div>

      {/* Stats */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat label="Clicks" value={latest.total_clicks} />
          <MiniStat
            label="Impressions"
            value={latest.total_impressions.toLocaleString()}
          />
          <MiniStat label="Avg Position" value={latest.avg_position.toFixed(1)} />
          <MiniStat label="Queries" value={latest.queries_count} />
        </div>
      )}

      {/* Chart */}
      {dailyData && dailyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trend widoczności</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <PerformanceChart
              data={dailyData.map((d) => ({
                date: d.date,
                clicks: d.total_clicks,
                impressions: d.total_impressions,
                position: d.avg_position,
              }))}
              interventions={(interventions || []).map((i) => ({
                date: i.intervention_date,
                description: i.description,
                type: i.intervention_type,
              }))}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Ranking queries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Frazy ({queries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Pos</TableHead>
                  <TableHead className="text-right">Impr</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queries.slice(0, 30).map((q) => (
                  <TableRow key={q.query}>
                    <TableCell className="text-sm">{q.query}</TableCell>
                    <TableCell className="text-right font-mono">
                      {q.position.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      {q.impressions}
                    </TableCell>
                    <TableCell className="text-right">
                      {(q.ctr * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Interventions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interwencje na tym URL</CardTitle>
          </CardHeader>
          <CardContent>
            {!interventions || interventions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak interwencji</p>
            ) : (
              <div className="space-y-3">
                {interventions.map((i) => (
                  <div key={i.id} className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">
                        {i.intervention_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {i.intervention_date}
                      </span>
                    </div>
                    <p className="text-sm">{i.description}</p>
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

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
