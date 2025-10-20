"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteWeightEntry } from "./actions";
import { toast } from "sonner";
import type { WeightEntry } from "./types";

interface WeightListProps {
  entries: WeightEntry[];
  heightCm?: number;
}

export function WeightList({ entries, heightCm }: WeightListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!confirm("Delete this weight entry?")) return;

    startTransition(async () => {
      try {
        await deleteWeightEntry(id);
        toast.success("Weight entry deleted");
      } catch (error) {
        console.error("Failed to delete weight:", error);
        toast.error("Failed to delete weight entry");
      }
    });
  };

  const calculateBMI = (weightKg: number): number | null => {
    if (!heightCm || heightCm <= 0) return null;
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (entries.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p>No weight entries yet. Log your first weight above!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const bmi = calculateBMI(entry.weight_kg);
        return (
          <Card
            key={entry.id}
            className="p-3 sm:p-4 flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-lg sm:text-xl font-semibold">
                  {entry.weight_kg.toFixed(1)} kg
                </span>
                {bmi && (
                  <span className="text-sm text-muted-foreground">
                    BMI: {bmi.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(entry.entry_date)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(entry.id)}
              disabled={isPending}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
