# SEO Project Dashboard

Wewnętrzna aplikacja do zarządzania projektami SEO klientów Double Digital.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- **Database:** Supabase PostgreSQL (istniejąca instancja)
- **Auth:** Supabase Auth (invite-only, RLS)
- **UI:** Tailwind CSS + shadcn/ui + Recharts
- **Deploy:** Vercel
- **Parsers:** papaparse (CSV), marked (MD)

## Dokumentacja

- PRD: `docs/PRD-seo-dashboard.md` — pełna specyfikacja z data model, scheduling algorithm, wireframes

## Konwencje

- TypeScript strict mode
- Server Components domyślnie, 'use client' tylko gdy potrzebne (interaktywność, hooks)
- Server Actions dla mutacji danych (nie API routes)
- API Routes tylko dla: cron jobs, external webhooks, file upload
- shadcn/ui components w `components/ui/`
- Supabase client: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server)
- Nazewnictwo plików: kebab-case
- Używaj Context7 MCP do sprawdzania aktualnej dokumentacji bibliotek

## Struktura danych (import z krakowrolety-project)

Dashboard importuje dane wygenerowane przez pipeline SEO:
- `*_named.csv` — klastry z keywords, priorytetami, potential_score
- `*_content_gaps.md` — luki tematyczne z priorytetami P1-P4
- `data/briefs/*/brief.md` — content briefe (markdown)
- GSC data — przez API (clicks, impressions, position, CTR per query per page)

## Komendy

```bash
npm run dev          # localhost:3000
npm run build        # production build
npm run lint         # ESLint
```
