"use client";

import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { calculateBmi, mifflinStJeorSuggestion, type Sex } from "@/lib/calculations";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  id: z.string().uuid(),
  age: z.coerce.number().int().min(1).max(120).nullable().optional(),
  sex: z.enum(["male", "female"]).nullable().optional(),
  height_cm: z.coerce.number().int().min(100).max(250).nullable().optional(),
  current_weight_kg: z.coerce.number().min(20).max(400).nullable().optional(),
  goal_weight_kg: z.coerce.number().min(20).max(400).nullable().optional(),
  activity_factor: z.coerce.number().min(1).max(2).nullable().optional(),
  deficit_choice: z.coerce.number().min(0).max(1500).nullable().optional(),
  target_calories: z.coerce.number().min(0).max(10000).nullable().optional(),
  suggested_calories: z.coerce.number().min(0).max(10000).nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProfileForm({ initialData }: { initialData: Partial<FormValues> & { id: string } }) {
  const supabase = createSupabaseBrowserClient();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: initialData.id,
      age: initialData.age ?? undefined,
      sex: (initialData.sex as Sex | null) ?? undefined,
      height_cm: initialData.height_cm ?? undefined,
      current_weight_kg: initialData.current_weight_kg ?? undefined,
      goal_weight_kg: initialData.goal_weight_kg ?? undefined,
      activity_factor: initialData.activity_factor ?? 1.2,
      deficit_choice: initialData.deficit_choice ?? 0,
      target_calories: initialData.target_calories ?? undefined,
      suggested_calories: initialData.suggested_calories ?? undefined,
    },
  });

  const values = form.watch();
  const bmi = useMemo(
    () => calculateBmi(values.current_weight_kg ?? null, values.height_cm ?? null),
    [values.current_weight_kg, values.height_cm]
  );

  const suggested = useMemo(
    () =>
      mifflinStJeorSuggestion({
        sex: (values.sex as Sex | null) ?? null,
        age: values.age ?? null,
        heightCm: values.height_cm ?? null,
        weightKg: values.current_weight_kg ?? null,
        activityFactor: values.activity_factor ?? null,
        deficit: values.deficit_choice ?? null,
      }),
    [values.sex, values.age, values.height_cm, values.current_weight_kg, values.activity_factor, values.deficit_choice]
  );

  async function onSubmit(data: FormValues) {
    startTransition(async () => {
      const payload = { ...data, suggested_calories: suggested ?? data.suggested_calories };
      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Profile saved");
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" {...form.register("age")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <Select value={values.sex ?? undefined} onValueChange={(v) => form.setValue("sex", v as Sex)}>
                <SelectTrigger id="sex">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="height_cm">Height (cm)</Label>
              <Input id="height_cm" type="number" {...form.register("height_cm")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_weight_kg">Current Weight (kg)</Label>
              <Input id="current_weight_kg" type="number" step="0.1" {...form.register("current_weight_kg")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal_weight_kg">Goal Weight (kg)</Label>
              <Input id="goal_weight_kg" type="number" step="0.1" {...form.register("goal_weight_kg")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity_factor">Activity Factor</Label>
              <Input id="activity_factor" type="number" step="0.05" {...form.register("activity_factor")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deficit_choice">Deficit (kcal)</Label>
              <Input id="deficit_choice" type="number" step="50" {...form.register("deficit_choice")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_calories">Target Calories</Label>
              <Input id="target_calories" type="number" {...form.register("target_calories")} />
            </div>

            <div className="space-y-2">
              <Label>Suggested Calories</Label>
              <Input readOnly value={suggested ?? ""} />
            </div>

            <div className="md:col-span-2 flex gap-2 justify-end mt-2">
              <Button type="submit" disabled={isPending}>Save</Button>
            </div>
          </form>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>BMI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">{bmi ? `${bmi}` : "—"}</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


