export type Sex = "male" | "female";

export function calculateBmi(weightKg: number | null | undefined, heightCm: number | null | undefined): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10; // 1 decimal
}

export function calculateCaloriesFromMacros(proteinG: number, carbsG: number, fatG: number): number {
  const safe = (n: number) => (Number.isFinite(n) ? n : 0);
  const p = safe(proteinG);
  const c = safe(carbsG);
  const f = safe(fatG);
  return p * 4 + c * 4 + f * 9;
}

export function mifflinStJeorSuggestion(params: {
  sex: Sex | null | undefined;
  age: number | null | undefined;
  heightCm: number | null | undefined;
  weightKg: number | null | undefined;
  activityFactor: number | null | undefined; // 1.2 – 1.725
  deficit: number | null | undefined; // e.g., 250/500
}): number | null {
  const { sex, age, heightCm, weightKg } = params;
  let { activityFactor, deficit } = params;
  if (!sex || !age || !heightCm || !weightKg) return null;
  if (!activityFactor || activityFactor <= 0) activityFactor = 1.2;
  if (!deficit) deficit = 0;

  const w = weightKg;
  const h = heightCm;
  const a = age;

  const bmr = sex === "male"
    ? 10 * w + 6.25 * h - 5 * a + 5
    : 10 * w + 6.25 * h - 5 * a - 161;

  const tdee = bmr * activityFactor;
  const suggested = Math.max(0, Math.round(tdee - deficit));
  return suggested;
}


