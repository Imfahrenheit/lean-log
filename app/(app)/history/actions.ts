"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DaySummary, HistoryStats } from "./types";

/**
 * Get day summaries for a date range with aggregated totals
 */
export async function getDaySummaries(
  startDate: string,
  endDate: string
): Promise<DaySummary[]> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get all day logs in the range
  const { data: dayLogs, error: dayLogsError } = await supabase
    .from("day_logs")
    .select("id, log_date, target_calories_override, notes")
    .eq("user_id", user.id)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: false });

  if (dayLogsError) throw dayLogsError;
  if (!dayLogs || dayLogs.length === 0) return [];

  const dayLogIds = dayLogs.map((log) => log.id);

  // Get all meal entries for these day logs
  const { data: entries, error: entriesError } = await supabase
    .from("meal_entries")
    .select(
      "day_log_id, protein_g, carbs_g, fat_g, total_calories"
    )
    .in("day_log_id", dayLogIds);

  if (entriesError) throw entriesError;

  // Get user's profile for default target
  const { data: profile } = await supabase
    .from("profiles")
    .select("target_calories, suggested_calories")
    .eq("id", user.id)
    .single();

  const defaultTarget = profile?.target_calories ?? profile?.suggested_calories ?? null;

  // Aggregate entries by day_log_id
  const entriesByDay = new Map<string, typeof entries>();
  entries?.forEach((entry) => {
    const existing = entriesByDay.get(entry.day_log_id) || [];
    existing.push(entry);
    entriesByDay.set(entry.day_log_id, existing);
  });

  // Build summaries
  const summaries: DaySummary[] = dayLogs.map((log) => {
    const dayEntries = entriesByDay.get(log.id) || [];
    const totals = dayEntries.reduce(
      (acc, entry) => ({
        calories: acc.calories + (entry.total_calories || 0),
        protein: acc.protein + (entry.protein_g || 0),
        carbs: acc.carbs + (entry.carbs_g || 0),
        fat: acc.fat + (entry.fat_g || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      log_date: log.log_date,
      total_calories: totals.calories,
      total_protein: totals.protein,
      total_carbs: totals.carbs,
      total_fat: totals.fat,
      entry_count: dayEntries.length,
      target_calories: log.target_calories_override ?? defaultTarget,
      notes: log.notes,
    };
  });

  return summaries;
}

/**
 * Get history statistics for the last N days
 */
export async function getHistoryStats(days: number = 30): Promise<HistoryStats> {
  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const summaries = await getDaySummaries(startDate, endDate);

  if (summaries.length === 0) {
    return {
      totalDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0,
    };
  }

  // Calculate averages
  const totals = summaries.reduce(
    (acc, day) => ({
      calories: acc.calories + day.total_calories,
      protein: acc.protein + day.total_protein,
      carbs: acc.carbs + day.total_carbs,
      fat: acc.fat + day.total_fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const daysWithEntries = summaries.filter((s) => s.entry_count > 0);
  const count = daysWithEntries.length || 1;

  // Calculate streaks (consecutive days with entries)
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Sort by date ascending to calculate streaks
  const sortedSummaries = [...summaries].sort(
    (a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
  );

  const today = new Date().toISOString().slice(0, 10);
  let foundToday = false;

  for (let i = sortedSummaries.length - 1; i >= 0; i--) {
    const summary = sortedSummaries[i];
    if (summary.entry_count > 0) {
      tempStreak++;
      if (!foundToday && summary.log_date === today) {
        foundToday = true;
        currentStreak = tempStreak;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      if (!foundToday) {
        tempStreak = 0;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
  }

  return {
    totalDays: daysWithEntries.length,
    currentStreak,
    longestStreak,
    avgCalories: Math.round(totals.calories / count),
    avgProtein: Math.round(totals.protein / count),
    avgCarbs: Math.round(totals.carbs / count),
    avgFat: Math.round(totals.fat / count),
  };
}

/**
 * Get summaries for a specific month
 */
export async function getMonthSummaries(
  year: number,
  month: number
): Promise<DaySummary[]> {
  const startDate = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const endDate = new Date(year, month, 0).toISOString().slice(0, 10);
  return getDaySummaries(startDate, endDate);
}
