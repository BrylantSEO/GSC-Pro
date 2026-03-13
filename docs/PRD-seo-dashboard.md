# PRD: SEO Project Dashboard

**Wersja:** 1.0 | **Data:** 2026-03-13 | **Autor:** Double Digital

---

## 1. Executive Summary

### Problem Statement

Zarządzanie projektami SEO odbywa się przez CLI, pliki markdown i manualne koordynowanie pracy w repozytorium. Brak wizualnego dashboardu powoduje:
- Utratę kontekstu między sesjami (trzeba czytać Session Log, known-issues, vault)
- Brak automatycznego rozkładu pracy na tygodnie — planowanie jest mentalne
- Brak widoczności postępów dla członków zespołu
- Brak powiązania "zrobiłem zmianę X" → "widoczność strony Y wzrosła/spadła"
- Dane z 4+ źródeł (GSC, Senuto, Supabase, Neo4j) nigdy nie są widoczne w jednym miejscu

### Proposed Solution

Wewnętrzna aplikacja webowa (Next.js + Supabase + Vercel) z trzema głównymi widokami:

1. **Project Board** — stan projektu SEO klienta: klastry, strony, content gaps, priorytety
2. **Weekly Planner** — automatycznie rozłożony plan pracy na 12 tygodni z konkretnymi taskami
3. **Performance Tracker** — GSC + Senuto dane z timeline zmian i wizualizacją wpływu interwencji

### Success Criteria

| KPI | Cel | Pomiar |
|-----|-----|--------|
| Czas onboardingu projektu | < 15 min od importu danych do gotowego planu | Timestamp first import → first weekly plan generated |
| Pokrycie tasków w tygodniu | 100% tygodni ma min. 2 taski przypisane | Automatyczna walidacja przy generowaniu planu |
| Czas do wglądu w postępy | < 30 sekund od otwarcia dashboardu | Lighthouse TTI |
| Adoption przez zespół | 3+ osoby korzystają regularnie w ciągu 30 dni | Unikalni użytkownicy/tydzień |
| Korelacja zmian-wyników | Widoczna na timeline w < 2 kliknięcia | UX test |

---

## 2. User Experience & Functionality

### User Personas

#### Persona 1: SEO Strategist (Ty)
- Prowadzi analizy, generuje klastry, pisze briefe, planuje strategię
- Potrzebuje: szybki przegląd "co robię w tym tygodniu", tracking postępów, logowanie interwencji
- Frustration: rozproszone dane w plikach, brak wizualnego planu

#### Persona 2: Content Writer (Członek zespołu)
- Dostaje konkretne zadania: "napisz treść na stronę X wg briefu Y"
- Potrzebuje: jasna lista tasków, dostęp do briefu, deadline
- Frustration: nie wie co jest priorytetem, musi pytać

#### Persona 3: Klient (przyszłość, v2.0)
- Chce widzieć postępy: ile stron stworzono, jak zmienia się widoczność
- Read-only dashboard z kluczowymi metrykami

---

### User Stories & Acceptance Criteria

#### Epic 1: Project Setup & Import

**US-1.1** — Jako SEO Strategist, chcę zaimportować wyniki analizy (klastry, topical map, briefe) do dashboardu, żeby mieć pełny obraz projektu.

AC:
- [ ] Import CSV z klastrami (`_named.csv` lub `_clustered.csv`) — parser rozpoznaje kolumny: keyword, cluster_id, cluster_name, canonical_query, coverage_status, potential_score
- [ ] Import topical map (markdown) — parser wyciąga: CORE/OUTER, priorytety P0-P3, pillar pages
- [ ] Import content gaps (markdown) — parser wyciąga gaps z priorytetami P1-P4
- [ ] Import briefów (markdown z `data/briefs/*/brief.md`) — linkowanie do klastrów
- [ ] Automatyczne tworzenie projektu z metadanymi: nazwa klienta, domena, data analizy, liczba keywords/klastrów
- [ ] Walidacja: duplikaty projektów wykrywane po domenie

