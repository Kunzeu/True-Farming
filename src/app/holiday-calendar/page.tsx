"use client";

import AdventCalendar from "@/components/ui/AdventCalendar";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function HolidayCalendarPage() {
  usePageTitle('pageTitles.holidayCalendar', 'Holiday Calendar');

  return (
    <div className="min-h-screen bg-gray-900">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdventCalendar year={2025} month={11} />
      </div>
    </div>
  );
}

