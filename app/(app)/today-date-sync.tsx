"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Client component that ensures the Today page uses the user's local timezone
 * Redirects to add ?date=YYYY-MM-DD param with local date if no date is specified
 */
export function TodayDateSync() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const dateParam = searchParams.get("date");

    // Only run if no date parameter is present
    if (!dateParam) {
      // Get local date in YYYY-MM-DD format
      const now = new Date();
      const localToday = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");

      // Set the date parameter to local today
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", localToday);
      router.replace(`/?${params.toString()}`, { scroll: false });
    }
  }, [router, searchParams]);

  return null; // This component doesn't render anything
}