**US-1.2** — Jako SEO Strategist, chcę podłączyć GSC do projektu, żeby widzieć dane o widoczności.

AC:
- [ ] Konfiguracja GSC property (site_url) per projekt
- [ ] Automatyczny pull danych GSC co 24h (cron job lub on-demand)
- [ ] Przechowywanie historii: clicks, impressions, CTR, position per query per page per dzień
- [ ] Snapshot przy tworzeniu projektu = baseline

**US-1.3** — Jako SEO Strategist, chcę zobaczyć podsumowanie projektu zaraz po imporcie.

AC:
- [ ] Dashboard overview: liczba klastrów, keywords, stron istniejących vs brakujących, content gaps
- [ ] Rozkład priorytetów (P0-P3) w formie donut chart
- [ ] Top 5 klastrów wg potential_score z kluczowymi metrykami
- [ ] Coverage status: COVERED / PARTIAL / GAP / INDEX_EXISTING — procent

---

#### Epic 2: Weekly Planner (Auto-scheduling)

**US-2.1** — Jako SEO Strategist, chcę żeby system automatycznie rozłożył mi pracę na 12 tygodni (3 miesiące) na podstawie priorytetów.

AC:
- [ ] Algorytm schedulowania:
  - Input: klastry z priorytetem (P0-P3), coverage_status (GAP/PARTIAL/COVERED), typ strony (pillar/supporting/blog), potential_score
  - Reguły:
    - P0 w tygodniach 1-4 (pierwszych)
    - P1 w tygodniach 3-8
    - P2 w tygodniach 6-10
    - P3 w tygodniach 8-12
    - Pillar pages przed supporting pages tego samego klastra (bo internal linking)
    - Max 2-3 content pieces per tydzień (realistyczne tempo)
    - Blog posts przeplatane ze stronami usługowymi (nie same blogi z rzędu)
    - Strony COVERED → task "OPTIMIZE" (nie "CREATE"), mniejszy effort
    - Strony PARTIAL → task "EXPAND + INTERNAL LINK"
  - Output: lista tasków per tydzień z typem (CREATE_PAGE / OPTIMIZE_PAGE / WRITE_BLOG / IMPROVE_CTR)
- [ ] Ręczne przesuwanie tasków między tygodniami (drag & drop)
- [ ] Regeneracja planu po zmianach (np. dodanie nowego klastra)

**US-2.2** — Jako SEO Strategist, chcę widzieć co mam zrobić w tym tygodniu.

AC:
- [ ] Widok "This Week": lista tasków z typem, klastrem, canonical query, linkiem do briefu
- [ ] Status tasku: TODO / IN_PROGRESS / REVIEW / DONE
- [ ] Kliknięcie w task → sidebar z: brief (markdown rendered), target keywords, existing page URL (jeśli OPTIMIZE), internal linking suggestions
- [ ] Wskaźnik completion: X/Y tasków zrobionych w tym tygodniu

**US-2.3** — Jako Content Writer, chcę widzieć moje przypisane taski z pełnym kontekstem.

AC:
- [ ] Filtrowanie tasków po assigned person
- [ ] Każdy task zawiera: tytuł, typ, klaster, brief (jeśli istnieje), docelowy URL, deadline (tydzień)
- [ ] Oznaczanie tasku jako DONE z opcjonalnym komentarzem (np. "opublikowano pod URL X")

---

#### Epic 3: Performance Tracker & Intervention Log

**US-3.1** — Jako SEO Strategist, chcę logować interwencje (zmiany na stronie) i widzieć ich wpływ na widoczność.

AC:
- [ ] Formularz interwencji:
  - Data
  - Typ: NEW_PAGE / CONTENT_UPDATE / META_OPTIMIZATION / INTERNAL_LINKING / TECHNICAL_FIX / SCHEMA_MARKUP
  - Dotyczy URL(s)
  - Opis zmian (free text)
  - Powiązany task (opcjonalnie)
- [ ] Interwencje wyświetlane jako vertical markers na timeline widoczności
- [ ] Hover na marker → tooltip z opisem zmian

