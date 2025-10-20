export type DayLogDTO = {
  id: string;
  log_date: string;
  target_calories_override: number | null;
  notes: string | null;
};

export type MealTemplate = {
  id: string;
  name: string;
  order_index: number;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
  target_calories: number | null;
};

export type MealEntryDTO = {
  id: string;
  day_log_id: string;
  meal_id: string | null;
  name: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories_override: number | null;
  total_calories: number;
  order_index: number;
};

export type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type TodaySummary = {
  totals: MacroTotals;
  targetMacros: MacroTotals;
  targetCalories: number | null;
  profileTargetCalories: number | null;
};

export type TodayViewProps = {
  selectedDate: string;
  dayLog: DayLogDTO;
  meals: MealTemplate[];
  entries: MealEntryDTO[];
  summary: TodaySummary;
  heightCm: number | null;
  latestWeightKg: number | null;
};
