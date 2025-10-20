"use client";

import { useState } from "react";
import { CalendarView } from "./calendar-view";
import { DaySummaryList } from "./day-summary-list";
import { StatsCards } from "./stats-cards";
import type { DaySummary, HistoryStats } from "./types";

interface HistoryClientProps {
  initialSummaries: DaySummary[];
  initialStats: HistoryStats;
  initialYear: number;
  initialMonth: number;
}

export default function HistoryClient({
  initialSummaries,
  initialStats,
  initialYear,
  initialMonth,
}: HistoryClientProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [summaries] = useState(initialSummaries);
  const [stats] = useState(initialStats);

  const handleMonthChange = async (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
    // Trigger a page navigation to fetch new data
    window.location.href = `/history?year=${newYear}&month=${newMonth}`;
  };

  // Filter summaries for the selected month
  const monthSummaries = summaries.filter((s) => {
    const date = new Date(s.log_date + "T00:00:00");
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <StatsCards stats={stats} />

      {/* Calendar View */}
      <CalendarView
        summaries={monthSummaries}
        year={year}
        month={month}
        onMonthChange={handleMonthChange}
      />

      {/* Recent Days List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Days</h2>
        <DaySummaryList summaries={summaries.slice(0, 10)} />
      </div>
    </div>
  );
}