**US-3.2** — Jako SEO Strategist, chcę widzieć jak zmienia się widoczność konkretnej podstrony po moich zmianach.

AC:
- [ ] Wykres per URL: clicks + impressions + avg. position over time (dane GSC)
- [ ] Vertical markers = interwencje na tym URL
- [ ] Tabela: frazy rankujące na ten URL z pozycją, zmianą pozycji (trend), impressions, CTR
- [ ] Nowe frazy: highlight fraz które pojawiły się po ostatniej interwencji (nie było ich w previous snapshot)
- [ ] Utracone frazy: highlight fraz które zniknęły

**US-3.3** — Jako SEO Strategist, chcę widzieć globalny trend projektu.

AC:
- [ ] Dashboard-level: total clicks, total impressions, avg position — trend 30/60/90 dni
- [ ] Top growing pages (biggest position improvement)
- [ ] Top declining pages (alert)
- [ ] Interwencje na global timeline (wszystkie URLe)

**US-3.4** — Jako SEO Strategist, chcę porównać stan "przed" i "po" dla konkretnego URL.

AC:
- [ ] Wybierz URL + datę interwencji → automatyczne porównanie:
  - Pozycje fraz: before (7 dni przed) vs after (14 dni po)
  - Nowe frazy w after
  - CTR change
  - Impressions change
- [ ] Tabela diff z kolorowym kodowaniem (zielony = poprawa, czerwony = spadek)

---

#### Epic 4: Project Overview & Cluster Visualization

**US-4.1** — Jako SEO Strategist, chcę widzieć topical map projektu wizualnie.

AC:
- [ ] Widok drzewa/mindmapy: Pillar → Supporting → Blog posts
- [ ] Kolorowanie: P0 (czerwony), P1 (pomarańczowy), P2 (żółty), P3 (szary)
- [ ] Status strony na node: EXISTS / DRAFT / PUBLISHED / NEEDS_UPDATE
- [ ] Kliknięcie na node → szczegóły: keywords, potential_score, GSC metrics (jeśli strona istnieje)

**US-4.2** — Jako SEO Strategist, chcę widzieć content gaps wizualnie.

AC:
- [ ] Lista gaps z priorytetem P1-P4, opisem, powiązanym klastrem
- [ ] Status: OPEN / ASSIGNED / IN_PROGRESS / RESOLVED
- [ ] Automatyczne linkowanie gap → task w weekly planner (jeśli task istnieje)

---

### Non-Goals (v1.0)

- Automatyczne generowanie treści (briefe/artykuły) z poziomu dashboardu — to robi Claude w repo
- Integracja z CMS klienta (WordPress, etc.) — manualne wdrożenie
- Zarządzanie wieloma projektami jednocześnie (v1 = single project, v2 = multi-project)
- Client-facing portal (v2.0)
- Automatyczne wnioskowanie przyczynowości zmiana → efekt (correlation, not causation)
- Scraping/crawling stron z dashboardu — to robi domain_intelligence.py

---

## 3. Data Model & Integration

### Supabase Tables (nowe)

