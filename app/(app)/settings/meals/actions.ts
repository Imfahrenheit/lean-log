"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createMeal(payload: {
  name: string;
  target_protein_g?: number | null;
  target_carbs_g?: number | null;
  target_fat_g?: number | null;
  target_calories?: number | null;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error, data } = await supabase
    .from("meals")
    .insert({
      user_id: user.id,
      name: payload.name,
      target_protein_g: payload.target_protein_g ?? null,
      target_carbs_g: payload.target_carbs_g ?? null,
      target_fat_g: payload.target_fat_g ?? null,
      target_calories: payload.target_calories ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/(app)/settings/meals");
  return data;
}

export async function updateMeal(
  id: string,
  payload: Partial<{
    name: string;
    target_protein_g: number | null;
    target_carbs_g: number | null;
    target_fat_g: number | null;
    target_calories: number | null;
    archived: boolean;
  }>
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("meals")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/(app)/settings/meals");
}

export async function deleteMeal(id: string) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("meals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/(app)/settings/meals");
}

export async function reorderMeals(idsInOrder: string[]) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Update order_index based on array position
  for (let index = 0; index < idsInOrder.length; index++) {
    const id = idsInOrder[index];
    const { error } = await supabase
      .from("meals")
      .update({ order_index: index })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
  }
  revalidatePath("/(app)/settings/meals");
}
