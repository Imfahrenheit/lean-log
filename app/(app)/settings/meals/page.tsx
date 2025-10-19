import { createSupabaseServerClient } from "@/lib/supabase/server";
import MealsClient from "./ui";

export default async function MealsPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: meals } = await supabase
    .from("meals")
    .select(
      "id, name, order_index, target_protein_g, target_carbs_g, target_fat_g, target_calories, archived"
    )
    .eq("user_id", user.id)
    .order("order_index", { ascending: true });

  return <MealsClient initialMeals={meals ?? []} />;
}
