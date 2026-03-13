export type Priority = "P0" | "P1" | "P2" | "P3";
export type CoreOuter = "CORE" | "OUTER";
export type CoverageStatus =
  | "COVERED"
  | "PARTIAL"
  | "GAP"
  | "INDEX_EXISTING"
  | "UNKNOWN";
export type ClusterType = "PRODUCT" | "SERVICE";
export type TaskType =
  | "CREATE_PAGE"
  | "OPTIMIZE_PAGE"
  | "WRITE_BLOG"
  | "IMPROVE_CTR"
  | "EXPAND_CONTENT"
  | "INTERNAL_LINKING"
  | "TECHNICAL_FIX"
  | "SCHEMA_MARKUP";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type Effort = "S" | "M" | "L" | "XL";
export type InterventionType =
  | "NEW_PAGE"
  | "CONTENT_UPDATE"
  | "META_OPTIMIZATION"
  | "INTERNAL_LINKING"
  | "TECHNICAL_FIX"
  | "SCHEMA_MARKUP";
export type GapPriority = "P1" | "P2" | "P3" | "P4";
export type GapStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED";
export type BriefStatus = "DRAFT" | "APPROVED" | "IN_PROGRESS" | "DONE";

export interface Project {
  id: string;
  name: string;
  domain: string;
  gsc_property: string | null;
  created_at: string;
  config: Record<string, unknown>;
}

export interface Cluster {
  id: string;
  project_id: string;
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
  keywords_count: number;
  metadata: Record<string, unknown>;
}

export interface Keyword {
  id: string;
  cluster_id: string;
  keyword: string;
  typ: string | null;
  volume: number;
  kd: number;
  cpc: number;
  current_position: number | null;
  current_url: string | null;
}

export interface Brief {
  id: string;
  project_id: string;
  cluster_id: string | null;
  slug: string;
  title: string;
  content_md: string;
  status: BriefStatus;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  cluster_id: string | null;
  brief_id: string | null;
  title: string;
  task_type: TaskType;
  description: string | null;
  target_url: string | null;
  assigned_to: string | null;
  status: TaskStatus;
  week_number: number;
  priority: Priority;
  effort: Effort;
  completed_at: string | null;
  notes: string | null;
  sort_order: number;
  // Joined
  cluster?: Cluster;
  brief?: Brief;
}

export interface Intervention {
  id: string;
  project_id: string;
  task_id: string | null;
  intervention_date: string;
  intervention_type: InterventionType;
  urls: string[];
  description: string;
  metadata: Record<string, unknown>;
}

export interface GscSnapshot {
  id: string;
  project_id: string;
  snapshot_date: string;
  page_url: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPageDaily {
  id: string;
  project_id: string;
  date: string;
  page_url: string;
  total_clicks: number;
  total_impressions: number;
  avg_position: number;
  avg_ctr: number;
  queries_count: number;
}

export interface ContentGap {
  id: string;
  project_id: string;
  cluster_id: string | null;
  gap_title: string;
  gap_description: string | null;
  priority: GapPriority;
  source: string | null;
  status: GapStatus;
  task_id: string | null;
}
