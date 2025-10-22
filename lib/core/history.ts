import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type DaySummary = {
  log_date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  entry_count: number;
  target_calories: number | null;
  notes: string | null;
};

export async function getDaySummariesForUser(userId: string, startDate: string, endDate: string): Promise<DaySummary[]> {
  const supabase = createSupabaseServiceClient();

  const { data: dayLogs, error: dayLogsError } = await supabase
    .from("day_logs")
    .select("id, log_date, target_calories_override, notes")
    .eq("user_id", userId)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: false });
  if (dayLogsError) throw dayLogsError;
  if (!dayLogs || dayLogs.length === 0) return [];

  const dayLogIds = dayLogs.map((l) => l.id);
  const { data: entries, error: entriesError } = await supabase
    .from("meal_entries")
    .select("day_log_id, protein_g, carbs_g, fat_g, total_calories")
    .in("day_log_id", dayLogIds);
  if (entriesError) throw entriesError;

  const { data: profile } = await supabase
    .from("profiles")
    .select("target_calories, suggested_calories")
    .eq("id", userId)
    .single<{ target_calories: number | null; suggested_calories: number | null }>();
  const defaultTarget = profile?.target_calories ?? profile?.suggested_calories ?? null;

  const byDay = new Map<string, typeof entries>();
  entries?.forEach((e) => {
    const arr = byDay.get(e.day_log_id) || [];
    arr.push(e);
    byDay.set(e.day_log_id, arr);
  });

  const summaries: DaySummary[] = (dayLogs as any[]).map((log) => {
    const dayEntries = byDay.get(log.id) || [];
    const totals = dayEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + (e.total_calories || 0),
        protein: acc.protein + (e.protein_g || 0),
        carbs: acc.carbs + (e.carbs_g || 0),
        fat: acc.fat + (e.fat_g || 0),
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


