## Lean Log – Implementation Plan & Progress

This repo implements a calorie/weight tracker using Next.js (App Router), Tailwind, Supabase (new API keys), shadcn/ui, and PWA features.

### Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://clhzdufqtogoetnfjxgv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

### Supabase CLI workflow

```bash
supabase login
supabase link --project-ref clhzdufqtogoetnfjxgv
supabase db push --linked             # apply schema
supabase gen types typescript --linked > lib/database.types.ts
```

Migrations live in `supabase/migrations/`. Baseline created: `20251019_000001_lean_log_init.sql`.

### Data model (summary)

- `profiles`, `user_settings`, `meals`, `day_logs`, `meal_entries`, `weight_entries`
- Aux: `meal_order_snapshots`, `export_jobs`, `import_jobs`, `sync_events`
- RLS enabled across tables; per-user policies; signup trigger creates profile/settings

### Packages installed

- `@supabase/supabase-js`, `@supabase/ssr`
- `react-hook-form`, `zod`, `@hookform/resolvers`
- `@radix-ui/react-icons`, `recharts`, `@dnd-kit/*`
- `workbox-*`
- shadcn/ui components scaffolded to `components/ui/*`

### Auth & Routing

- `lib/supabase/client.ts`, `lib/supabase/server.ts` (SSR-friendly clients)
- Route groups:
  - `app/(auth)/signin` – magic link + password sign-in
  - `app/(app)` – protected layout checks session server-side; redirects to `/signin`
  - root `app/page.tsx` redirects to `/(app)`

### Profile

- Page: `app/(app)/profile/page.tsx`
- Form: `app/(app)/profile/profile-form.tsx` (shadcn `Card`, `Input`, `Select`, `Button`)
- Helpers: `lib/calculations.ts` (BMI, macro calories, Mifflin–St Jeor)
- Live BMI display; suggested calories computed client-side; upserts to `public.profiles`

### PWA (planned)

- Manifest, icons, Workbox service worker, offline queue using IndexedDB (sync_events)

## Roadmap

### Milestone 1 – Auth & Profile (IN PROGRESS/DONE)

- [x] Supabase env setup and clients
- [x] Protected `(app)` layout and `(auth)/signin` route
- [x] Profile form (RHF + zod) with live BMI and suggested calories

### Milestone 2 – Meals Manager (DONE)

- [x] Route: `/settings/meals`
- [x] Components: list (sortable), form modal, macro targets
- [x] Server actions for CRUD (optimistic reorder)

### Milestone 3 – Daily Log & Entries (IN PROGRESS)

- [ ] Route: `/` (Today view) under `(app)` with date picker
- [ ] `getOrCreateDayLog` server action
- [ ] Meal cards, entries form, live totals & progress
- [ ] Duplicate day from `/history`

### Milestone 4 – Weight Tracking

- [ ] Route: `/weight` with form, list, chart (recharts)
- [ ] BMI card wired to latest weight

### Milestone 5 – History & Data Management

- [ ] `/history` calendar and day summaries
- [ ] Export (Edge Function + Storage) / Import (server action + transaction)
- [ ] Undo delete with toasts

### Milestone 6 – PWA Polish

- [ ] `manifest.webmanifest`, icons, theme colors
- [ ] Service worker with Workbox strategies
- [ ] Offline banner + background sync for queued actions

### Milestone 7 – QA & Accessibility

- [ ] Unit tests for BMI and macros
- [ ] Playwright smoke + axe a11y checks

## Commands

```bash
pnpm dev                   # run app
pnpm lint                  # lint
supabase db push --linked  # apply DB changes
```

## File map (key)

- `app/(auth)/signin/page.tsx` – sign-in UI
- `app/(app)/layout.tsx` – server auth guard + Toaster
- `app/(app)/page.tsx` – placeholder home
- `app/(app)/profile/*` – profile page + form
- `lib/supabase/*` – Supabase clients
- `lib/calculations.ts` – BMI/macros/Mifflin–St Jeor
- `components/ui/*` – shadcn/ui components
- `supabase/migrations/*` – DB schema
