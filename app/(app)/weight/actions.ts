"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CreateWeightEntryInput, WeightEntry } from "./types";

/**
 * Get all weight entries for the current user, ordered by date descending
 */
export async function getWeightEntries(): Promise<WeightEntry[]> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("weight_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false });

  if (error) throw error;
  return data as WeightEntry[];
}

/**
 * Get the latest weight entry for the current user
 */
export async function getLatestWeightEntry(): Promise<WeightEntry | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("weight_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // If no entries exist, return null instead of throwing
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as WeightEntry;
}

/**
 * Create a new weight entry
 */
export async function createWeightEntry(
  input: CreateWeightEntryInput,
): Promise<WeightEntry> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("weight_entries")
    .insert({
      user_id: user.id,
      entry_date: input.entry_date,
      weight_kg: input.weight_kg,
      source: input.source || null,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/weight");
  revalidatePath("/");

  return data as WeightEntry;
}

/**
 * Delete a weight entry by ID
 */
export async function deleteWeightEntry(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("weight_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/weight");
  revalidatePath("/");
}

/**
 * Get weight entries within a date range for charting
 */
export async function getWeightEntriesInRange(
  startDate: string,
  endDate: string,
): Promise<WeightEntry[]> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("weight_entries")
    .select("*")
    .eq("user_id", user.id)
    .gte("entry_date", startDate)
    .lte("entry_date", endDate)
    .order("entry_date", { ascending: true });

  if (error) throw error;
  return data as WeightEntry[];
}
