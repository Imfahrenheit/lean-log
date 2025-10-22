import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type DayLog = {
  id: string;
  user_id: string;
  log_date: string;
  target_calories_override: number | null;
  notes: string | null;
};

export type MealEntry = {
  id: string;
  day_log_id: string;
  meal_id: string | null;
  name: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories_override: number | null;
  total_calories: number | null;
  order_index: number;
};

export async function getOrCreateDayLogForUser(userId: string, inputDate: string): Promise<DayLog> {
  const supabase = createSupabaseServiceClient();
  const normalized = new Date(inputDate).toISOString().slice(0, 10);

  const existing = await supabase
    .from("day_logs")
    .select("id, user_id, log_date, target_calories_override, notes")
    .eq("user_id", userId)
    .eq("log_date", normalized)
    .maybeSingle<DayLog>();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  const created = await supabase
    .from("day_logs")
    .insert({ user_id: userId, log_date: normalized })
    .select("id, user_id, log_date, target_calories_override, notes")
    .single<DayLog>();
  if (created.error) throw created.error;
  return created.data;
}

export async function addMealEntryForUser(userId: string, payload: {
  day_log_id: string;
  meal_id?: string | null;
  name: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories_override?: number | null;
}): Promise<MealEntry> {
  const supabase = createSupabaseServiceClient();

  // Verify ownership of day log
  const owns = await supabase
    .from("day_logs")
    .select("id")
    .eq("id", payload.day_log_id)
    .eq("user_id", userId)
    .maybeSingle<{ id: string }>();
  if (owns.error) throw owns.error;
  if (!owns.data) throw new Error("Not authorized for day log");

  const mealId = payload.meal_id ?? null;

  // Determine next order_index within (day_log_id, meal_id)
  let orderQuery = supabase
    .from("meal_entries")
    .select("order_index")
    .eq("day_log_id", payload.day_log_id);
  orderQuery = mealId ? orderQuery.eq("meal_id", mealId) : orderQuery.is("meal_id", null);
  const probe = await orderQuery.order("order_index", { ascending: false }).limit(1).maybeSingle<{ order_index: number }>();
  if (probe.error) throw probe.error;
  const nextOrder = (probe.data?.order_index ?? -1) + 1;

  const insert = await supabase
    .from("meal_entries")
    .insert({
      day_log_id: payload.day_log_id,
      meal_id: mealId,
      name: payload.name.trim(),
      protein_g: payload.protein_g,
      carbs_g: payload.carbs_g,
      fat_g: payload.fat_g,
      calories_override: payload.calories_override ?? null,
      order_index: nextOrder,
    })
    .select("id, day_log_id, meal_id, name, protein_g, carbs_g, fat_g, calories_override, total_calories, order_index")
    .single<MealEntry>();
  if (insert.error) throw insert.error;
  return insert.data;
}

export async function updateMealEntryForUser(userId: string, entryId: string, updates: Partial<{
  name: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories_override: number | null;
  meal_id: string | null;
}>): Promise<void> {
  const supabase = createSupabaseServiceClient();

  // Fetch entry with its day_log_id and verify ownership
  const entry = await supabase
    .from("meal_entries")
    .select("day_log_id")
    .eq("id", entryId)
    .maybeSingle<{ day_log_id: string }>();
  if (entry.error) throw entry.error;
  if (!entry.data) throw new Error("Entry not found");

  const owns = await supabase
    .from("day_logs")
    .select("id")
    .eq("id", entry.data.day_log_id)
    .eq("user_id", userId)
    .maybeSingle<{ id: string }>();
  if (owns.error) throw owns.error;
  if (!owns.data) throw new Error("Not authorized for entry");

  const payload: Record<string, unknown> = { ...updates };
  if (typeof payload.name === "string") {
    const t = (payload.name as string).trim();
    if (!t) throw new Error("Name cannot be empty");
    payload.name = t;
  }
  if (payload.meal_id !== undefined) {
    payload.meal_id = payload.meal_id || null;
  }

  const { error } = await supabase
    .from("meal_entries")
    .update(payload)
    .eq("id", entryId);
  if (error) throw error;
}

