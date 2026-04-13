import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface TimesheetFooterProps {
  totalHours: number;
  shiftCount: number;
  isFiltered?: boolean;
}

export const TimesheetFooter = ({ totalHours, shiftCount, isFiltered }: TimesheetFooterProps) => {
  return (
    <div>
      <Separator />
      <div className="flex items-center gap-3 flex-wrap px-4 py-4">
        <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
          <span className="text-sm text-muted-foreground">Shifts</span>
          <span className="font-semibold text-sm">{shiftCount}</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-accent font-bold text-lg leading-none">
            {totalHours.toFixed(1)} hrs
          </span>
        </div>
        {isFiltered && (
          <Badge variant="secondary" className="text-xs">
            Filtered
          </Badge>
        )}
      </div>
    </div>
  );
};