```sql
-- Projekt SEO
CREATE TABLE seo_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  gsc_property TEXT,                    -- np. 'sc-domain:krakowrolety.pl'
  created_at TIMESTAMPTZ DEFAULT now(),
  config JSONB DEFAULT '{}'::jsonb      -- client metadata, CSI, etc.
);

-- Klastry (z importu)
CREATE TABLE clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE,
  cluster_id INT NOT NULL,              -- oryginalny cluster_id z CSV
  name TEXT NOT NULL,
  canonical_query TEXT,
  central_entity TEXT,
  cluster_type TEXT DEFAULT 'PRODUCT',  -- PRODUCT / SERVICE
  core_outer TEXT CHECK (core_outer IN ('CORE', 'OUTER')),
  priority TEXT CHECK (priority IN ('P0','P1','P2','P3')),
  coverage_status TEXT CHECK (coverage_status IN ('COVERED','PARTIAL','GAP','INDEX_EXISTING','UNKNOWN')),
  existing_url TEXT,                    -- URL istniejącej strony (jeśli COVERED/PARTIAL)
  target_url TEXT,                      -- docelowy URL (np. /rolety-krakow/)
  total_volume INT DEFAULT 0,
  avg_kd REAL DEFAULT 50,
  avg_cpc REAL DEFAULT 0,
  potential_score REAL DEFAULT 0,
  keywords_count INT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(project_id, cluster_id)
);

-- Keywords (z importu)
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  typ TEXT,                             -- seed, expansion, local_variant, gsc_confirmed
  volume INT DEFAULT 0,
  kd REAL DEFAULT 0,
  cpc REAL DEFAULT 0,
  current_position INT,                 -- z Senuto/GSC
  current_url TEXT                      -- URL który rankuje
);

-- Content briefs (z importu)
CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES clusters(id),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,             -- pełny brief markdown
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','APPROVED','IN_PROGRESS','DONE')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Taski (auto-generated + manual)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE,
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
  assigned_to TEXT,                     -- email lub imię
  status TEXT DEFAULT 'TODO' CHECK (status IN ('TODO','IN_PROGRESS','REVIEW','DONE')),
  week_number INT NOT NULL,             -- 1-12
  priority TEXT CHECK (priority IN ('P0','P1','P2','P3')),
  effort TEXT CHECK (effort IN ('S','M','L','XL')),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  sort_order INT DEFAULT 0
);

-- Interwencje (change log)
CREATE TABLE interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id),
  intervention_date DATE NOT NULL,
  intervention_type TEXT NOT NULL CHECK (intervention_type IN (
    'NEW_PAGE','CONTENT_UPDATE','META_OPTIMIZATION',
    'INTERNAL_LINKING','TECHNICAL_FIX','SCHEMA_MARKUP'
  )),
  urls TEXT[] NOT NULL,                 -- affected URLs
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb    -- dodatkowe dane (np. keywords targeted)
);

-- GSC snapshots (periodic)
CREATE TABLE gsc_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  page_url TEXT NOT NULL,
  query TEXT NOT NULL,
  clicks INT DEFAULT 0,
  impressions INT DEFAULT 0,
  ctr REAL DEFAULT 0,
  position REAL DEFAULT 0,
  UNIQUE(project_id, snapshot_date, page_url, query)
);

-- GSC page-level aggregates (daily)
CREATE TABLE gsc_page_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  page_url TEXT NOT NULL,
  total_clicks INT DEFAULT 0,
  total_impressions INT DEFAULT 0,
  avg_position REAL DEFAULT 0,
  avg_ctr REAL DEFAULT 0,
  queries_count INT DEFAULT 0,          -- ile fraz rankuje
  UNIQUE(project_id, date, page_url)
);

-- Content gaps (z importu)
CREATE TABLE content_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES clusters(id),
  gap_title TEXT NOT NULL,
  gap_description TEXT,
  priority TEXT CHECK (priority IN ('P1','P2','P3','P4')),
  source TEXT,                          -- SERP_TITLE, PAA, RELATED_SEARCH, FILTER_SIDEBAR
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN','ASSIGNED','IN_PROGRESS','RESOLVED')),
  task_id UUID REFERENCES tasks(id)     -- powiązany task jeśli istnieje
);

-- Indeksy
CREATE INDEX idx_gsc_snapshots_project_date ON gsc_snapshots(project_id, snapshot_date);
CREATE INDEX idx_gsc_snapshots_page ON gsc_snapshots(page_url);
CREATE INDEX idx_gsc_page_daily_project ON gsc_page_daily(project_id, date);
CREATE INDEX idx_tasks_project_week ON tasks(project_id, week_number);
CREATE INDEX idx_interventions_project_date ON interventions(project_id, intervention_date);
CREATE INDEX idx_keywords_cluster ON keywords(cluster_id);
```

### Integration Points

