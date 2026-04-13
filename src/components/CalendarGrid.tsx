import { useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CalendarDayCell } from "@/components/CalendarDayCell";
import {
  generateCalendarDays,
  toDateKey,
  format,
  addMonths,
  subMonths,
} from "@/utils/calendarUtils";
import type {
  CalendarShiftEvent,
  CalendarHoliday,
} from "@/utils/scheduleTypes";

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarGridProps {
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
  shiftsMap: Record<string, CalendarShiftEvent[]>;
  holidaysMap: Record<string, CalendarHoliday>;
  blockedDatesSet: Set<string>;
  isMobile: boolean;
  onDayClick: (date: Date) => void;
}

export const CalendarGrid = ({
  currentMonth,
  onMonthChange,
  shiftsMap,
  holidaysMap,
  blockedDatesSet,
  isMobile,
  onDayClick,
}: CalendarGridProps) => {
  const today = useMemo(() => new Date(), []);

  const calendarDays = useMemo(
    () => generateCalendarDays(currentMonth),
    [currentMonth]
  );

  const monthLabel = useMemo(
    () => format(currentMonth, "MMMM yyyy"),
    [currentMonth]
  );

  const handlePrev = useCallback(() => {
    onMonthChange(subMonths(currentMonth, 1));
  }, [currentMonth, onMonthChange]);

  const handleNext = useCallback(() => {
    onMonthChange(addMonths(currentMonth, 1));
  }, [currentMonth, onMonthChange]);

  const handleToday = useCallback(() => {
    onMonthChange(new Date());
  }, [onMonthChange]);

  return (
    <div className="space-y-2">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handlePrev}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{monthLabel}</h2>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={handleNext}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAY_HEADERS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1.5"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <TooltipProvider>
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((date) => {
            const key = toDateKey(date);
            return (
              <CalendarDayCell
                key={key}
                date={date}
                currentMonth={currentMonth}
                today={today}
                shifts={shiftsMap[key] || []}
                holiday={holidaysMap[key] || null}
                isBlocked={blockedDatesSet.has(key)}
                isMobile={isMobile}
                onDayClick={onDayClick}
              />
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
};