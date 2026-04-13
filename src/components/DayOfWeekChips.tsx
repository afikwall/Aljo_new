import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { DAY_OF_WEEK_OPTIONS, type DayOfWeekValue } from "@/utils/bulkShiftUtils";

interface DayOfWeekChipsProps {
  selectedDays: DayOfWeekValue[];
  onSelectedDaysChange: (days: DayOfWeekValue[]) => void;
}

export const DayOfWeekChips = ({
  selectedDays,
  onSelectedDaysChange,
}: DayOfWeekChipsProps) => {
  const handleToggle = useCallback(
    (dayValue: DayOfWeekValue) => {
      if (selectedDays.includes(dayValue)) {
        onSelectedDaysChange(selectedDays.filter((d) => d !== dayValue));
      } else {
        onSelectedDaysChange([...selectedDays, dayValue]);
      }
    },
    [selectedDays, onSelectedDaysChange]
  );

  return (
    <div className="flex flex-wrap gap-2">
      {DAY_OF_WEEK_OPTIONS.map((day) => {
        const isSelected = selectedDays.includes(day.value);
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => handleToggle(day.value)}
            className={cn(
              "min-w-[44px] rounded-full px-3 py-1.5 text-sm font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-input bg-background hover:bg-muted text-foreground"
            )}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
};