"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdventCalendar from "@/components/ui/AdventCalendar";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessAdventCalendar } from "@/lib/advent-access";

export default function HolidayCalendarPage() {
  usePageTitle('pageTitles.holidayCalendar', 'Holiday Calendar');
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const allowed = canAccessAdventCalendar(user);

  useEffect(() => {
    if (!isLoading && !allowed) {
      router.replace('/');
    }
  }, [isLoading, allowed, router]);

  if (isLoading || !allowed) {
    return <div className="min-h-screen bg-gray-900" />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdventCalendar year={2025} month={11} />
      </div>
    </div>
  );
}
