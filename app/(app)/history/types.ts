export interface DaySummary {
  log_date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  entry_count: number;
  target_calories: number | null;
  notes: string | null;
}

export interface HistoryStats {
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
}
