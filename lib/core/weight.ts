import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type WeightEntry = {
  id: string;
  user_id: string;
  entry_date: string;
  weight_kg: number;
  source: string | null;
  created_at: string;
  updated_at: string;
};

export async function getLatestWeightEntryForUser(userId: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("weight_entries")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(1)
    .maybeSingle<WeightEntry>();
  if (error) throw error;
  return data ?? null;
}

export async function createWeightEntryForUser(input: {
  userId: string;
  entry_date: string;
  weight_kg: number;
  source?: string | null;
}): Promise<WeightEntry> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("weight_entries")
    .insert({
      user_id: input.userId,
      entry_date: input.entry_date,
      weight_kg: input.weight_kg,
      source: input.source ?? null,
    })
    .select("*")
    .single<WeightEntry>();
  if (error) throw error;
  return data;
}

export async function listRecentWeightEntriesForUser(userId: string, limit = 50) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("weight_entries")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(Math.max(1, Math.min(200, limit)));
  if (error) throw error;
  return (data ?? []) as WeightEntry[];
}

export async function deleteWeightEntryForUser(userId: string, id: string) {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("weight_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}