| Source | Method | Frequency | Data |
|--------|--------|-----------|------|
| **GSC** | GSC MCP (`mcp__gsc__*`) lub Google API bezpośrednio | On-demand + cron daily | queries, pages, clicks, impressions, position |
| **Senuto** | Senuto MCP (`mcp__senuto__*`) | On-demand (przycisk "Refresh") | positions, volume, KD, competitors |
| **Supabase (istniejący)** | Bezpośredni SQL | Import + read-only | `pages_vectors_krakowrolety` — cosine similarity |
| **Pliki repozytorium** | Import (upload CSV/MD) | Jednorazowo przy setup | clusters CSV, briefs MD, topical map MD |

---

## 4. Technical Specifications

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                      │
│                                                          │
│  Next.js 15 (App Router)                                │
│  ├── /dashboard          → Project overview              │
│  ├── /dashboard/clusters → Cluster & topical map view    │
│  ├── /dashboard/planner  → Weekly planner (12 weeks)     │
│  ├── /dashboard/tracker  → Performance tracker           │
│  ├── /dashboard/tracker/[url] → Single page deep dive    │
│  ├── /api/import         → CSV/MD import endpoints       │
│  ├── /api/gsc            → GSC data fetch & store        │
│  └── /api/scheduler      → Auto-scheduling algorithm     │
│                                                          │
│  UI: Tailwind CSS + shadcn/ui + Recharts                │
│  Auth: Supabase Auth (email invite, no public signup)    │
└──────────────────────┬──────────────────────────────────┘
                       │ Supabase Client SDK
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Supabase (Backend)                      │
│                                                          │
│  PostgreSQL                                              │
│  ├── seo_projects      (project config)                  │
│  ├── clusters          (imported clusters)                │
│  ├── keywords          (imported keywords)                │
│  ├── briefs            (imported content briefs)          │
│  ├── tasks             (auto-scheduled + manual)          │
│  ├── interventions     (change log)                       │
│  ├── gsc_snapshots     (query-level GSC data)            │
│  ├── gsc_page_daily    (page-level aggregates)           │
│  ├── content_gaps      (imported gaps)                    │
│  │                                                       │
│  ├── pages_vectors_krakowrolety (EXISTING — read-only)   │
│  │                                                       │
│  Auth: invite-only, RLS per project                      │
│  Cron: pg_cron for daily GSC fetch                       │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   GSC API        Senuto API    Neo4j (read-only)
  (via proxy)    (via proxy)    (future: entity view)
```

### Tech Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | **Next.js 15** (App Router, Server Components) | Vercel-native, fast SSR, Server Actions |
| Database | **Supabase PostgreSQL** | Already used in project, free tier sufficient |
| Auth | **Supabase Auth** | Email invites, no public signup, RLS |
| UI | **Tailwind CSS + shadcn/ui** | Fast to build, consistent, accessible |
| Charts | **Recharts** | Lightweight, React-native, good for timeseries |
| Deployment | **Vercel** | Zero-config, edge functions, cron |
| State | **React Server Components** + minimal client state | No Redux/Zustand needed |
| Import/Parse | **papaparse** (CSV) + **marked** (MD) | Parsing cluster CSVs and brief markdowns |

### Security & Privacy

- **Auth:** Supabase Auth with email invite-only (no public registration)
- **RLS:** Row Level Security per project — users see only their projects
- **API Keys:** GSC/Senuto tokens stored in Supabase Vault (encrypted), never exposed to client
- **Vercel Environment Variables:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GSC_*`, `SENUTO_*`
- **No PII:** Dashboard stores SEO data only — no customer personal data

---

## 5. Key Screens (Wireframes)

### Screen 1: Project Overview (`/dashboard`)

