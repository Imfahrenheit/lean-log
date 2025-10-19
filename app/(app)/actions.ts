"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DayLog = {
  id: string;
  user_id: string;
  log_date: string;
  target_calories_override: number | null;
  notes: string | null;
};

type MealEntryPayload = {
  dayLogId: string;
  mealId?: string | null;
  name: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories_override?: number | null;
};

type MealEntryUpdate = {
  name?: string;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  calories_override?: number | null;
  meal_id?: string | null;
};

type DayLogUpdate = {
  target_calories_override?: number | null;
  notes?: string | null;
};

function normalizeDate(input: string): string {
  const trimmed = input?.trim();
  if (!trimmed) {
    throw new Error("Date is required");
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date.toISOString().slice(0, 10);
}

export async function getOrCreateDayLog(logDate: string): Promise<DayLog> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const normalizedDate = normalizeDate(logDate);

  const { data: existing, error: existingError } = await supabase
    .from("day_logs")
    .select("id, user_id, log_date, target_calories_override, notes")
    .eq("user_id", user.id)
    .eq("log_date", normalizedDate)
    .maybeSingle<DayLog>();

  if (existingError) {
    throw existingError;
  }
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("day_logs")
    .insert({
      user_id: user.id,
      log_date: normalizedDate,
    })
    .select("id, user_id, log_date, target_calories_override, notes")
    .single<DayLog>();

  if (error) throw error;
  return data;
}

export async function addMealEntry(payload: MealEntryPayload) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { dayLogId, name, protein_g, carbs_g, fat_g } = payload;
  // Ensure mealId is null if it's undefined, null, or the string "null"
  const mealId = payload.mealId && payload.mealId !== "null" ? payload.mealId : null;
  if (!dayLogId) throw new Error("dayLogId is required");
  if (!name?.trim()) throw new Error("Name is required");

  // Query for the current max order_index for this meal
  let orderQuery = supabase
    .from("meal_entries")
    .select("order_index")
    .eq("day_log_id", dayLogId);
  
  // Use .is() for null checks, .eq() for UUID values
  if (mealId) {
    orderQuery = orderQuery.eq("meal_id", mealId);
  } else {
    orderQuery = orderQuery.is("meal_id", null);
  }

  const { data: orderProbe, error: probeError } = await orderQuery
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle<{ order_index: number }>();
    
  if (probeError) {
    throw probeError;
  }
  const nextOrder = (orderProbe?.order_index ?? -1) + 1;

  const insertData = {
    day_log_id: dayLogId,
    meal_id: mealId,
    name: name.trim(),
    protein_g,
    carbs_g,
    fat_g,
    calories_override: payload.calories_override ?? null,
    order_index: nextOrder,
  };

  const { data, error } = await supabase
    .from("meal_entries")
    .insert(insertData)
    .select(
      "id, day_log_id, meal_id, name, protein_g, carbs_g, fat_g, calories_override, total_calories, order_index"
    )
    .single();

  if (error) throw error;
  revalidatePath("/(app)");
  return data;
}

export async function updateMealEntry(id: string, updates: MealEntryUpdate) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  if (!id) throw new Error("Entry id is required");

  const payload: Record<string, unknown> = { ...updates };
  if (payload.calories_override === undefined) {
    delete payload.calories_override;
  }
  if (typeof payload.name === "string") {
    const trimmed = (payload.name as string).trim();
    if (!trimmed) {
      throw new Error("Name cannot be empty");
    }
    payload.name = trimmed;
  }
  // Sanitize meal_id - convert string "null" to actual null
  if (payload.meal_id !== undefined) {
    payload.meal_id = payload.meal_id && payload.meal_id !== "null" ? payload.meal_id : null;
  }

  const { error } = await supabase
    .from("meal_entries")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/(app)");
}

export async function updateDayLog(dayLogId: string, updates: DayLogUpdate) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  if (!dayLogId) throw new Error("dayLogId is required");

  const payload: Record<string, unknown> = {};
  if (updates.target_calories_override !== undefined) {
    payload.target_calories_override = updates.target_calories_override;
  }
  if (updates.notes !== undefined) {
    payload.notes = updates.notes;
  }

  const { error } = await supabase
    .from("day_logs")
    .update(payload)
    .eq("id", dayLogId)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/(app)");
}

export async function deleteMealEntry(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  if (!id) throw new Error("Entry id is required");

  const { error } = await supabase
    .from("meal_entries")
    .delete()
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/(app)");
}

export async function reorderMealEntries(
  dayLogId: string,
  mealId: string | null,
  orderedIds: string[]
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  if (!dayLogId) throw new Error("dayLogId is required");

  // Ensure mealId is null if it's undefined, null, or the string "null"
  const sanitizedMealId = mealId && mealId !== "null" ? mealId : null;

  const entries = orderedIds ?? [];
  for (let index = 0; index < entries.length; index++) {
    const entryId = entries[index];
    const { error } = await supabase
      .from("meal_entries")
      .update({ order_index: index, meal_id: sanitizedMealId })
      .eq("id", entryId)
      .eq("day_log_id", dayLogId);
    if (error) throw error;
  }
  revalidatePath("/(app)");
}

export async function duplicateDay(fromDate: string, toDate: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const sourceDay = await getOrCreateDayLog(fromDate);
  const targetDay = await getOrCreateDayLog(toDate);

  if (sourceDay.id === targetDay.id) {
    throw new Error("Cannot duplicate a day onto itself");
  }

  const { error: updateMetaError } = await supabase
    .from("day_logs")
    .update({
      target_calories_override: sourceDay.target_calories_override,
      notes: sourceDay.notes,
    })
    .eq("id", targetDay.id);
  if (updateMetaError) throw updateMetaError;

  const { data: sourceEntries, error: sourceError } = await supabase
    .from("meal_entries")
    .select(
      "meal_id, name, protein_g, carbs_g, fat_g, calories_override, order_index"
    )
    .eq("day_log_id", sourceDay.id)
    .order("order_index", { ascending: true });
  if (sourceError) throw sourceError;

  const { error: deleteError } = await supabase
    .from("meal_entries")
    .delete()
    .eq("day_log_id", targetDay.id);
  if (deleteError) throw deleteError;

  if (sourceEntries && sourceEntries.length > 0) {
    const { error: insertError } = await supabase
      .from("meal_entries")
      .insert(
        sourceEntries.map((entry) => ({
          ...entry,
          day_log_id: targetDay.id,
        }))
      );
    if (insertError) throw insertError;
  }

  revalidatePath("/(app)");
}
