export interface WeightEntry {
  id: string;
  user_id: string;
  entry_date: string; // ISO date string (YYYY-MM-DD)
  weight_kg: number;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWeightEntryInput {
  entry_date: string; // ISO date string (YYYY-MM-DD)
  weight_kg: number;
  source?: string;
}
