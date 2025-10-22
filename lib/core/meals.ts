import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type Meal = {
  id: string;
  user_id: string;
  name: string;
  order_index: number;
  archived: boolean;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
  target_calories: number | null;
  created_at: string;
  updated_at: string;
};

export async function listMealsForUser(userId: string, opts?: { includeArchived?: boolean }) {
  const supabase = createSupabaseServiceClient();
  let query = supabase
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .order("order_index", { ascending: true });

  if (!opts?.includeArchived) {
    query = query.eq("archived", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Meal[];
}


