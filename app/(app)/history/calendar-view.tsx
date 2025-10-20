"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DaySummary } from "./types";

interface CalendarViewProps {
  summaries: DaySummary[];
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
}

export function CalendarView({
  summaries,
  year,
  month,
  onMonthChange,
}: CalendarViewProps) {
  const summaryMap = useMemo(() => {
    const map = new Map<string, DaySummary>();
    summaries.forEach((s) => map.set(s.log_date, s));
    return map;
  }, [summaries]);

  const monthName = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  const getDayStatus = (day: number): "empty" | "logged" | "over" | "under" => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const summary = summaryMap.get(dateStr);

    if (!summary || summary.entry_count === 0) return "empty";
    if (!summary.target_calories) return "logged";

    const percentage = (summary.total_calories / summary.target_calories) * 100;
    if (percentage > 110) return "over";
    if (percentage < 90) return "under";
    return "logged";
  };

  const getDayLink = (day: number): string => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return `/?date=${dateStr}`;
  };

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = new Array(firstDay).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{monthName}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-xs sm:text-sm font-medium text-muted-foreground p-2"
          >
            {day}
          </div>
        ))}

        {weeks.map((week, weekIdx) =>
          week.map((day, dayIdx) => {
            if (day === null) {
              return <div key={`empty-${weekIdx}-${dayIdx}`} className="p-2" />;
            }

            const status = getDayStatus(day);
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const summary = summaryMap.get(dateStr);

            return (
              <Link
                key={day}
                href={getDayLink(day)}
                className={cn(
                  "aspect-square p-1 sm:p-2 rounded-md flex flex-col items-center justify-center text-sm transition-colors",
                  status === "empty" && "hover:bg-muted",
                  status === "logged" && "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50",
                  status === "over" && "bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50",
                  status === "under" && "bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                )}
              >
                <span className="font-medium">{day}</span>
                {summary && summary.entry_count > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {summary.total_calories}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs sm:text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30" />
          <span>On target</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/30" />
          <span>Under target</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30" />
          <span>Over target</span>
        </div>
      </div>
    </Card>
  );
}
