"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WeightEntry } from "./types";

interface WeightChartProps {
  entries: WeightEntry[];
}

type TimeRange = 30 | 60 | 90;

export function WeightChart({ entries }: WeightChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  // Filter entries based on time range
  const getFilteredEntries = () => {
    if (entries.length === 0) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);

    return entries
      .filter((entry) => new Date(entry.entry_date) >= cutoffDate)
      .sort(
        (a, b) =>
          new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime(),
      );
  };

  const filteredEntries = getFilteredEntries();

  // Format data for recharts
  const chartData = filteredEntries.map((entry) => ({
    date: new Date(entry.entry_date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    weight: parseFloat(entry.weight_kg.toFixed(1)),
  }));

  // Calculate weight change
  const getWeightChange = () => {
    if (filteredEntries.length < 2) return null;
    const first = filteredEntries[0].weight_kg;
    const last = filteredEntries[filteredEntries.length - 1].weight_kg;
    const change = last - first;
    return {
      value: Math.abs(change),
      direction: change > 0 ? "gained" : change < 0 ? "lost" : "maintained",
    };
  };

  const weightChange = getWeightChange();

  if (entries.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p>Log at least 2 weight entries to see your progress chart</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">Weight Trend</h3>
          {weightChange && (
            <p className="text-sm text-muted-foreground mt-1">
              You&apos;ve {weightChange.direction}{" "}
              <span className="font-medium">
                {weightChange.value.toFixed(1)} kg
              </span>{" "}
              in the last {timeRange} days
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(30)}
          >
            30d
          </Button>
          <Button
            variant={timeRange === 60 ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(60)}
          >
            60d
          </Button>
          <Button
            variant={timeRange === 90 ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(90)}
          >
            90d
          </Button>
        </div>
      </div>

      {chartData.length < 2 ? (
        <div className="h-[200px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
          <p>Need at least 2 entries in this time range to show chart</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              domain={["dataMin - 2", "dataMax + 2"]}
              className="text-xs"
              tick={{ fontSize: 12 }}
              label={{
                value: "Weight (kg)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12 },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
