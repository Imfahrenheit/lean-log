import { authenticateMcpRequest } from "@/lib/mcp/auth";
import { z } from "zod";
import { getOrCreateDayLogForUser, addMealEntryForUser, bulkAddMealEntriesForUser } from "@/lib/core/entries";

const SingleEntrySchema = z.object({
  date: z.string().min(1),
  name: z.string().min(1),
  protein_g: z.number().min(0),
  carbs_g: z.number().min(0),
  fat_g: z.number().min(0),
  calories_override: z.number().nullable().optional(),
  meal_id: z.string().uuid().nullable().optional(),
});

const BulkSchema = z.object({
  date: z.string().min(1),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        protein_g: z.number().min(0),
        carbs_g: z.number().min(0),
        fat_g: z.number().min(0),
        calories_override: z.number().nullable().optional(),
        meal_id: z.string().uuid().nullable().optional(),
      })
    )
    .min(1),
});

export async function POST(request: Request) {
  let userId: string;
  try {
    const auth = await authenticateMcpRequest(request);
    userId = auth.userId;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return new Response(msg, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  // If body matches single entry, commit as single; if it has items[], treat as bulk.
  const bulkParsed = BulkSchema.safeParse(body);
  const singleParsed = SingleEntrySchema.safeParse(body);
  if (!bulkParsed.success && !singleParsed.success) {
    return json({ ok: false, error: "Invalid payload", issues: [bulkParsed.error?.issues, singleParsed.error?.issues] }, 400);
  }

  const date = bulkParsed.success ? bulkParsed.data.date : singleParsed.success ? singleParsed.data.date : undefined;
  if (!date) return json({ ok: false, error: "date required" }, 400);
  const dayLog = await getOrCreateDayLogForUser(userId, date);

  if (bulkParsed.success) {
    const res = await bulkAddMealEntriesForUser(userId, {
      day_log_id: dayLog.id,
      items: bulkParsed.data.items,
    });
    return json({ ok: true, result: res });
  }

  const s = singleParsed.data!;
  const entry = await addMealEntryForUser(userId, {
    day_log_id: dayLog.id,
    meal_id: s.meal_id ?? null,
    name: s.name,
    protein_g: s.protein_g,
    carbs_g: s.carbs_g,
    fat_g: s.fat_g,
    calories_override: s.calories_override ?? null,
  });
  return json({ ok: true, result: entry });
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}


