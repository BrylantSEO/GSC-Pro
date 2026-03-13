import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COVERAGE_COLORS: Record<string, string> = {
  COVERED: "bg-green-100 text-green-700",
  PARTIAL: "bg-yellow-100 text-yellow-700",
  GAP: "bg-red-100 text-red-700",
  INDEX_EXISTING: "bg-blue-100 text-blue-700",
  UNKNOWN: "bg-gray-100 text-gray-600",
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: "bg-red-600 text-white",
  P1: "bg-orange-500 text-white",
  P2: "bg-yellow-500 text-black",
  P3: "bg-gray-400 text-white",
};

export default async function ClustersPage() {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("seo_projects")
    .select("*")
    .limit(1)
    .single();

  if (!project) {
    return <p className="text-muted-foreground">Brak projektu.</p>;
  }

  const { data: clusters } = await supabase
    .from("clusters")
    .select("*")
    .eq("project_id", project.id)
    .order("potential_score", { ascending: false });

  const coreCount = clusters?.filter((c) => c.core_outer === "CORE").length || 0;
  const outerCount = clusters?.filter((c) => c.core_outer === "OUTER").length || 0;
  const totalKw = clusters?.reduce((s, c) => s + (c.keywords_count || 0), 0) || 0;
  const totalVol = clusters?.reduce((s, c) => s + (c.total_volume || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Klastry</h1>
        <p className="text-muted-foreground">
          {clusters?.length || 0} klastrów | {coreCount} CORE, {outerCount}{" "}
          OUTER | {totalKw} keywords | vol {totalVol.toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="CORE" value={coreCount} />
        <MiniStat label="OUTER" value={outerCount} />
        <MiniStat label="Keywords" value={totalKw} />
        <MiniStat label="Volume" value={totalVol.toLocaleString()} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wszystkie klastry</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nazwa</TableHead>
                <TableHead>Canonical Query</TableHead>
                <TableHead className="text-center">Typ</TableHead>
                <TableHead className="text-center">Priorytet</TableHead>
                <TableHead className="text-center">Coverage</TableHead>
                <TableHead className="text-right">KW</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">KD</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(clusters || []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-muted-foreground">
                    {c.cluster_id}
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {c.canonical_query}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {c.core_outer}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={`text-[10px] ${PRIORITY_COLORS[c.priority] || ""}`}
                    >
                      {c.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={`text-[10px] ${COVERAGE_COLORS[c.coverage_status] || ""}`}
                    >
                      {c.coverage_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{c.keywords_count}</TableCell>
                  <TableCell className="text-right">
                    {c.total_volume?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{c.avg_kd}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {c.potential_score}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
