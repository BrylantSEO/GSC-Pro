-- SEO Project Dashboard — Initial Schema

-- Projects
CREATE TABLE seo_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  gsc_property TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  config JSONB DEFAULT '{}'::jsonb
);

-- Clusters
CREATE TABLE clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE NOT NULL,
  cluster_id INT NOT NULL,
  name TEXT NOT NULL,
  canonical_query TEXT,
  central_entity TEXT,
  cluster_type TEXT DEFAULT 'PRODUCT' CHECK (cluster_type IN ('PRODUCT','SERVICE')),
  core_outer TEXT CHECK (core_outer IN ('CORE','OUTER')),
  priority TEXT CHECK (priority IN ('P0','P1','P2','P3')),
  coverage_status TEXT DEFAULT 'UNKNOWN' CHECK (coverage_status IN ('COVERED','PARTIAL','GAP','INDEX_EXISTING','UNKNOWN')),
  existing_url TEXT,
  target_url TEXT,
  total_volume INT DEFAULT 0,
  avg_kd REAL DEFAULT 50,
  avg_cpc REAL DEFAULT 0,
  potential_score REAL DEFAULT 0,
  keywords_count INT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(project_id, cluster_id)
);

-- Keywords
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  typ TEXT,
  volume INT DEFAULT 0,
  kd REAL DEFAULT 0,
  cpc REAL DEFAULT 0,
  current_position INT,
  current_url TEXT
);

-- Content briefs
CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE NOT NULL,
  cluster_id UUID REFERENCES clusters(id),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','APPROVED','IN_PROGRESS','DONE')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE NOT NULL,
  cluster_id UUID REFERENCES clusters(id),
  brief_id UUID REFERENCES briefs(id),
  title TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN (
    'CREATE_PAGE','OPTIMIZE_PAGE','WRITE_BLOG',
    'IMPROVE_CTR','EXPAND_CONTENT','INTERNAL_LINKING',
    'TECHNICAL_FIX','SCHEMA_MARKUP'
  )),
  description TEXT,
  target_url TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'TODO' CHECK (status IN ('TODO','IN_PROGRESS','REVIEW','DONE')),
  week_number INT NOT NULL,
  priority TEXT CHECK (priority IN ('P0','P1','P2','P3')),
  effort TEXT CHECK (effort IN ('S','M','L','XL')),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  sort_order INT DEFAULT 0
);

-- Interventions (change log)
CREATE TABLE interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id),
  intervention_date DATE NOT NULL,
  intervention_type TEXT NOT NULL CHECK (intervention_type IN (
    'NEW_PAGE','CONTENT_UPDATE','META_OPTIMIZATION',
    'INTERNAL_LINKING','TECHNICAL_FIX','SCHEMA_MARKUP'
  )),
  urls TEXT[] NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- GSC query-level snapshots
CREATE TABLE gsc_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE NOT NULL,
  snapshot_date DATE NOT NULL,
  page_url TEXT NOT NULL,
  query TEXT NOT NULL,
  clicks INT DEFAULT 0,
  impressions INT DEFAULT 0,
  ctr REAL DEFAULT 0,
  position REAL DEFAULT 0,
  UNIQUE(project_id, snapshot_date, page_url, query)
);

-- GSC page-level daily aggregates
CREATE TABLE gsc_page_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  page_url TEXT NOT NULL,
  total_clicks INT DEFAULT 0,
  total_impressions INT DEFAULT 0,
  avg_position REAL DEFAULT 0,
  avg_ctr REAL DEFAULT 0,
  queries_count INT DEFAULT 0,
  UNIQUE(project_id, date, page_url)
);

-- Content gaps
CREATE TABLE content_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE NOT NULL,
  cluster_id UUID REFERENCES clusters(id),
  gap_title TEXT NOT NULL,
  gap_description TEXT,
  priority TEXT CHECK (priority IN ('P1','P2','P3','P4')),
  source TEXT,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN','ASSIGNED','IN_PROGRESS','RESOLVED')),
  task_id UUID REFERENCES tasks(id)
);

-- Indexes
CREATE INDEX idx_clusters_project ON clusters(project_id);
CREATE INDEX idx_keywords_cluster ON keywords(cluster_id);
CREATE INDEX idx_tasks_project_week ON tasks(project_id, week_number);
CREATE INDEX idx_tasks_status ON tasks(project_id, status);
CREATE INDEX idx_interventions_project_date ON interventions(project_id, intervention_date);
CREATE INDEX idx_gsc_snapshots_project_date ON gsc_snapshots(project_id, snapshot_date);
CREATE INDEX idx_gsc_snapshots_page ON gsc_snapshots(page_url);
CREATE INDEX idx_gsc_page_daily_project ON gsc_page_daily(project_id, date);
CREATE INDEX idx_briefs_project ON briefs(project_id);
CREATE INDEX idx_content_gaps_project ON content_gaps(project_id);

-- RLS (enable later when auth is set up)
-- ALTER TABLE seo_projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
-- etc.
