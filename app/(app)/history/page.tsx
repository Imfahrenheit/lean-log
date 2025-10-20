import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { getMonthSummaries, getHistoryStats } from "./actions";
import HistoryClient from "./history-client";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

async function resolveParams(searchParams?: PageSearchParams) {
  const params = await searchParams;
  const yearParam = params?.year;
  const monthParam = params?.month;

  const year = yearParam
    ? parseInt(Array.isArray(yearParam) ? yearParam[0] : yearParam)
    : new Date().getFullYear();
  const month = monthParam
    ? parseInt(Array.isArray(monthParam) ? monthParam[0] : monthParam)
    : new Date().getMonth() + 1;

  return { year, month };
}

async function HistoryContent({
  searchParams,
}: {
  searchParams?: PageSearchParams;
}) {
  const { year, month } = await resolveParams(searchParams);

  const [summaries, stats] = await Promise.all([
    getMonthSummaries(year, month),
    getHistoryStats(30),
  ]);

  return (
    <HistoryClient
      initialSummaries={summaries}
      initialStats={stats}
      initialYear={year}
      initialMonth={month}
    />
  );
}

export default function HistoryPage({
  searchParams,
}: {
  searchParams?: PageSearchParams;
}) {
  return (
    <div className="p-3 sm:p-4 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">History</h1>
        <p className="text-muted-foreground mt-1">
          View your tracking history and statistics
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-4 w-20 mb-4" />
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </Card>
              ))}
            </div>
            <Skeleton className="h-[400px] w-full" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        }
      >
        <HistoryContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
