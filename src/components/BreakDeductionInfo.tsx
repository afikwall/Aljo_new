import { Info } from "lucide-react";
import { calculateBreak } from "@/utils/shiftUtils";
import { getElapsedHours } from "@/utils/clockInOutUtils";

interface BreakDeductionInfoProps {
  clockInTime: string;
  currentTime: Date;
}

export const BreakDeductionInfo = ({
  clockInTime,
  currentTime,
}: BreakDeductionInfoProps) => {
  const elapsedHours = getElapsedHours(clockInTime, currentTime);
  const breakMinutes = calculateBreak(elapsedHours);

  return (
    <div className="rounded-md bg-muted/50 p-3 flex items-center gap-2">
      <Info className="h-4 w-4 text-muted-foreground shrink-0" />
      <p className="text-sm text-muted-foreground">
        {breakMinutes > 0
          ? `Your ${breakMinutes}-minute unpaid break will be auto-deducted`
          : "No break deduction for shifts under 4 hours"}
      </p>
    </div>
  );
};