```
┌─────────────────────────────────────────────────────────┐
│ 🏠 krakowrolety.pl                    [Refresh GSC] [⚙️] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 12       │ │ 337      │ │ 56       │ │ 11       │  │
│  │ Clusters │ │ Keywords │ │ Pages    │ │ Briefs   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                          │
│  ┌─── Coverage ────────┐  ┌─── This Week ────────────┐ │
│  │ ██████░░░░ 58% done │  │ ☐ Napisz /plisy-krakow/  │ │
│  │ COVERED: 18         │  │ ☐ Optymalizuj /rolety-..  │ │
│  │ GAP: 7              │  │ ☑ Blog: "Jak wybrać.."    │ │
│  │ PARTIAL: 5          │  │                           │ │
│  └─────────────────────┘  └───────────────────────────┘ │
│                                                          │
│  ┌─── GSC Trend (30d) ──────────────────────────────┐   │
│  │  📈 Clicks: 245 (+12%)  Impressions: 18.2k (+8%) │   │
│  │  [~~~~~~~~~~~~ chart ~~~~~~~~~~~~~~~~~~~~~~~~~~~~] │   │
│  │  ▲ interwencja: "Nowa strona /plisy-krakow/"      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Screen 2: Weekly Planner (`/dashboard/planner`)

```
┌─────────────────────────────────────────────────────────┐
│ 📅 Weekly Planner                  [Auto-schedule] [+]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Week 1 (Mar 17-23)          Week 2 (Mar 24-30)        │
│  ┌────────────────────┐      ┌────────────────────┐    │
│  │ 🔴 P0 CREATE_PAGE  │      │ 🔴 P0 WRITE_BLOG  │    │
│  │ /rolety-krakow/    │      │ "Jak wybrać rolety │    │
│  │ Brief: ✅ Ready     │      │  do salonu"        │    │
│  │ [View Brief]       │      │ Links → /rolety-.. │    │
│  ├────────────────────┤      ├────────────────────┤    │
│  │ 🟠 P1 OPTIMIZE     │      │ 🔴 P0 CREATE_PAGE  │    │
│  │ /rolety-dzien-noc/ │      │ /plisy-krakow/     │    │
│  │ CTR: 0.1% → target │      │ Brief: ✅ Ready     │    │
│  │ 0.5%               │      │                    │    │
│  └────────────────────┘      └────────────────────┘    │
│                                                          │
│  Week 3 ...          Week 4 ...          Week 5 ...     │
│  ┌──────────┐       ┌──────────┐       ┌──────────┐    │
│  │ ...      │       │ ...      │       │ ...      │    │
│  └──────────┘       └──────────┘       └──────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Screen 3: Performance Tracker — URL Deep Dive (`/dashboard/tracker/[url]`)

```
┌─────────────────────────────────────────────────────────┐
│ 📊 /rolety-krakow/                      [Date range ▾]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Clicks: 89 (+34%)   Impressions: 4.2k   Avg Pos: 8.3  │
│                                                          │
│  ┌─── Position & Clicks Timeline ────────────────────┐  │
│  │    ▲ interwencja           ▲ interwencja           │  │
│  │    │ "Nowa treść +2000w"   │ "Schema FAQ added"    │  │
│  │   ╱╲                    ╱──────╲                    │  │
│  │  ╱  ╲──────╱──────────╱        ╲─────              │  │
│  │ ╱                                                   │  │
│  │ Feb 10        Feb 24        Mar 10        Mar 13    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─── Ranking Keywords ──────────────────────────────┐  │
│  │ Keyword              Pos  Δ7d  Impr   CTR   Status│  │
│  │ rolety kraków        6    ↑2   1.2k   3.2%  ✅    │  │
│  │ rolety na wymiar..   11   ↑4   890    1.1%  📈    │  │
│  │ rolety krakow cena   18   NEW  340    0.2%  🆕    │  │
│  │ montaż rolet kraków  25   ↓3   120    0.0%  ⚠️    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─── Interventions on this URL ─────────────────────┐  │
│  │ 2026-02-15  CONTENT_UPDATE  "Rozbudowa z 800→2000w│  │
│  │             + dodanie FAQ sekcji"                  │  │
│  │ 2026-03-01  SCHEMA_MARKUP   "FAQ Schema + Local   │  │
│  │             Business Schema"                      │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Scheduling Algorithm (Detail)

### Input

```typescript
interface SchedulerInput {
  clusters: {
    id: string;
    name: string;
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    coreOuter: 'CORE' | 'OUTER';
    coverageStatus: 'GAP' | 'PARTIAL' | 'COVERED' | 'INDEX_EXISTING';
    potentialScore: number;
    keywordsCount: number;
    hasBrief: boolean;
    targetUrl: string;
    parentClusterId?: string;  // for supporting → pillar dependency
  }[];
  config: {
    totalWeeks: number;        // default: 12
    maxTasksPerWeek: number;   // default: 3
    startDate: Date;
  };
}
```

### Algorithm Rules

```
1. SORT clusters by: priority ASC, potentialScore DESC

