import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface TimesheetMonthSelectorProps {
  selectedMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const TimesheetMonthSelector = ({
  selectedMonth,
  onPrevMonth,
  onNextMonth,
}: TimesheetMonthSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={onPrevMonth}
        aria-label="Previous month"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="font-semibold text-sm min-w-[120px] text-center">
        {format(selectedMonth, "MMMM yyyy")}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={onNextMonth}
        aria-label="Next month"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
};