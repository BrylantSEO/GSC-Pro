import Papa from "papaparse";
import type {
  Priority,
  CoreOuter,
  CoverageStatus,
  ClusterType,
} from "@/lib/supabase/types";

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

/**
 * Detects CSV format and parses accordingly:
 *
 * Format A — "named" CSV (cluster-per-row from cluster-namer pipeline):
 *   cluster_id,nazwa,central_entity,canonical_query,liczba_keywords,typ_atrybutu,
 *   total_volume,avg_position,potential_score,priority,coverage_status,opis
 *
 * Format B — "clustered" CSV (keyword-per-row from clustering pipeline):
 *   keyword,cluster_id,typ
 *
 * Format C — combined (keyword-per-row with cluster metadata):
 *   keyword,cluster_id,cluster_name,canonical_query,...,volume,kd,cpc
 */
export function parseClusterCSV(csvText: string): ParsedCluster[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, errors } = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  if (errors.length > 0) {
    console.warn("CSV parse warnings:", errors);
  }

  if (data.length === 0) return [];

  const headers = Object.keys(data[0]);
  const hasKeywordColumn = headers.includes("keyword");
  const hasNazwaColumn = headers.includes("nazwa");

  // Format A: named CSV (cluster-per-row, no individual keywords)
  if (hasNazwaColumn && !hasKeywordColumn) {
    return parseNamedFormat(data);
  }

  // Format B/C: keyword-per-row
  return parseKeywordPerRowFormat(data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseNamedFormat(data: Record<string, any>[]): ParsedCluster[] {
  const clusters: ParsedCluster[] = [];

  for (const row of data) {
    const cid = parseInt(row.cluster_id);
    if (isNaN(cid)) continue;

    clusters.push({
      cluster_id: cid,
      name: row.nazwa || row.name || `Cluster ${cid}`,
      canonical_query: row.canonical_query || null,
      central_entity: row.central_entity || null,
      cluster_type: safeClusterType(row.typ_atrybutu || row.cluster_type),
      core_outer: safeCoreOuter(row.core_outer),
      priority: safePriority(row.priority),
      coverage_status: safeCoverage(row.coverage_status),
      existing_url: row.existing_url || null,
      target_url: row.target_url || null,
      total_volume: safeNum(row.total_volume),
      avg_kd: safeNum(row.avg_kd, 50),
      avg_cpc: safeNum(row.avg_cpc),
      potential_score: safeNum(row.potential_score),
      keywords_count: safeNum(row.liczba_keywords || row.keywords_count),
      keywords: [], // no individual keywords in this format
    } as ParsedCluster & { keywords_count: number });
  }

  return clusters.sort((a, b) => a.cluster_id - b.cluster_id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseKeywordPerRowFormat(data: Record<string, any>[]): ParsedCluster[] {
  // Group rows by cluster_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterMap = new Map<number, Record<string, any>[]>();
  for (const row of data) {
    const cid = parseInt(row.cluster_id);
    if (isNaN(cid)) continue;
    if (!clusterMap.has(cid)) clusterMap.set(cid, []);
    clusterMap.get(cid)!.push(row);
  }

  const clusters: ParsedCluster[] = [];
  for (const [clusterId, rows] of clusterMap) {
    const first = rows[0];

    const keywords: ParsedKeyword[] = rows.map((r) => ({
      keyword: (r.keyword || "").trim(),
      typ: r.typ || null,
      volume: safeNum(r.volume),
      kd: safeNum(r.kd),
      cpc: safeNum(r.cpc),
    }));

    clusters.push({
      cluster_id: clusterId,
      name: first.cluster_name || first.nazwa || `Cluster ${clusterId}`,
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

/**
 * Merges a named CSV (cluster metadata) with a clustered CSV (keywords).
 * Use when you have both files from the pipeline.
 */
export function mergeClusterData(
  namedCsv: string,
  clusteredCsv: string
): ParsedCluster[] {
  const metadata = parseClusterCSV(namedCsv);
  const keywords = parseClusterCSV(clusteredCsv);

  const keywordMap = new Map<number, ParsedKeyword[]>();
  for (const c of keywords) {
    keywordMap.set(c.cluster_id, c.keywords);
  }

  return metadata.map((c) => ({
    ...c,
    keywords: keywordMap.get(c.cluster_id) || [],
  }));
}
