import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, age, sex, height_cm, current_weight_kg, goal_weight_kg, activity_factor, deficit_choice, target_calories, suggested_calories")
    .eq("id", user.id)
    .maybeSingle();

  return <ProfileForm initialData={profile ?? { id: user.id }} />;
}


