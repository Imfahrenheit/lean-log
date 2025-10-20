import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WeightForm } from "./weight-form";
import { WeightList } from "./weight-list";
import { WeightChart } from "./weight-chart";
import { getWeightEntries } from "./actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function WeightContent() {
  const supabase = await createSupabaseServerClient();
  
  // Get user profile for height (needed for BMI calculation)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  let heightCm: number | undefined;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("height_cm")
      .eq("id", user.id)
      .single();
    heightCm = profile?.height_cm || undefined;
  }

  const entries = await getWeightEntries();

  return (
    <div className="space-y-6">
      {/* Log Weight Form */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-4">Log Weight</h2>
        <WeightForm />
      </Card>

      {/* Weight Chart */}
      {entries.length > 0 && <WeightChart entries={entries} />}

      {/* Weight History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Weight History</h2>
        <WeightList entries={entries} heightCm={heightCm} />
      </div>
    </div>
  );
}

export default function WeightPage() {
  return (
    <div className="p-3 sm:p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Weight Tracker</h1>
        <p className="text-muted-foreground mt-1">
          Track your weight progress over time
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <Card className="p-4 sm:p-6">
              <Skeleton className="h-8 w-32 mb-4" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-32" />
              </div>
            </Card>
            <Skeleton className="h-[300px] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        }
      >
        <WeightContent />
      </Suspense>
    </div>
  );
}