2. CLASSIFY each cluster into task_type:
   - GAP + CORE         → CREATE_PAGE  (effort: L/XL)
   - GAP + OUTER        → WRITE_BLOG   (effort: M)
   - PARTIAL            → EXPAND_CONTENT (effort: M)
   - COVERED + low CTR  → IMPROVE_CTR   (effort: S)
   - COVERED + pos 4-15 → OPTIMIZE_PAGE (effort: M)

3. MAP effort to slots:
   - S = 0.5 slot, M = 1 slot, L = 1.5 slots, XL = 2 slots
   - Max 3 slots per week

4. ASSIGN to weeks:
   - P0 clusters → weeks 1-4 (earliest available)
   - P1 clusters → weeks 3-8
   - P2 clusters → weeks 6-10
   - P3 clusters → weeks 8-12

5. DEPENDENCY RESOLUTION:
   - Pillar page task MUST be scheduled before its supporting pages
   - Blog post linking to a page → schedule 1-2 weeks AFTER the page

6. BALANCING:
   - Never 3 CREATE_PAGEs in one week (too much writing)
   - Mix: 1 heavy (CREATE/EXPAND) + 1-2 light (OPTIMIZE/CTR/LINKING)
   - OUTER (blog) tasks spread evenly — max 1 blog per week

