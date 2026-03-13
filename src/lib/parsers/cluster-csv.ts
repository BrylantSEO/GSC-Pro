import Papa from "papaparse";
import type {
  Priority,
  CoreOuter,
  CoverageStatus,
  ClusterType,
} from "@/lib/supabase/types";

interface RawClusterRow {
  keyword: string;
  cluster_id: string;
  cluster_name?: string;
  canonical_query?: string;
  central_entity?: string;
  cluster_type?: string;
  core_outer?: string;
  priority?: string;
  coverage_status?: string;
  existing_url?: string;
  target_url?: string;
  total_volume?: string;
  avg_kd?: string;
  avg_cpc?: string;
  potential_score?: string;
  typ?: string;
  volume?: string;
  kd?: string;
  cpc?: string;
}

export interface ParsedCluster {
  cluster_id: number;
  name: string;
  canonical_query: string | null;
  central_entity: string | null;
  cluster_type: ClusterType;
  core_outer: CoreOuter;
  priority: Priority;
  coverage_status: CoverageStatus;
  existing_url: string | null;
  target_url: string | null;
  total_volume: number;
  avg_kd: number;
  avg_cpc: number;
  potential_score: number;
  keywords: ParsedKeyword[];
}

export interface ParsedKeyword {
  keyword: string;
  typ: string | null;
  volume: number;
  kd: number;
  cpc: number;
}

function safeNum(val: string | undefined, fallback: number = 0): number {
  if (!val) return fallback;
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
}

function safePriority(val: string | undefined): Priority {
  if (val && ["P0", "P1", "P2", "P3"].includes(val)) return val as Priority;
  return "P3";
}

function safeCoreOuter(val: string | undefined): CoreOuter {
  if (val === "CORE" || val === "OUTER") return val;
  return "CORE";
}

function safeCoverage(val: string | undefined): CoverageStatus {
  const valid = ["COVERED", "PARTIAL", "GAP", "INDEX_EXISTING", "UNKNOWN"];
  if (val && valid.includes(val)) return val as CoverageStatus;
  return "UNKNOWN";
}

function safeClusterType(val: string | undefined): ClusterType {
  if (val === "SERVICE") return "SERVICE";
  return "PRODUCT";
}

export function parseClusterCSV(csvText: string): ParsedCluster[] {
  const { data, errors } = Papa.parse<RawClusterRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  if (errors.length > 0) {
    console.warn("CSV parse warnings:", errors);
  }

  // Group rows by cluster_id
  const clusterMap = new Map<number, RawClusterRow[]>();
  for (const row of data) {
    const cid = parseInt(row.cluster_id);
    if (isNaN(cid)) continue;
    if (!clusterMap.has(cid)) clusterMap.set(cid, []);
    clusterMap.get(cid)!.push(row);
  }

  const clusters: ParsedCluster[] = [];
  for (const [clusterId, rows] of clusterMap) {
    // Use first row for cluster-level metadata
    const first = rows[0];

    const keywords: ParsedKeyword[] = rows.map((r) => ({
      keyword: r.keyword?.trim() || "",
      typ: r.typ || null,
      volume: safeNum(r.volume),
      kd: safeNum(r.kd),
      cpc: safeNum(r.cpc),
    }));

    clusters.push({
      cluster_id: clusterId,
      name: first.cluster_name || `Cluster ${clusterId}`,
      canonical_query: first.canonical_query || null,
      central_entity: first.central_entity || null,
      cluster_type: safeClusterType(first.cluster_type),
      core_outer: safeCoreOuter(first.core_outer),
      priority: safePriority(first.priority),
      coverage_status: safeCoverage(first.coverage_status),
      existing_url: first.existing_url || null,
      target_url: first.target_url || null,
      total_volume: safeNum(first.total_volume),
      avg_kd: safeNum(first.avg_kd, 50),
      avg_cpc: safeNum(first.avg_cpc),
      potential_score: safeNum(first.potential_score),
      keywords,
    });
  }

  return clusters.sort((a, b) => a.cluster_id - b.cluster_id);
}
