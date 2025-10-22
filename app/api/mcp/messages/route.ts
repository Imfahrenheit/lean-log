import { authenticateMcpRequest } from "@/lib/mcp/auth";
import { z } from "zod";
import { getLatestWeightEntryForUser, createWeightEntryForUser, listRecentWeightEntriesForUser, deleteWeightEntryForUser } from "@/lib/core/weight";
import { listMealsForUser } from "@/lib/core/meals";
import { getDaySummariesForUser } from "@/lib/core/history";

export async function POST(request: Request) {
  try {
    const auth = await authenticateMcpRequest(request);
    const body = await request.json().catch(() => ({}));
    const method = body?.method as string | undefined;

    if (method === "weight.getLatest") {
      const latest = await getLatestWeightEntryForUser(auth.userId);
      return json({ ok: true, result: latest });
    }

    if (method === "weight.create") {
      const schema = z.object({
        entry_date: z.string().min(1),
        weight_kg: z.number().min(1),
        source: z.string().nullable().optional(),
      });
      const input = schema.parse(body?.params ?? {});
      const created = await createWeightEntryForUser({
        userId: auth.userId,
        entry_date: input.entry_date,
        weight_kg: input.weight_kg,
        source: input.source ?? null,
      });
      return json({ ok: true, result: created });
    }

    if (method === "weight.listRecent") {
      const params = z.object({ limit: z.number().int().min(1).max(200).optional() }).parse(body?.params ?? {});
      const items = await listRecentWeightEntriesForUser(auth.userId, params.limit ?? 50);
      return json({ ok: true, result: items });
    }

    if (method === "weight.delete") {
      const params = z.object({ id: z.string().uuid() }).parse(body?.params ?? {});
      await deleteWeightEntryForUser(auth.userId, params.id);
      return json({ ok: true, result: true });
    }

    if (method === "meals.list") {
      const params = z.object({ includeArchived: z.boolean().optional() }).parse(body?.params ?? {});
      const meals = await listMealsForUser(auth.userId, { includeArchived: params.includeArchived });
      return json({ ok: true, result: meals });
    }

    if (method === "history.daySummaries") {
      const params = z.object({ startDate: z.string().min(1), endDate: z.string().min(1) }).parse(body?.params ?? {});
      const data = await getDaySummariesForUser(auth.userId, params.startDate, params.endDate);
      return json({ ok: true, result: data });
    }

    return json({ ok: false, error: "Unknown method" }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    const status = message === "Unauthorized" ? 401 : 400;
    return json({ ok: false, error: message }, status);
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}