export async function deleteMealEntryForUser(userId: string, entryId: string): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const entry = await supabase
    .from("meal_entries")
    .select("day_log_id")
    .eq("id", entryId)
    .maybeSingle<{ day_log_id: string }>();
  if (entry.error) throw entry.error;
  if (!entry.data) throw new Error("Entry not found");

  const owns = await supabase
    .from("day_logs")
    .select("id")
    .eq("id", entry.data.day_log_id)
    .eq("user_id", userId)
    .maybeSingle<{ id: string }>();
  if (owns.error) throw owns.error;
  if (!owns.data) throw new Error("Not authorized for entry");

  const { error } = await supabase
    .from("meal_entries")
    .delete()
    .eq("id", entryId);
  if (error) throw error;
}

export async function bulkAddMealEntriesForUser(
  userId: string,
  payload: {
    day_log_id: string;
    items: Array<{
      meal_id?: string | null;
      name: string;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      calories_override?: number | null;
    }>;
  }
): Promise<MealEntry[]> {
  const supabase = createSupabaseServiceClient();
  // Verify day log ownership
  const owns = await supabase
    .from("day_logs")
    .select("id")
    .eq("id", payload.day_log_id)
    .eq("user_id", userId)
    .maybeSingle<{ id: string }>();
  if (owns.error) throw owns.error;
  if (!owns.data) throw new Error("Not authorized for day log");

  // Compute next order_index per (meal_id|null)
  const distinctMealIds = Array.from(
    new Set(payload.items.map((i) => (i.meal_id ?? null) || null))
  );

  const maxByMeal = new Map<string, number>();
  for (const mid of distinctMealIds) {
    let q = supabase
      .from("meal_entries")
      .select("order_index")
      .eq("day_log_id", payload.day_log_id);
    q = mid ? q.eq("meal_id", mid) : q.is("meal_id", null);
    const r = await q.order("order_index", { ascending: false }).limit(1).maybeSingle<{ order_index: number }>();
    if (r.error) throw r.error;
    maxByMeal.set(mid ?? "__null__", (r.data?.order_index ?? -1) + 1);
  }

  const rows = payload.items.map((i) => {
    const mealKey = (i.meal_id ?? null) || null;
    const next = maxByMeal.get(mealKey ?? "__null__") ?? 0;
    maxByMeal.set(mealKey ?? "__null__", next + 1);
    return {
      day_log_id: payload.day_log_id,
      meal_id: mealKey,
      name: i.name.trim(),
      protein_g: i.protein_g,
      carbs_g: i.carbs_g,
      fat_g: i.fat_g,
      calories_override: i.calories_override ?? null,
      order_index: next,
    } as const;
  });

  const { data, error } = await supabase
    .from("meal_entries")
    .insert(rows as any)
    .select(
      "id, day_log_id, meal_id, name, protein_g, carbs_g, fat_g, calories_override, total_calories, order_index"
    );
  if (error) throw error;
  return (data ?? []) as MealEntry[];
}

export async function bulkDeleteMealEntriesForUser(
  userId: string,
  ids: string[]
): Promise<number> {
  if (!ids || ids.length === 0) return 0;
  const supabase = createSupabaseServiceClient();

  // Ensure all entries belong to user's day logs
  const { data: entries, error: e1 } = await supabase
    .from("meal_entries")
    .select("id, day_log_id")
    .in("id", ids);
  if (e1) throw e1;
  const dayLogIds = Array.from(new Set((entries ?? []).map((e) => e.day_log_id)));
  if (dayLogIds.length > 0) {
    const { data: owned, error: e2 } = await supabase
      .from("day_logs")
      .select("id")
      .in("id", dayLogIds)
      .eq("user_id", userId);
    if (e2) throw e2;
    const ownedSet = new Set((owned ?? []).map((d) => d.id));
    const allOwned = dayLogIds.every((id) => ownedSet.has(id));
    if (!allOwned) throw new Error("Not authorized for one or more entries");
  }

  const { count, error } = await supabase
    .from("meal_entries")
    .delete({ count: "exact" })
    .in("id", ids);
  if (error) throw error;
  return count ?? 0;
}


