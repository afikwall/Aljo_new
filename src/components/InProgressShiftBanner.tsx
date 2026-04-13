import { CheckCircle, Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import { calculateBreak } from "@/utils/shiftUtils";
import { getElapsedHours } from "@/utils/clockInOutUtils";

interface InProgressShiftBannerProps {
  facilityName: string;
  shiftEndDateTime: string;
  clockInTime: string;
  currentTime: Date;
}

export const InProgressShiftBanner = ({
  facilityName,
  shiftEndDateTime,
  clockInTime,
  currentTime,
}: InProgressShiftBannerProps) => {
  const endTimeFormatted = (() => {
    try {
      return format(parseISO(shiftEndDateTime), "h:mm a");
    } catch {
      return "";
    }
  })();

  const elapsedHours = getElapsedHours(clockInTime, currentTime);
  const breakMinutes = calculateBreak(elapsedHours);

  return (
    <div className="rounded-lg bg-accent/10 border border-accent/20 p-4 mb-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-accent shrink-0" />
        <span className="font-semibold">
          You are clocked in at {facilityName}
        </span>
      </div>
      {endTimeFormatted && (
        <p className="text-sm text-muted-foreground mt-1 ml-7">
          Shift ends at {endTimeFormatted}
        </p>
      )}
      <div className="flex items-center gap-2 mt-2 ml-7">
        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground">
          Your {breakMinutes}-minute unpaid break will be auto-deducted from your total hours.
        </p>
      </div>
    </div>
  );
};