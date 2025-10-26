## Lean Log – Implementation Plan & Progress

This repo implements a calorie/weight tracker using Next.js (App Router), Tailwind, Supabase (new API keys), shadcn/ui, and PWA features.

**Design Philosophy**: Mobile-first responsive design optimized for quick daily logging on-the-go with minimal scrolling.

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
  - `app/(auth)/callback` – OAuth callback handler
  - `app/(app)` – protected layout checks session server-side; redirects to `/signin`
  - root `app/page.tsx` redirects to `/(app)`
- **Fixed**: Next.js 15 compatibility (async searchParams, proper revalidatePath usage)
- **Fixed**: Supabase UUID null handling using `.is()` for null checks

### Profile

- Page: `app/(app)/profile/page.tsx`
- Form: `app/(app)/profile/profile-form.tsx` (shadcn `Card`, `Input`, `Select`, `Button`)
- Helpers: `lib/calculations.ts` (BMI, macro calories, Mifflin–St Jeor)
- Live BMI display; suggested calories computed client-side; upserts to `public.profiles`

### PWA (planned)

- Manifest, icons, Workbox service worker, offline queue using IndexedDB (sync_events)

## MCP Server ✅

**Status:** Deployed and working!

The Lean Log MCP server exposes nutrition tracking capabilities to AI assistants (Claude, ChatGPT, etc.) via the Model Context Protocol.

- **Setup Guide:** See [CURSOR_SETUP.md](./CURSOR_SETUP.md) for quick Cursor configuration
- **Full Documentation:** See [docs/cursor-mcp-setup.md](./docs/cursor-mcp-setup.md)
- **Implementation Plan:** See [docs/mcp-plan.md](./docs/mcp-plan.md)
- **API Management:** [https://lean-log.tarequm.com/settings/api-keys](https://lean-log.tarequm.com/settings/api-keys)

**Endpoint:** `POST https://lean-log.tarequm.com/api/mcp/messages`

**Available Methods:**
- Weight tracking: `weight.getLatest`, `weight.create`, `weight.listRecent`, `weight.delete`
- Meals: `meals.list`
- Daily entries: `entries.getOrCreateDayLog`, `entries.add`, `entries.update`, `entries.delete`, `entries.bulkAdd`
- History: `history.daySummaries`

## Roadmap

### Milestone 1 – Auth & Profile ✅ DONE

- [x] Supabase env setup and clients
- [x] Protected `(app)` layout and `(auth)/signin` route
- [x] Profile form (RHF + zod) with live BMI and suggested calories
- [x] Magic link authentication with callback handling

### Milestone 2 – Meals Manager ✅ DONE

- [x] Route: `/settings/meals`
- [x] Components: list (sortable), form modal, macro targets
- [x] Server actions for CRUD (optimistic reorder)

### Milestone 3 – Daily Log & Entries ✅ DONE

- [x] Route: `/` (Today view) under `(app)` with date picker
- [x] `getOrCreateDayLog` server action
- [x] Meal cards, entries form, live totals & progress
- [x] Drag-and-drop entry reordering
- [x] Quick add entries (unassigned to meals)
- [x] Daily target override and notes
- [x] Real-time macro tracking with progress bars

### Milestone 4 – Mobile UI Optimization (IN PROGRESS)

- [ ] Review and optimize mobile layouts for all pages
- [ ] Ensure minimal scrolling on mobile devices
- [ ] Touch-friendly button sizes and spacing
- [ ] Optimize form inputs for mobile keyboards
- [ ] Test responsive breakpoints (sm, md, lg)
- [ ] Add swipe gestures where appropriate

### Milestone 5 – Weight Tracking

- [ ] Route: `/weight` with form, list, chart (recharts)
- [ ] BMI card wired to latest weight

### Milestone 6 – History & Data Management

- [ ] `/history` calendar and day summaries
- [ ] Export (Edge Function + Storage) / Import (server action + transaction)
- [ ] Undo delete with toasts
- [ ] Duplicate day functionality

### Milestone 7 – PWA Polish

- [ ] `manifest.webmanifest`, icons, theme colors
- [ ] Service worker with Workbox strategies
- [ ] Offline banner + background sync for queued actions

### Milestone 8 – QA & Accessibility

- [ ] Unit tests for BMI and macros
- [ ] Playwright smoke + axe a11y checks

## Commands

```bash
pnpm dev                   # run app
pnpm lint                  # lint
supabase db push --linked  # apply DB changes
```

## File map (key)

- `app/(auth)/signin/page.tsx` – sign-in UI with magic link and password
- `app/(auth)/callback/route.ts` – authentication callback handler
- `app/(app)/layout.tsx` – server auth guard + Toaster
- `app/(app)/page.tsx` – today view (daily log)
- `app/(app)/today-client.tsx` – client components for daily tracking
- `app/(app)/today.types.ts` – TypeScript types for daily log
- `app/(app)/actions.ts` – server actions for meal entries and day logs
- `app/(app)/profile/*` – profile page + form
- `app/(app)/settings/meals/*` – meals management page
- `lib/supabase/*` – Supabase clients
- `lib/calculations.ts` – BMI/macros/Mifflin–St Jeor
- `components/ui/*` – shadcn/ui components
- `supabase/migrations/*` – DB schema

## Recent Fixes

### Next.js 15 Compatibility
- Made `searchParams` async in page components
- Moved `revalidatePath` calls out of render functions
- Updated to use proper Server Actions patterns

### Supabase Query Issues
- Fixed UUID null handling using `.is("column", null)` instead of `.match()`
- Added sanitization for string "null" values in all server actions
- Proper null checks in `addMealEntry`, `updateMealEntry`, and `reorderMealEntries`

### Authentication
- Fixed magic link callback URL path
- Simplified authentication flow
- Cleaned up Supabase SSR client configuration
