"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWeightEntry } from "./actions";
import { toast } from "sonner";

export function WeightForm() {
  const [isPending, startTransition] = useTransition();
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(() => {
    // Default to today's date in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const weightKg = parseFloat(weight);
    if (isNaN(weightKg) || weightKg <= 0) {
      toast.error("Please enter a valid weight");
      return;
    }

    startTransition(async () => {
      try {
        await createWeightEntry({
          entry_date: date,
          weight_kg: weightKg,
          source: "manual",
        });
        toast.success("Weight logged successfully");
        setWeight("");
        // Keep the date as-is for easy consecutive entries
      } catch (error) {
        console.error("Failed to log weight:", error);
        toast.error("Failed to log weight");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            placeholder="75.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={isPending}
            max={new Date().toISOString().split("T")[0]} // Can't log future weights
          />
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Logging..." : "Log Weight"}
      </Button>
    </form>
  );
}
