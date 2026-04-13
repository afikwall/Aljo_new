import { useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { isSameDay, isSameMonth, toDateKey } from "@/utils/calendarUtils";
import { ShiftPill } from "@/components/ShiftPill";
import type { CalendarShiftEvent, CalendarHoliday } from "@/utils/scheduleTypes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarDayCellProps {
  date: Date;
  currentMonth: Date;
  today: Date;
  shifts: CalendarShiftEvent[];
  holiday: CalendarHoliday | null;
  isBlocked: boolean;
  isMobile: boolean;
  onDayClick: (date: Date) => void;
}

export const CalendarDayCell = ({
  date,
  currentMonth,
  today,
  shifts,
  holiday,
  isBlocked,
  isMobile,
  onDayClick,
}: CalendarDayCellProps) => {
  const isToday = isSameDay(date, today);
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const dayNumber = date.getDate();

  const maxPills = isMobile ? 2 : 3;
  const visibleShifts = useMemo(() => shifts.slice(0, maxPills), [shifts, maxPills]);
  const extraCount = shifts.length - visibleShifts.length;

  const handleClick = useCallback(() => {
    onDayClick(date);
  }, [onDayClick, date]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "relative flex flex-col p-1 md:p-1.5 border border-border/50 rounded-md text-left transition-colors",
        "h-16 md:h-24 overflow-hidden cursor-pointer",
        "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isToday && "ring-2 ring-primary",
        !isCurrentMonth && "bg-muted/30"
      )}
      style={
        isBlocked
          ? {
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(239,68,68,0.15) 4px, rgba(239,68,68,0.15) 8px)",
              borderLeftWidth: "2px",
              borderLeftColor: "hsl(var(--destructive) / 0.5)",
            }
          : undefined
      }
    >
      {/* Day number & holiday dot */}
      <div className="flex items-start justify-between w-full">
        <span
          className={cn(
            "text-xs font-medium leading-none",
            !isCurrentMonth && "text-muted-foreground/60",
            isToday && "text-primary font-bold"
          )}
        >
          {dayNumber}
        </span>
        {holiday && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="h-1.5 w-1.5 rounded-full bg-chart-3 shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {holiday.name}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Shift pills */}
      <div className="flex flex-col gap-0.5 mt-0.5 w-full min-w-0 flex-1">
        {visibleShifts.map((shift) => (
          <ShiftPill
            key={shift.applicationId}
            facilityName={shift.facilityName}
            startDateTime={shift.startDateTime}
            variant={shift.variant}
          />
        ))}
        {extraCount > 0 && (
          <span className="text-[10px] text-muted-foreground leading-tight pl-1">
            +{extraCount} more
          </span>
        )}
      </div>
    </button>
  );
};