"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DaySummary } from "./types";

interface DaySummaryListProps {
  summaries: DaySummary[];
}

export function DaySummaryList({ summaries }: DaySummaryListProps) {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatus = (
    calories: number,
    target: number | null
  ): "on-target" | "over" | "under" | "no-target" => {
    if (!target) return "no-target";
    const percentage = (calories / target) * 100;
    if (percentage > 110) return "over";
    if (percentage < 90) return "under";
    return "on-target";
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "on-target":
        return "text-green-600 dark:text-green-400";
      case "over":
        return "text-red-600 dark:text-red-400";
      case "under":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-muted-foreground";
    }
  };

  if (summaries.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p>No logged days in this period. Start tracking your meals!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {summaries.map((summary) => {
        const status = getStatus(summary.total_calories, summary.target_calories);
        return (
          <Link key={summary.log_date} href={`/?date=${summary.log_date}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {formatDate(summary.log_date)}
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {summary.entry_count} {summary.entry_count === 1 ? "entry" : "entries"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${getStatusColor(status)}`}>
                      {summary.total_calories}
                    </span>
                    <span className="text-sm text-muted-foreground">kcal</span>
                    {summary.target_calories && (
                      <span className="text-sm text-muted-foreground">
                        / {summary.target_calories} target
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>P: {summary.total_protein}g</span>
                    <span>C: {summary.total_carbs}g</span>
                    <span>F: {summary.total_fat}g</span>
                  </div>
                  {summary.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {summary.notes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
