## MCP Server for Lean Log (Next.js on Vercel)

This document outlines how we will embed a Model Context Protocol (MCP) server inside the existing Next.js app, expose Lean Log capabilities as MCP tools, and secure access so each user can only operate on their own data.

### Goals
- Expose Lean Log features (meals, day logs, weight, profile) as MCP tools.
- Run as an HTTP/SSE MCP server inside Next.js and deploy on Vercel.
- Authenticate MCP clients using per-user credentials and strictly scope all DB access to that user.
- Prefer official MCP guidance and Vercel adapter patterns.

### References (official and vendor)
- MCP protocol and SDKs: `https://modelcontextprotocol.io` (specs, capabilities, transports)
- Vercel MCP adapter + Next.js integration examples: `https://github.com/vercel-labs/mcp-for-next.js` and Vercel docs on deploying MCP servers
- Supabase new API keys (publishable/secret) announcement and timeline: https://github.com/orgs/supabase/discussions/29260
- Claude Desktop/other MCP clients: vendor docs on configuring HTTP/SSE MCP servers and custom headers

### Architecture Overview
- Transport: HTTP + Server-Sent Events (SSE) endpoints hosted by Next.js App Router.
  - `GET /api/mcp/sse` (event stream)
  - `POST /api/mcp/messages` (JSON-RPC message batching)
- Adapter: Use Vercel’s MCP adapter for Next.js route handlers to register tools/resources.
- Auth model: Per-user API keys (simple and robust for “my desktop client talks to my data”). OAuth can be added later for third-party consent flows.
- Data access: Use a Supabase service-role client inside MCP handlers but constrain every query by the authenticated `userId` derived from the API key. Do not trust client-provided `user_id`.

### Security Model
- API keys
  - Table: `api_keys(user_id, name, hashed_key, created_at, last_used_at, revoked_at)`.
  - Keys are generated once and shown only once to the user; stored hashed (Argon2/scrypt).
  - Requests must include `Authorization: Bearer <key>`.
  - On each request, resolve `{ userId, keyId }` and add to MCP auth context; update `last_used_at`.
  - Revoked keys are rejected immediately.
- Scoping & data isolation
  - All DB reads/writes must include `WHERE user_id = :userId`.
  - MCP tool handlers never accept a `user_id` in input; it is derived from the key.
  - Service-role key is used server-side; scoping is enforced in app logic and covered by tests.
- Operational hardening
  - Enforce HTTPS in production; deny cleartext.
  - Rate limit by `keyId` and IP.
  - Structured logs per call: `timestamp, keyId, userId, tool, status, duration`.
  - Optional: CORS lock-down if cross-origin usage is needed; otherwise same-origin.

### Tools to Expose (initial)
- Meals (from `app/(app)/settings/meals/actions.ts`): `createMeal`, `updateMeal`, `deleteMeal`, `reorderMeals`.
- Day logs & entries (from `app/(app)/actions.ts`): `getOrCreateDayLog`, `addMealEntry`, `updateMealEntry`, `updateDayLog`, `deleteMealEntry`, `reorderMealEntries`, `duplicateDay`.
- Weight (from `app/(app)/weight/actions.ts`): `createWeightEntry`, `deleteWeightEntry`, plus read tools `getLatestWeightEntry`, `getWeightEntries`, `getWeightEntriesInRange`.
- Profile: add server-side `upsertProfile` tool that upserts to `profiles` for the current user.

All tool implementations call shared core functions that take an explicit `userId` and input payload.

### Implementation Plan & Milestones

1) Planning & foundations
- [x] Document plan, milestones, and references (this file)
- [ ] Link plan from `README.md`

2) Auth & service clients
- [ ] Create Supabase service-role client helper (`lib/supabase/service.ts`)
- [ ] Add `api_keys` migration and hashing utilities
- [ ] Add minimal key management server action(s) or pages (create/revoke, list metadata)

3) Refactor for shared core logic
- [ ] Extract DB operations behind server actions into `lib/core/*` functions that take `{ userId, ... }`
- [ ] Update existing server actions to call core with `user.id` from cookie session

4) MCP server endpoints (Vercel adapter)
- [ ] Scaffold `app/api/mcp/sse/route.ts` and `app/api/mcp/messages/route.ts`
- [ ] Wire auth: parse `Authorization` header, resolve key → `userId` and attach to MCP auth context
- [ ] Register tools for meals, day logs, weight, profile (use zod schemas)

5) Security & ops
- [ ] Add rate limiting (per key + IP) and structured logging
- [ ] Add revocation checks and `last_used_at` updates
- [ ] Ensure HTTPS only; add minimal CORS config if needed

6) Documentation & clients
- [ ] Write client setup for Claude Desktop and ChatGPT MCP (server URL, headers)
- [ ] Provide example `curl` scripts to smoke test SSE/messages

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` – existing
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` – use the new sb_publishable_… key (replaces anon)
- `SUPABASE_SECRET_KEY` – preferred server-only secret (sb_secret_…); use only on the server
  - Legacy `service_role` is still supported during migration; our code will also accept `SUPABASE_SERVICE_ROLE_KEY` as a fallback, but we will standardize on `SUPABASE_SECRET_KEY` per Supabase’s new scheme

### Testing Strategy
- Unit-test core functions (input validation, scoping) with a test user.
- Integration tests for MCP endpoints (auth happy path, missing/invalid key, revoked key).
- Manual smoke with MCP Inspector/clients and `curl` for messages/SSE.

### Future: OAuth alternative
- If we need third-party clients with user consent, add OAuth 2.1.
- Expose `/.well-known/oauth-protected-resource` metadata if we adopt OAuth and scopes.
- Continue to resolve `userId` from token claims and scope all queries identically.


