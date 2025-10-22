import { authenticateMcpRequest } from "@/lib/mcp/auth";
import { z } from "zod";
import { getLatestWeightEntryForUser, createWeightEntryForUser, listRecentWeightEntriesForUser, deleteWeightEntryForUser } from "@/lib/core/weight";
import { listMealsForUser } from "@/lib/core/meals";
import { getDaySummariesForUser } from "@/lib/core/history";
import {
  getOrCreateDayLogForUser,
  addMealEntryForUser,
  updateMealEntryForUser,
  deleteMealEntryForUser,
  bulkAddMealEntriesForUser,
  bulkDeleteMealEntriesForUser,
} from "@/lib/core/entries";

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

    if (method === "entries.getOrCreateDayLog") {
      const params = z.object({ date: z.string().min(1) }).parse(body?.params ?? {});
      const log = await getOrCreateDayLogForUser(auth.userId, params.date);
      return json({ ok: true, result: log });
    }

    if (method === "entries.add") {
      const params = z.object({
        day_log_id: z.string().uuid(),
        meal_id: z.string().uuid().nullable().optional(),
        name: z.string().min(1),
        protein_g: z.number().min(0),
        carbs_g: z.number().min(0),
        fat_g: z.number().min(0),
        calories_override: z.number().nullable().optional(),
      }).parse(body?.params ?? {});
      const entry = await addMealEntryForUser(auth.userId, params);
      return json({ ok: true, result: entry });
    }

    if (method === "entries.update") {
      const params = z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        protein_g: z.number().min(0).optional(),
        carbs_g: z.number().min(0).optional(),
        fat_g: z.number().min(0).optional(),
        calories_override: z.number().nullable().optional(),
        meal_id: z.string().uuid().nullable().optional(),
      }).parse(body?.params ?? {});
      const { id, ...updates } = params;
      await updateMealEntryForUser(auth.userId, id, updates);
      return json({ ok: true, result: true });
    }

    if (method === "entries.delete") {
      const params = z.object({ id: z.string().uuid() }).parse(body?.params ?? {});
      await deleteMealEntryForUser(auth.userId, params.id);
      return json({ ok: true, result: true });
    }

    if (method === "entries.bulkAdd") {
      const params = z.object({
        day_log_id: z.string().uuid(),
        items: z.array(z.object({
          meal_id: z.string().uuid().nullable().optional(),
          name: z.string().min(1),
          protein_g: z.number().min(0),
          carbs_g: z.number().min(0),
          fat_g: z.number().min(0),
          calories_override: z.number().nullable().optional(),
        })).min(1),
      }).parse(body?.params ?? {});
      const res = await bulkAddMealEntriesForUser(auth.userId, params);
      return json({ ok: true, result: res });
    }

    if (method === "entries.bulkDelete") {
      const params = z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(body?.params ?? {});
      const count = await bulkDeleteMealEntriesForUser(auth.userId, params.ids);
      return json({ ok: true, result: { deleted: count } });
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


