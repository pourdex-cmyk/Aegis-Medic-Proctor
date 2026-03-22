# Aegis Medic Proctor

AI-first tactical medicine training platform for military, law enforcement, and emergency medical services.

## Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Recharts
- **Backend:** Next.js Route Handlers, Supabase Edge Functions
- **Database:** Supabase (PostgreSQL + pgvector), Row Level Security, Realtime
- **Auth:** Supabase Auth (email/password + OAuth)
- **AI:** Vercel AI SDK + Anthropic Claude (claude-sonnet-4-6 / claude-haiku-4-5-20251001)
- **Storage:** Supabase Storage (doctrine documents)

## Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- An [Anthropic API key](https://console.anthropic.com/)

## Setup

### 1. Clone and install

```bash
cd aegis-medic-proctor
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase and Anthropic credentials
```

### 3. Start Supabase locally

```bash
supabase start
# Starts the local Supabase stack (Postgres, Auth, Storage, Studio)
```

### 4. Run migrations and seed data

```bash
supabase db reset
# Applies all migrations and seed data automatically
```

Or apply manually:
```bash
psql $DATABASE_URL < supabase/migrations/001_initial_schema.sql
psql $DATABASE_URL < supabase/migrations/002_rls_policies.sql
psql $DATABASE_URL < supabase/seed/001_demo_data.sql
```

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key URLs (local dev)

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| Supabase Studio | http://localhost:54323 |
| Supabase API | http://localhost:54321 |
| Inbucket (email preview) | http://localhost:54324 |

## Project Structure

```
src/
├── app/
│   ├── api/ai/          # AI route handlers (scenario gen, grading, copilot)
│   ├── app/             # Authenticated app shell
│   │   ├── dashboard/
│   │   ├── scenarios/
│   │   ├── analytics/
│   │   ├── doctrine/
│   │   ├── reports/
│   │   └── admin/
│   ├── auth/            # Sign in, sign up, callback
│   └── onboarding/      # First-run org setup wizard
├── components/
│   ├── layout/          # Sidebar, header
│   └── ui/              # Design system components (40+)
├── lib/
│   ├── ai/              # AI prompt modules
│   ├── simulation/      # Deterministic physiology engine
│   ├── supabase/        # Supabase clients (browser, server, service)
│   ├── constants.ts
│   ├── types.ts
│   └── utils.ts
supabase/
├── migrations/          # PostgreSQL schema + RLS policies
├── seed/                # Demo/test data
└── config.toml          # Local dev config
```

## AI Safety Architecture

All AI features are constrained to prevent medical misinformation:

- **Scenario generation** — AI builds narratives and inject scripts. Injury presentations use validated archetypes only.
- **Vitals simulation** — Entirely deterministic (no AI). The `simulation/engine.ts` runs a physics-based model with discrete time steps.
- **Treatment interpretation** — AI parses free-text into structured action types. It does not assess clinical correctness.
- **Grading** — AI generates debrief narrative. Scoring logic is deterministic, grounded in rubric items.
- **Doctrine grounding** — All generation can be constrained to approved doctrine packs with SME-reviewed rules.

## Deployment

### Vercel (recommended)

1. Connect your repository to Vercel.
2. Set all environment variables from `.env.example` in Vercel Dashboard → Settings → Environment Variables.
3. Set `NEXT_PUBLIC_APP_URL` to your production domain.
4. Deploy.

### Supabase (production)

1. Create a project at [supabase.com](https://supabase.com).
2. Run migrations:
   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   ```
3. Enable the `pgvector` extension: Database → Extensions.
4. Create a Storage bucket named `doctrine-documents` (private).
5. Configure Auth → Email Templates for invite and password reset flows.

## License

Proprietary — all rights reserved.