7. OUTPUT: tasks[] with week_number assigned
```

---

## 7. Risks & Roadmap

### Phased Rollout

#### MVP (v0.1) — 2-3 tygodnie
- [x] Supabase tables + migrations
- [x] CSV/MD import (clusters, briefs, gaps)
- [x] Project overview dashboard
- [x] Weekly planner (auto-scheduling)
- [x] Task CRUD (status changes, notes)
- [x] Supabase Auth (invite-only)
- [x] Vercel deployment

#### v1.0 — +2 tygodnie
- [ ] GSC integration (data fetch + storage)
- [ ] Performance tracker (page-level charts)
- [ ] Intervention log
- [ ] Before/After comparison view
- [ ] Global trend dashboard

#### v1.1 — +1 tydzień
- [ ] Drag & drop task reordering
- [ ] Topical map visualization (tree/mindmap)
- [ ] Senuto data integration (on-demand refresh)
- [ ] Email notifications (weekly summary)

#### v2.0 — przyszłość
- [ ] Multi-project support
- [ ] Client-facing read-only portal
- [ ] AI-powered recommendations ("what to do next" based on GSC trends)
- [ ] Automatic brief generation trigger
- [ ] Slack/Discord notifications

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| GSC API rate limits | Nie można pobierać danych co godzinę | Daily cron + on-demand, cache aggressively |
| Supabase free tier limits | 500MB DB, 2GB bandwidth | GSC snapshots pruning (keep 90 days detail, monthly aggregates beyond) |
| CSV import inconsistency | Różne formaty z różnych analiz | Strict parser z walidacją + error feedback |
| Scheduling edge cases | Zbyt mało tasków w późnych tygodniach | Allow manual adjustment + re-schedule |
| Vercel cold starts | Slow first load | ISR + edge runtime for API routes |

---

## 8. File Structure (Next.js Project)

```
seo-dashboard/
├── app/
│   ├── layout.tsx              # Root layout + Supabase provider
│   ├── page.tsx                # Login / landing
│   ├── dashboard/
│   │   ├── layout.tsx          # Dashboard shell (sidebar + header)
│   │   ├── page.tsx            # Project overview
│   │   ├── clusters/
│   │   │   └── page.tsx        # Cluster list + topical map
│   │   ├── planner/
│   │   │   └── page.tsx        # Weekly planner (12 weeks)
│   │   ├── tracker/
│   │   │   ├── page.tsx        # Global performance overview
│   │   │   └── [url]/
│   │   │       └── page.tsx    # URL deep dive
│   │   ├── interventions/
│   │   │   └── page.tsx        # Intervention log
│   │   └── import/
│   │       └── page.tsx        # Import wizard (CSV/MD upload)
│   └── api/
│       ├── import/
│       │   ├── clusters/route.ts
│       │   ├── briefs/route.ts
│       │   └── gaps/route.ts
│       ├── gsc/
│       │   ├── fetch/route.ts  # Pull GSC data → store
│       │   └── snapshot/route.ts
│       ├── scheduler/
│       │   └── generate/route.ts
│       └── cron/
│           └── daily-gsc/route.ts  # Vercel Cron
├── components/
│   ├── ui/                     # shadcn components
│   ├── charts/
│   │   ├── PositionChart.tsx
│   │   ├── ClicksChart.tsx
│   │   └── CoverageDonut.tsx
│   ├── planner/
│   │   ├── WeekColumn.tsx
│   │   ├── TaskCard.tsx
│   │   └── Scheduler.tsx
│   ├── tracker/
│   │   ├── InterventionMarker.tsx
│   │   ├── KeywordTable.tsx
│   │   └── BeforeAfterDiff.tsx
│   └── import/
│       ├── CSVUploader.tsx
│       └── MDUploader.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts            # auto-generated from Supabase
│   ├── gsc/
│   │   └── client.ts           # GSC API wrapper
│   ├── parsers/
│   │   ├── clusterCSV.ts       # Parse _named.csv / _clustered.csv
│   │   ├── briefMD.ts          # Parse brief.md
│   │   └── gapsMD.ts           # Parse _content_gaps.md
│   └── scheduler/
│       └── algorithm.ts        # Auto-scheduling logic
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── vercel.json                 # Cron config
```

---

## 9. Appendix: Data Flow Examples

### Flow 1: New Project Onboarding

```
1. User uploads:
   - rolety_krakow_named.csv (clusters)
   - rolety_krakow_content_gaps.md (gaps)
   - data/briefs/*/brief.md (11 briefs)

2. Parser extracts:
   - 12 clusters with P0-P3, CORE/OUTER, potential_score
   - 337 keywords distributed across clusters
   - 11 briefs linked to clusters by slug
   - Content gaps with priorities

3. Scheduler generates:
   - 25-30 tasks across 12 weeks
   - Week 1: CREATE /rolety-krakow/ (P0) + OPTIMIZE /rolety-dzien-noc/ (P1)
   - Week 2: CREATE /plisy-krakow/ (P0) + BLOG "Jak wybrać rolety" (P3)
   - ... etc

4. Dashboard shows:
   - Project overview with metrics
   - This week's tasks
   - 12-week timeline
```

### Flow 2: Tracking Impact of Changes

```
1. User completes task: "Napisz treść na /plisy-krakow/"
2. Marks task DONE → creates intervention:
   - Date: 2026-03-15
   - Type: NEW_PAGE
   - URL: /plisy-krakow/
   - Description: "Nowa pillar page, 2500 słów, FAQ section, schema markup"

3. GSC cron pulls data daily → gsc_snapshots table fills up

4. After 14 days, user opens /dashboard/tracker/plisy-krakow/:
   - Chart shows: impressions started appearing from day 5
   - New keywords: "plisy kraków", "plisy okienne", "plisy na wymiar"
   - Vertical marker on chart: "2026-03-15: Nowa pillar page"
   - Before/After: 0 impressions → 340 impressions, 0 clicks → 12 clicks
```
