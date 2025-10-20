import { redirect } from "next/navigation";
import { Suspense } from "react";
import { calculateCaloriesFromMacros } from "@/lib/calculations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { getOrCreateDayLog } from "./actions";
import { getLatestWeightEntry } from "./weight/actions";
import { MacroTotals, TodaySummary, TodayViewProps } from "./today.types";
import TodayClient from "./today-client";
import { TodayDateSync } from "./today-date-sync";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

async function resolveDate(searchParams?: PageSearchParams): Promise<string> {
  const params = await searchParams;
  const param = params?.date;
  const value = Array.isArray(param) ? param[0] : param;
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
}

function aggregateEntries(entries: TodayViewProps["entries"]): MacroTotals {
  return entries.reduce<MacroTotals>(
    (acc, entry) => {
      acc.calories += entry.total_calories ?? 0;
      acc.protein += entry.protein_g ?? 0;
      acc.carbs += entry.carbs_g ?? 0;
      acc.fat += entry.fat_g ?? 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function aggregateMealTargets(meals: TodayViewProps["meals"]): MacroTotals {
  return meals.reduce<MacroTotals>(
    (acc, meal) => {
      acc.protein += meal.target_protein_g ?? 0;
      acc.carbs += meal.target_carbs_g ?? 0;
      acc.fat += meal.target_fat_g ?? 0;
      if (meal.target_calories != null) {
        acc.calories += meal.target_calories;
      } else {
        const computed = calculateCaloriesFromMacros(
          meal.target_protein_g ?? 0,
          meal.target_carbs_g ?? 0,
          meal.target_fat_g ?? 0
        );
        acc.calories += computed;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams?: PageSearchParams;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const resolvedDate = await resolveDate(searchParams);
  const dayLog = await getOrCreateDayLog(resolvedDate);

  const { data: mealsData } = await supabase
    .from("meals")
    .select(
      "id, name, order_index, target_protein_g, target_carbs_g, target_fat_g, target_calories"
    )
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("order_index", { ascending: true });

  const { data: entriesData } = await supabase
    .from("meal_entries")
    .select(
      "id, day_log_id, meal_id, name, protein_g, carbs_g, fat_g, calories_override, total_calories, order_index"
    )
    .eq("day_log_id", dayLog.id)
    .order("meal_id", { ascending: true, nullsFirst: true })
    .order("order_index", { ascending: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("target_calories, suggested_calories, height_cm")
    .eq("id", user.id)
    .maybeSingle();

  // Fetch latest weight entry
  const latestWeight = await getLatestWeightEntry();

  const meals = mealsData ?? [];
  const entries = entriesData ?? [];

  const totals = aggregateEntries(entries);
  const targetMacros = aggregateMealTargets(meals);
  const profileTargetCalories = profile?.target_calories ?? profile?.suggested_calories ?? null;
  const targetCalories =
    dayLog.target_calories_override ??
    profileTargetCalories ??
    (targetMacros.calories > 0 ? targetMacros.calories : null);

  const summary: TodaySummary = {
    totals,
    targetMacros,
    targetCalories,
    profileTargetCalories,
  };

  return (
    <>
      <Suspense fallback={null}>
        <TodayDateSync />
      </Suspense>
      <TodayClient
        selectedDate={dayLog.log_date ?? resolvedDate}
        dayLog={dayLog}
        meals={meals}
        entries={entries}
        summary={summary}
        heightCm={profile?.height_cm ?? null}
        latestWeightKg={latestWeight?.weight_kg ?? null}
      />
    </>
  );
}
