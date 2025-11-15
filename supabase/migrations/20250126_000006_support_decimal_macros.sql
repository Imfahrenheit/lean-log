-- Change integer columns to numeric to support decimal values for macros
-- First, drop generated columns that depend on these columns
alter table public.meal_entries
  drop column if exists calories_calculated,
  drop column if exists total_calories;

-- Now alter the base columns
alter table public.meal_entries
  alter column protein_g type numeric(10,2) using protein_g::numeric(10,2),
  alter column carbs_g type numeric(10,2) using carbs_g::numeric(10,2),
  alter column fat_g type numeric(10,2) using fat_g::numeric(10,2),
  alter column calories_override type numeric(10,2) using nullif(calories_override, null)::numeric(10,2);

-- Recreate generated columns with numeric type
alter table public.meal_entries
  add column calories_calculated numeric(10,2) generated always as ((protein_g*4) + (carbs_g*4) + (fat_g*9)) stored,
  add column total_calories numeric(10,2) generated always as (coalesce(calories_override, (protein_g*4) + (carbs_g*4) + (fat_g*9))) stored;

-- Also update meals table for consistency
alter table public.meals
  alter column target_protein_g type numeric(10,2) using nullif(target_protein_g, null)::numeric(10,2),
  alter column target_carbs_g type numeric(10,2) using nullif(target_carbs_g, null)::numeric(10,2),
  alter column target_fat_g type numeric(10,2) using nullif(target_fat_g, null)::numeric(10,2),
  alter column target_calories type numeric(10,2) using nullif(target_calories, null)::numeric(10,2);

